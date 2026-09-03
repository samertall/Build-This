import { inflateRawSync, inflateSync } from "node:zlib";
import express from "express";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequireAuth } from "../artifacts/api-server/src/middlewares/auth";
import projectsRouter from "../artifacts/api-server/src/routes/projects";
import { createPdf, createPptx } from "../artifacts/api-server/src/lib/presentation-export";
import {
  expectedContentText,
  expectedSlideHeadings,
  representativePresentationFixture,
} from "./fixtures/presentation-fixtures";
import { db, presentationsTable, projectsTable } from "../lib/db/src";
import { eq } from "drizzle-orm";

type ZipEntry = {
  name: string;
  data: Buffer;
};

const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === ZIP_END_OF_CENTRAL_DIRECTORY) return offset;
  }
  throw new Error("PPTX is missing its ZIP end-of-central-directory record");
}

function readPptxEntries(buffer: Buffer): Map<string, Buffer> {
  expect(buffer.subarray(0, 4).toString("hex")).toBe("504b0304");
  const endOfCentralDirectory = findEndOfCentralDirectory(buffer);
  const centralDirectoryEntryCount = buffer.readUInt16LE(endOfCentralDirectory + 10);
  const entries = new Map<string, Buffer>();
  let offset = 0;

  while (offset < endOfCentralDirectory) {
    const signature = buffer.readUInt32LE(offset);
    if (signature === ZIP_CENTRAL_DIRECTORY_HEADER) break;
    if (signature !== ZIP_LOCAL_FILE_HEADER) {
      throw new Error(`Unexpected ZIP record at offset ${offset}`);
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const expectedCrc = buffer.readUInt32LE(offset + 14);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const uncompressedSize = buffer.readUInt32LE(offset + 22);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = buffer.subarray(nameStart, nameStart + fileNameLength).toString("utf8");
    const dataStart = nameStart + fileNameLength + extraFieldLength;
    const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = compressionMethod === 0
      ? Buffer.from(compressedData)
      : compressionMethod === 8
        ? inflateRawSync(compressedData)
        : (() => { throw new Error(`Unsupported ZIP compression method ${compressionMethod}`); })();

    expect(data.length, `uncompressed size for ${name}`).toBe(uncompressedSize);
    expect(crc32(data), `CRC for ${name}`).toBe(expectedCrc);
    entries.set(name, data);
    offset = dataStart + compressedSize;
  }

  expect(entries.size, "ZIP local entry count").toBe(centralDirectoryEntryCount);
  expect(offset).toBeLessThanOrEqual(endOfCentralDirectory);
  return entries;
}

function decodeXmlText(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function slideText(xml: Buffer): string {
  return [...xml.toString("utf8").matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
    .map((match) => decodeXmlText(match[1] ?? ""))
    .join(" ");
}

function pdfText(pdf: Buffer): string {
  const rawPdf = pdf.toString("latin1");
  const extractedText: string[] = [];
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;

  for (const match of rawPdf.matchAll(streamPattern)) {
    const streamStart = match.index + match[0].indexOf(match[1] ?? "");
    const streamEnd = streamStart + (match[1]?.length ?? 0);
    const stream = pdf.subarray(streamStart, streamEnd);
    let decodedStream: Buffer;
    try {
      decodedStream = inflateSync(stream);
    } catch {
      decodedStream = stream;
    }

    for (const textArray of decodedStream.toString("latin1").matchAll(/\[([\s\S]*?)\]\s*TJ/g)) {
      const textRun = [...(textArray[1] ?? "").matchAll(/<([0-9a-f]+)>/gi)]
        .map(([, hex]) => Buffer.from(hex ?? "", "hex").toString("latin1"))
        .join("");
      extractedText.push(textRun);
    }
  }

  return extractedText.join(" ");
}

function expectTextInOrder(text: string, expected: string[]): void {
  let previousIndex = -1;
  for (const value of expected) {
    const index = text.indexOf(value);
    expect(index, `expected "${value}" after the previous section`).toBeGreaterThan(previousIndex);
    previousIndex = index;
  }
}

function binaryParser(
  response: NodeJS.ReadableStream,
  callback: (error: Error | null, body: Buffer) => void,
): void {
  const chunks: Buffer[] = [];
  response.on("data", (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  response.on("end", () => callback(null, Buffer.concat(chunks)));
  response.on("error", (error) => callback(error, Buffer.alloc(0)));
}

describe("presentation exports", () => {
  it("creates an intact PPTX package containing every slide heading and representative content", async () => {
    const pptx = await createPptx(representativePresentationFixture);
    const entries = readPptxEntries(pptx);
    const slideEntries = [...entries.keys()]
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort();

    expect(slideEntries).toHaveLength(representativePresentationFixture.slides.length);
    expect(entries.has("[Content_Types].xml")).toBe(true);
    expect(entries.has("ppt/presentation.xml")).toBe(true);

    const allSlideText = slideEntries.map((name) => slideText(entries.get(name)!)).join(" ");
    for (const heading of expectedSlideHeadings) {
      expect(allSlideText).toContain(heading);
    }
    for (const content of expectedContentText) {
      expect(allSlideText).toContain(content);
    }
  });

  it("creates a readable PDF with the expected page count, headings, and nested content", async () => {
    const pdf = await createPdf(representativePresentationFixture);
    const rawPdf = pdf.toString("latin1");
    const pageCount = (rawPdf.match(/\/Type\s+\/Page\b/g) ?? []).length;
    const text = pdfText(pdf);

    expect(rawPdf.startsWith("%PDF-")).toBe(true);
    expect(rawPdf.includes("%%EOF")).toBe(true);
    expect(pageCount).toBe(representativePresentationFixture.slides.length);
    expect(text).toEqual(expect.stringContaining(expectedSlideHeadings[0]));
    expect(text).toEqual(expect.stringContaining(expectedSlideHeadings[1]));
    expect(text).toEqual(expect.stringContaining(expectedSlideHeadings[2]));
    expect(text).toEqual(expect.stringContaining(expectedContentText[1]));
  });
});

const EXPORT_OWNER_ID = "presentation-export-owner";
const EXPORT_OUTSIDER_ID = "presentation-export-outsider";
const exportApp = express();
exportApp.use(express.json());
exportApp.use((req, _res, next) => {
  req.log = { error: vi.fn() } as never;
  next();
});
exportApp.use("/api", createRequireAuth({
  getUserId: (req) => req.header("x-test-user-id") ?? null,
  getPrimaryEmail: async () => undefined,
}));
exportApp.use("/api", projectsRouter);

let exportProjectId: number;
let exportPresentationId: number;

function asExportUser(req: request.Test, userId: string) {
  return req.set("x-test-user-id", userId);
}

function exportUrl(): string {
  return `/api/projects/${exportProjectId}/presentations/${exportPresentationId}/export`;
}

describe("presentation download routes", () => {
  beforeEach(async () => {
    if (exportProjectId) {
      await db.delete(projectsTable).where(eq(projectsTable.id, exportProjectId));
    }

    const [project] = await db.insert(projectsTable).values({
      ownerId: EXPORT_OWNER_ID,
      name: "Presentation export integration test",
      description: "Download boundary test project",
      status: "active",
    }).returning({ id: projectsTable.id });
    if (!project) throw new Error("Failed to create export test project");
    exportProjectId = project.id;

    const [presentation] = await db.insert(presentationsTable).values({
      projectId: exportProjectId,
      title: representativePresentationFixture.title,
      presentationType: representativePresentationFixture.presentationType,
      audience: representativePresentationFixture.audience,
      slideCount: representativePresentationFixture.slides.length,
      slides: representativePresentationFixture.slides,
      status: "ready",
    }).returning({ id: presentationsTable.id });
    if (!presentation) throw new Error("Failed to create export test presentation");
    exportPresentationId = presentation.id;
  });

  afterAll(async () => {
    if (exportProjectId) {
      await db.delete(projectsTable).where(eq(projectsTable.id, exportProjectId));
    }
  });

  it("rejects unauthenticated and unauthorized download requests", async () => {
    const unauthenticated = await request(exportApp).get(`${exportUrl()}/pptx`);
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.body).toEqual({ error: "Unauthorized" });

    const unauthorized = await asExportUser(
      request(exportApp).get(`${exportUrl()}/pdf`),
      EXPORT_OUTSIDER_ID,
    );
    expect(unauthorized.status).toBe(404);
    expect(unauthorized.body).toEqual({ error: "Not found" });
  });

  it.each([
    {
      format: "pptx",
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      signature: "504b0304",
    },
    {
      format: "pdf",
      contentType: "application/pdf",
      signature: "255044462d",
    },
  ])("sends a complete private .$format download with its expected file details", async ({
    format,
    contentType,
    signature,
  }) => {
    const response = await asExportUser(
      request(exportApp).get(`${exportUrl()}/${format}`).buffer(true).parse(binaryParser),
      EXPORT_OWNER_ID,
    );

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBe(contentType);
    expect(response.headers["content-disposition"]).toBe(
      `attachment; filename="customer-discovery-readout.${format}"`,
    );
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(response.body).toBeInstanceOf(Buffer);
    expect(response.body.length).toBeGreaterThan(0);
    expect(Number(response.headers["content-length"])).toBe(response.body.length);
    expect(response.body.subarray(0, format === "pptx" ? 4 : 5).toString("hex")).toBe(signature);

    const exportedText = format === "pptx"
      ? slideText(readPptxEntries(response.body).get("ppt/slides/slide1.xml")!)
      : pdfText(response.body);
    expectTextInOrder(exportedText, ["HEADLINE", "EVIDENCE", "RECOMMENDATION"]);
  });

  it("returns documented errors for missing and malformed presentation data", async () => {
    const missing = await asExportUser(
      request(exportApp).get(`/api/projects/${exportProjectId}/presentations/999999/export/pdf`),
      EXPORT_OWNER_ID,
    );
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: "Presentation not found" });

    await db.update(presentationsTable)
      .set({ slides: { malformed: true } })
      .where(eq(presentationsTable.id, exportPresentationId));
    const malformed = await asExportUser(
      request(exportApp).get(`${exportUrl()}/pptx`),
      EXPORT_OWNER_ID,
    );
    expect(malformed.status).toBe(422);
    expect(malformed.body).toEqual({ error: "This presentation does not contain exportable slides" });
  });
});