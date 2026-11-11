import PDFDocument from "pdfkit";
import * as PptxGenJSModule from "pptxgenjs";

type Primitive = string | number | boolean | null | undefined;
type ContentValue = Primitive | ContentValue[] | { [key: string]: ContentValue };

export type ExportSlide = {
  title?: string;
  layout?: string;
  /**
   * JSONB does not preserve object key insertion order. New presentations
   * store the content keys separately in this array so exports can recreate
   * the authored section order.
   */
  sectionOrder?: string[];
  content?: Record<string, ContentValue>;
};

export type ExportPresentation = {
  title: string;
  presentationType?: string | null;
  audience?: string | null;
  slides: ExportSlide[] | Record<string, unknown>;
};

const COLORS = {
  navy: "10243E",
  blue: "1893F7",
  paleBlue: "EAF5FF",
  ink: "172B4D",
  muted: "64748B",
  white: "FFFFFF",
  light: "F8FAFC",
  border: "D8E3EF",
};

const WIDE_WIDTH = 13.333;
const WIDE_HEIGHT = 7.5;

function labelFor(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function textFor(value: ContentValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function orderedContentEntries(
  content: Record<string, ContentValue>,
  sectionOrder?: string[],
): Array<[string, ContentValue]> {
  const entries = Object.entries(content);
  const values = new Map(entries);
  const seen = new Set<string>();
  const orderedKeys: string[] = [];

  if (Array.isArray(sectionOrder)) {
    for (const key of sectionOrder) {
      if (typeof key === "string" && values.has(key) && !seen.has(key)) {
        orderedKeys.push(key);
        seen.add(key);
      }
    }
  }

  // Older records do not have sectionOrder. Sort their remaining keys so
  // their output is still stable after PostgreSQL has normalized the JSONB.
  for (const [key] of entries.map(([entryKey]) => [entryKey] as const).sort(([a], [b]) => (
    a < b ? -1 : a > b ? 1 : 0
  ))) {
    if (!seen.has(key)) {
      orderedKeys.push(key);
      seen.add(key);
    }
  }

  return orderedKeys.map((key) => [key, values.get(key)!]);
}

function contentLines(
  content: Record<string, ContentValue> | undefined,
  sectionOrder?: string[],
): Array<{ label: string; lines: string[] }> {
  if (!content || typeof content !== "object") return [];

  return orderedContentEntries(content, sectionOrder)
    .filter(([, value]) => value !== null && value !== undefined && textFor(value) !== "")
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return {
          label: labelFor(key),
          lines: value.flatMap((item) => {
            if (item && typeof item === "object" && !Array.isArray(item)) {
              return [Object.entries(item).map(([nestedKey, nestedValue]) => `${labelFor(nestedKey)}: ${textFor(nestedValue)}`).join(" • ")];
            }
            return [textFor(item)];
          }),
        };
      }

      if (value && typeof value === "object") {
        return {
          label: labelFor(key),
          lines: Object.entries(value).map(([nestedKey, nestedValue]) => `${labelFor(nestedKey)}: ${textFor(nestedValue)}`),
        };
      }

      return { label: labelFor(key), lines: [textFor(value)] };
    });
}

function slidesFrom(presentation: ExportPresentation): ExportSlide[] {
  if (Array.isArray(presentation.slides)) return presentation.slides;
  if (presentation.slides && typeof presentation.slides === "object") {
    const candidate = (presentation.slides as { slides?: unknown }).slides;
    return Array.isArray(candidate) ? candidate as ExportSlide[] : [];
  }
  return [];
}

function safeFilePart(value: string): string {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "presentation";
}

export function exportFileName(presentation: ExportPresentation, extension: "pptx" | "pdf"): string {
  return `${safeFilePart(presentation.title)}.${extension}`;
}

