import { inflateRawSync, inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { createPdf, createPptx } from "../artifacts/api-server/src/lib/presentation-export";
import {
  expectedContentText,
  expectedSlideHeadings,
  representativePresentationFixture,
} from "./fixtures/presentation-fixtures";

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