export async function createPptx(presentation: ExportPresentation): Promise<Buffer> {
  // Vercel's TypeScript adapter sees this constructor as a module namespace.
  // Keep the interop cast here; exercise the real writer in a smoke test.
  const PptxConstructor = PptxGenJSModule.default as unknown as new () => any;
  const pptx = new PptxConstructor();
  const slides = slidesFrom(presentation);
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Build-This";
  pptx.company = "Build-This";
  pptx.subject = `${presentation.title} presentation`;
  pptx.title = presentation.title;
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
  };

  for (const [index, slideData] of slides.entries()) {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.light };
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: WIDE_WIDTH,
      h: 0.16,
      line: { color: COLORS.blue, transparency: 100 },
      fill: { color: COLORS.blue },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0.16,
      w: 0.18,
      h: WIDE_HEIGHT - 0.16,
      line: { color: COLORS.navy, transparency: 100 },
      fill: { color: COLORS.navy },
    });
    slide.addText("BUILD-THIS", {
      x: 0.55,
      y: 0.38,
      w: 2.2,
      h: 0.2,
      fontFace: "Aptos",
      fontSize: 9,
      bold: true,
      charSpacing: 1.8,
      color: COLORS.blue,
      margin: 0,
    });
    slide.addText(`${String(index + 1).padStart(2, "0")}  /  ${slides.length}`, {
      x: 11.3,
      y: 0.38,
      w: 1.45,
      h: 0.2,
      align: "right",
      fontFace: "Aptos",
      fontSize: 9,
      bold: true,
      color: COLORS.muted,
      margin: 0,
    });

    slide.addText(slideData.title || "Untitled slide", {
      x: 0.62,
      y: 0.82,
      w: 11.9,
      h: 0.65,
      fontFace: "Aptos Display",
      fontSize: 27,
      bold: true,
      color: COLORS.ink,
      margin: 0,
      breakLine: false,
      fit: "shrink",
    });
    slide.addText((slideData.layout || "content").toUpperCase(), {
      x: 0.64,
      y: 1.55,
      w: 3,
      h: 0.2,
      fontFace: "Aptos",
      fontSize: 8,
      bold: true,
      charSpacing: 1.5,
      color: COLORS.muted,
      margin: 0,
    });

    const groups = contentLines(slideData.content, slideData.sectionOrder);
    const columns = groups.length > 4 ? 2 : 1;
    const groupWidth = columns === 2 ? 5.85 : 11.7;
    const columnGap = 0.35;
    const rowHeight = groups.length > 6 ? 0.75 : 0.92;
    const startY = 2.02;

    groups.forEach((group, groupIndex) => {
      const column = columns === 2 ? groupIndex % 2 : 0;
      const row = columns === 2 ? Math.floor(groupIndex / 2) : groupIndex;
      const x = 0.64 + column * (groupWidth + columnGap);
      const y = startY + row * rowHeight;
      slide.addShape(pptx.ShapeType.roundRect, {
        x,
        y,
        w: groupWidth,
        h: rowHeight - 0.14,
        rectRadius: 0.05,
        line: { color: COLORS.border, width: 1 },
        fill: { color: COLORS.white },
      });
      slide.addText(group.label.toUpperCase(), {
        x: x + 0.18,
        y: y + 0.12,
        w: groupWidth - 0.36,
        h: 0.15,
        fontFace: "Aptos",
        fontSize: 7.5,
        bold: true,
        charSpacing: 1.1,
        color: COLORS.blue,
        margin: 0,
      });
      slide.addText(group.lines.map((line) => `• ${line}`).join("\n"), {
        x: x + 0.18,
        y: y + 0.32,
        w: groupWidth - 0.36,
        h: rowHeight - 0.45,
        fontFace: "Aptos",
        fontSize: groups.length > 6 ? 10 : 11.5,
        color: COLORS.ink,
        breakLine: false,
        fit: "shrink",
        valign: "middle",
        margin: 0,
        paraSpaceAfter: 4,
      });
    });

    slide.addText(`${presentation.title}  •  ${presentation.audience || "Stakeholders"}`, {
      x: 0.64,
      y: 7.15,
      w: 8,
      h: 0.15,
      fontFace: "Aptos",
      fontSize: 8,
      color: COLORS.muted,
      margin: 0,
    });
  }

  return Buffer.from(await pptx.write({ outputType: "nodebuffer" }) as Buffer);
}

function drawPdfText(doc: PDFKit.PDFDocument, text: string, x: number, y: number, options: PDFKit.Mixins.TextOptions = {}) {
  doc.text(text, x, y, { lineGap: 3, ...options });
}

export async function createPdf(presentation: ExportPresentation): Promise<Buffer> {
  const PDFDocumentConstructor = PDFDocument as unknown as new (options?: PDFKit.PDFDocumentOptions) => PDFKit.PDFDocument;
  const doc = new PDFDocumentConstructor({ size: [960, 540], margin: 0, autoFirstPage: false });
  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  const slides = slidesFrom(presentation);

  slides.forEach((slideData, index) => {
    doc.addPage({ size: [960, 540], margin: 0 });
    doc.save();
    doc.rect(0, 0, 960, 540).fill(`#${COLORS.light}`);
    doc.rect(0, 0, 960, 12).fill(`#${COLORS.blue}`);
    doc.rect(0, 12, 13, 528).fill(`#${COLORS.navy}`);
    doc.restore();

    doc.fillColor(`#${COLORS.blue}`).font("Helvetica-Bold").fontSize(9);
    drawPdfText(doc, "BUILD-THIS", 42, 30, { characterSpacing: 1.5, width: 220 });
    doc.fillColor(`#${COLORS.muted}`).fontSize(9);
    drawPdfText(doc, `${String(index + 1).padStart(2, "0")}  /  ${slides.length}`, 790, 30, { align: "right", width: 120 });

    doc.fillColor(`#${COLORS.ink}`).font("Helvetica-Bold").fontSize(27);
    drawPdfText(doc, slideData.title || "Untitled slide", 46, 76, { width: 850, height: 44, ellipsis: true });
    doc.fillColor(`#${COLORS.muted}`).font("Helvetica-Bold").fontSize(8);
    drawPdfText(doc, (slideData.layout || "content").toUpperCase(), 48, 130, { characterSpacing: 1.3, width: 300 });

    const groups = contentLines(slideData.content, slideData.sectionOrder);
    const columns = groups.length > 4 ? 2 : 1;
    const groupWidth = columns === 2 ? 420 : 844;
    const rowHeight = groups.length > 6 ? 61 : 76;
    const startY = 168;

    groups.forEach((group, groupIndex) => {
      const column = columns === 2 ? groupIndex % 2 : 0;
      const row = columns === 2 ? Math.floor(groupIndex / 2) : groupIndex;
      const x = 46 + column * (groupWidth + 24);
      const y = startY + row * rowHeight;
      doc.save();
      doc.roundedRect(x, y, groupWidth, rowHeight - 10, 6).fillAndStroke(`#${COLORS.white}`, `#${COLORS.border}`);
      doc.restore();
      doc.fillColor(`#${COLORS.blue}`).font("Helvetica-Bold").fontSize(7.5);
      drawPdfText(doc, group.label.toUpperCase(), x + 14, y + 11, { characterSpacing: 1, width: groupWidth - 28 });
      doc.fillColor(`#${COLORS.ink}`).font("Helvetica").fontSize(groups.length > 6 ? 9 : 10);
      drawPdfText(doc, group.lines.map((line) => `• ${line}`).join("\n"), x + 14, y + 29, {
        width: groupWidth - 28,
        height: rowHeight - 38,
        ellipsis: true,
      });
    });

    doc.fillColor(`#${COLORS.muted}`).font("Helvetica").fontSize(8);
    drawPdfText(doc, `${presentation.title}  •  ${presentation.audience || "Stakeholders"}`, 46, 514, { width: 700 });
  });

  doc.end();
  return result;
}

export function isExportSlideArray(value: unknown): value is ExportSlide[] {
  return Array.isArray(value) && value.every((slide) => slide !== null && typeof slide === "object");
}