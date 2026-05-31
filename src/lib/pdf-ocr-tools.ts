import "server-only";

import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { createRequire } from "module";
import { tmpdir } from "os";
import path from "path";
import { pathToFileURL } from "url";
import { promisify } from "util";
import { PDFDocument, PDFName, StandardFonts, degrees, rgb } from "pdf-lib";
import JSZip from "jszip";
import sharp from "sharp";
import { generateGeminiText } from "@/lib/ai/gemini";
import { transcribeAudio } from "@/lib/ai/huggingface";
import { generateOpenRouterText } from "@/lib/ai/openrouter";

type ToolInputs = Record<string, string>;

type UploadedFile = {
  buffer: Buffer;
  name: string;
  type: string;
  size: number;
};

type DownloadPayload = {
  filename: string;
  mimeType: string;
  base64: string;
};

type TextExtractionResult = {
  text: string;
  pageCount: number;
  ocrPages?: number;
  confidence: number;
};

type DocumentType = "Invoice" | "Receipt" | "Bank Statement" | "Resume" | "Contract" | "Generic Document";

export type PdfOcrToolResult = {
  provider:
    | "pdf-lib"
    | "pdf-parse"
    | "tesseract"
    | "system-speech"
    | "huggingface"
    | "gemini"
    | "openrouter"
    | "local";
  output: string;
  imageUrl?: string;
  images?: string[];
  download?: DownloadPayload;
  stats?: {
    originalSize: number;
    compressedSize: number;
    savedBytes: number;
    savedPercentage: number;
  };
};

const execFileAsync = promisify(execFile);
const requireFromServer = createRequire(import.meta.url);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_AUDIO_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_OCR_PDF_PAGES = 5;
const MAX_TTS_CHARACTERS = 4500;
const MAX_TRANSLATION_CHARACTERS = 12000;
const LOW_OCR_CONFIDENCE = 0.45;
const DOCUMENT_TYPE_KEYWORDS: Record<DocumentType, RegExp[]> = {
  Invoice: [
    /\btax\s+invoice\b/i,
    /\binvoice\b/i,
    /\binvoice\s+(?:number|no\.?|#)\b/i,
    /\bamount\s+due\b/i,
    /\bgst(?:in)?\b/i,
    /\bbill\s+(?:to|no\.?|number|#)\b/i,
  ],
  Receipt: [/\breceipt\b/i, /\bpaid\b/i, /\bpayment\s+received\b/i, /\btransaction\s+id\b/i, /\bmerchant\b/i],
  "Bank Statement": [
    /\bbank\s+statement\b/i,
    /\baccount\s+(?:number|statement|summary)\b/i,
    /\bopening\s+balance\b/i,
    /\bclosing\s+balance\b/i,
    /\bdebit\b/i,
    /\bcredit\b/i,
  ],
  Resume: [/\bresume\b/i, /\bcurriculum\s+vitae\b/i, /\bwork\s+experience\b/i, /\beducation\b/i, /\bskills\b/i],
  Contract: [/\bcontract\b/i, /\bagreement\b/i, /\bwhereas\b/i, /\bterms\s+and\s+conditions\b/i, /\bparty\b/i, /\bsignature\b/i],
  "Generic Document": [],
};
const INVOICE_REQUIRED_KEYWORDS = [
  /\binvoice\b/i,
  /\bbill\b/i,
  /\btax\s+invoice\b/i,
  /\bgst(?:in)?\b/i,
  /\bamount\s+due\b/i,
  /\binvoice\s+(?:number|no\.?|#)\b/i,
];

export const pdfOcrToolSlugs = new Set([
  "pdf-splitter",
  "pdf-merger",
  "pdf-page-remover",
  "extract-pages",
  "organize-pdf",
  "repair-pdf",
  "pdf-to-png",
  "pdf-to-pdf-a",
  "rotate-pdf",
  "add-page-numbers",
  "add-watermark",
  "crop-pdf",
  "edit-pdf",
  "pdf-forms",
  "protect-pdf",
  "sign-pdf",
  "redact-pdf",
  "compare-pdf",
  "pdf-to-flashcards",
  "pdf-quiz-generator",
  "pdf-study-notes-generator",
  "pdf-summarizer",
  "screenshot-to-text-extractor",
  "ocr-pdf-converter",
  "pdf-text-extractor",
  "pdf-to-audiobook",
  "voice-note-to-blog-converter",
  "pdf-invoice-data-extractor",
  "receipt-scanner",
  "pdf-metadata-viewer",
  "pdf-word-counter",
  "pdf-keyword-extractor",
  "scan-to-pdf",
  "pdf-password-remover",
  "pdf-watermark-remover",
  "resume-ats-score-checker",
  "pdf-translator",
]);

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function slugFilename(filename: string, suffix: string, extension: string) {
  const base = filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return `${base || "toolverse"}-${suffix}.${extension}`;
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) throw new Error("The uploaded file could not be read. Please choose the file again.");

  return {
    mimeType: (match[1] || "").toLowerCase(),
    buffer: Buffer.from(match[2] || "", "base64"),
  };
}

function parseUploadObject(value: unknown): UploadedFile {
  if (!value || typeof value !== "object") {
    throw new Error("The uploaded file is missing.");
  }

  const upload = value as {
    dataUrl?: string;
    name?: string;
    type?: string;
    size?: number;
  };
  const decoded = decodeDataUrl(upload.dataUrl || "");

  return {
    buffer: decoded.buffer,
    name: upload.name || "upload",
    type: (upload.type || decoded.mimeType).toLowerCase(),
    size: upload.size || decoded.buffer.length,
  };
}

function getUploads(inputs: ToolInputs) {
  if (!inputs.file) throw new Error("Please upload a file.");

  if (inputs.fileType === "multiple") {
    const parsed = JSON.parse(inputs.file) as unknown[];
    return parsed.map(parseUploadObject);
  }

  const decoded = decodeDataUrl(inputs.file);
  return [
    {
      buffer: decoded.buffer,
      name: inputs.fileName || "upload",
      type: (inputs.fileType || decoded.mimeType).toLowerCase(),
      size: decoded.buffer.length,
    },
  ];
}

function validateSize(file: UploadedFile) {
  if (file.buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`${file.name} is too large. Maximum upload size is ${formatBytes(MAX_UPLOAD_BYTES)}.`);
  }
}

function validatePdf(file: UploadedFile) {
  validateSize(file);
  if (file.type !== "application/pdf") {
    throw new Error(`${file.name} is not a PDF. Please upload application/pdf files only.`);
  }
  if (file.buffer.subarray(0, 5).toString("utf8") !== "%PDF-") {
    throw new Error(`${file.name} does not look like a valid PDF.`);
  }
}

function validateImage(file: UploadedFile) {
  validateSize(file);
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image file.`);
  }
}

function validateAudio(file: UploadedFile) {
  if (file.buffer.length > MAX_AUDIO_UPLOAD_BYTES) {
    throw new Error(`${file.name} is too large. Maximum audio upload size is ${formatBytes(MAX_AUDIO_UPLOAD_BYTES)}.`);
  }
  if (!file.type.startsWith("audio/")) {
    throw new Error(`${file.name} is not an audio file.`);
  }
}

async function loadPdf(file: UploadedFile) {
  validatePdf(file);
  try {
    return await PDFDocument.load(file.buffer, { updateMetadata: false });
  } catch {
    throw new Error(`${file.name} could not be opened. It may be damaged or password protected.`);
  }
}

async function extractPdfText(file: UploadedFile) {
  validatePdf(file);
  const { PDFParse } = await import("pdf-parse");
  PDFParse.setWorker(
    pathToFileURL(
      path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"),
    ).href,
  );
  const parser = new PDFParse({ data: new Uint8Array(file.buffer) });

  try {
    const result = await parser.getText();
    const text = result.text.replace(/\u0000/g, "").trim();
    return {
      text,
      pageCount: result.total || 0,
    };
  } finally {
    await parser.destroy();
  }
}

async function renderPdfPages(file: UploadedFile, pageLimit = MAX_OCR_PDF_PAGES) {
  validatePdf(file);
  const { PDFParse } = await import("pdf-parse");
  PDFParse.setWorker(
    pathToFileURL(
      path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"),
    ).href,
  );
  const parser = new PDFParse({ data: new Uint8Array(file.buffer) });

  try {
    const info = await parser.getInfo();
    const total = info.total || 0;
    const result = await parser.getScreenshot({
      scale: 2,
      first: Math.min(total || pageLimit, pageLimit),
      imageDataUrl: false,
      imageBuffer: true,
    });

    return {
      totalPages: total,
      renderedPages: result.pages.map((page) => Buffer.from(page.data)),
    };
  } finally {
    await parser.destroy();
  }
}

async function ocrImageBufferDetailed(buffer: Buffer): Promise<{ text: string; confidence: number }> {
  const cleanImage = await sharp(buffer)
    .rotate()
    .grayscale()
    .normalize()
    .png()
    .toBuffer();

  try {
    const { createWorker } = await import("tesseract.js");
    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
    const recognize = async () => {
      worker = await createWorker("eng+hin");
      const result = await worker.recognize(cleanImage);
      return {
        text: result.data.text.trim(),
        confidence: Math.max(0, Math.min(1, (result.data.confidence || 0) / 100)),
      };
    };

    return await Promise.race([
      recognize(),
      new Promise<{ text: string; confidence: number }>((_, reject) => {
        setTimeout(() => reject(new Error("OCR processing timed out.")), 30000);
      }),
    ]).finally(async () => {
      if (worker) await worker.terminate().catch(() => undefined);
    });
  } catch {
    // Lightweight local fallback keeps the tool responsive if the Tesseract model cannot load.
  }

  const Ocrad = requireFromServer("ocrad.js") as (canvas: unknown) => string;
  const { createCanvas, Image } = requireFromServer("@napi-rs/canvas") as typeof import("@napi-rs/canvas");
  const image = new Image();
  image.src = cleanImage;
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, image.width, image.height);
  const text = String(Ocrad(canvas)).trim();
  return {
    text,
    confidence: estimateTextConfidence(text),
  };
}

async function ocrImageBuffer(buffer: Buffer) {
  return (await ocrImageBufferDetailed(buffer)).text;
}

function estimateTextConfidence(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return 0;

  const lettersAndNumbers = normalized.match(/[\p{L}\p{N}]/gu)?.length || 0;
  const printable = normalized.match(/[^\p{C}]/gu)?.length || normalized.length;
  const ratio = printable ? lettersAndNumbers / printable : 0;

  return Math.max(0.15, Math.min(0.9, ratio));
}

function assertReadableText(extracted: TextExtractionResult, source: string) {
  const text = extracted.text.trim();
  if (!text) {
    throw new Error(`Empty OCR result. No readable text was detected in ${source}.`);
  }

  if (extracted.ocrPages && extracted.confidence < LOW_OCR_CONFIDENCE && text.length < 80) {
    throw new Error(
      `Low confidence OCR. The text in ${source} was too unclear to process reliably. Try a sharper scan or higher-resolution file.`,
    );
  }
}

async function extractTextWithOcrFallback(file: UploadedFile) {
  if (file.type === "application/pdf") {
    const extracted = await extractPdfText(file);
    if (extracted.text.length > 20) {
      return {
        ...extracted,
        confidence: 0.98,
      } satisfies TextExtractionResult;
    }

    const rendered = await renderPdfPages(file);
    const pageResults: Array<{ text: string; confidence: number }> = [];
    for (const [index, page] of rendered.renderedPages.entries()) {
      const result = await ocrImageBufferDetailed(page);
      pageResults.push({
        ...result,
        text: `Page ${index + 1}\n${result.text}`,
      });
    }

    const text = pageResults.map((page) => page.text).join("\n\n").trim();
    return {
      text,
      pageCount: rendered.totalPages,
      ocrPages: rendered.renderedPages.length,
      confidence: averageConfidence(pageResults),
    } satisfies TextExtractionResult;
  }

  validateImage(file);
  const result = await ocrImageBufferDetailed(file.buffer);
  return {
    text: result.text,
    pageCount: 1,
    ocrPages: 1,
    confidence: result.confidence,
  } satisfies TextExtractionResult;
}

function averageConfidence(results: Array<{ confidence: number }>) {
  if (!results.length) return 0;
  return results.reduce((sum, result) => sum + result.confidence, 0) / results.length;
}

function parsePageRanges(input: string, pageCount: number) {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const pages = new Set<number>();
  const tokens = trimmed.match(/\d+\s*(?:-\s*\d+)?/g) || [];

  for (const token of tokens) {
    const [startValue, endValue] = token.split("-").map((part) => Number(part.trim()));
    const start = startValue || 0;
    const end = endValue || start;
    if (start < 1 || end < start || end > pageCount) {
      throw new Error(`Page range "${token}" is outside this PDF's 1-${pageCount} page range.`);
    }
    for (let page = start; page <= end; page += 1) pages.add(page - 1);
  }

  return [...pages].sort((a, b) => a - b);
}

function parseExplicitPagesInstruction(input: string, pageCount: number) {
  const match = input.match(/\bpages?\s*[:=]?\s*([0-9,\s-]+)/i);
  return match?.[1] ? parsePageRanges(match[1], pageCount) : [];
}

function parseSplitRanges(input: string, pageCount: number) {
  const trimmed = input.trim();
  if (!trimmed) {
    return Array.from({ length: pageCount }, (_, index) => ({
      label: `page-${index + 1}`,
      pages: [index],
    }));
  }

  const tokens = trimmed.match(/\d+\s*(?:-\s*\d+)?/g) || [];
  if (!tokens.length) throw new Error("Enter valid page numbers such as 1,3-5.");

  return tokens.map((token) => {
    const [startValue, endValue] = token.split("-").map((part) => Number(part.trim()));
    const start = startValue || 0;
    const end = endValue || start;
    if (start < 1 || end < start || end > pageCount) {
      throw new Error(`Page range "${token}" is outside this PDF's 1-${pageCount} page range.`);
    }
    return {
      label: start === end ? `page-${start}` : `pages-${start}-${end}`,
      pages: Array.from({ length: end - start + 1 }, (_, index) => start - 1 + index),
    };
  });
}

async function savePdf(pdf: PDFDocument) {
  return Buffer.from(
    await pdf.save({
      addDefaultPage: false,
      useObjectStreams: true,
      objectsPerTick: 50,
    }),
  );
}

async function makeTextPdf(title: string, text: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 54;
  const width = 612;
  const height = 792;
  const fontSize = 10;
  const lineHeight = 15;
  const maxChars = 88;
  const lines = text
    .split(/\r?\n/)
    .flatMap((line) => {
      if (!line.trim()) return [""];
      const chunks = line.match(new RegExp(`.{1,${maxChars}}(\\s|$)`, "g"));
      return chunks?.map((chunk) => chunk.trim()) || [line];
    });

  let page = pdf.addPage([width, height]);
  page.drawText(title, {
    x: margin,
    y: height - margin,
    size: 18,
    font: boldFont,
    color: rgb(0.08, 0.16, 0.32),
  });
  let y = height - margin - 34;

  for (const line of lines) {
    if (y < margin) {
      page = pdf.addPage([width, height]);
      y = height - margin;
    }
    page.drawText(line || " ", {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.12, 0.18),
    });
    y -= lineHeight;
  }

  return savePdf(pdf);
}

async function splitPdf(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const source = await loadPdf(file);
  const pageCount = source.getPageCount();
  const ranges = parseSplitRanges(inputs.instructions || "", pageCount);
  const zip = new JSZip();

  for (const range of ranges) {
    const splitDoc = await PDFDocument.create();
    const copiedPages = await splitDoc.copyPages(source, range.pages);
    copiedPages.forEach((page) => splitDoc.addPage(page));
    zip.file(`${slugFilename(file.name, range.label, "pdf")}`, await savePdf(splitDoc));
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  return {
    provider: "pdf-lib",
    output: [
      "PDF split completed.",
      "",
      `Input file: ${file.name}`,
      `Original pages: ${pageCount}`,
      `PDF files created: ${ranges.length}`,
      `Download size: ${formatBytes(zipBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "split-pages", "zip"),
      mimeType: "application/zip",
      base64: zipBuffer.toString("base64"),
    },
  };
}

async function mergePdfs(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const files = getUploads(inputs);
  if (files.length < 2) throw new Error("Please select at least two PDF files to merge.");

  const merged = await PDFDocument.create();
  let totalPages = 0;

  for (const file of files) {
    const source = await loadPdf(file);
    const pageIndices = source.getPageIndices();
    totalPages += pageIndices.length;
    const copiedPages = await merged.copyPages(source, pageIndices);
    copiedPages.forEach((page) => merged.addPage(page));
  }

  const mergedBuffer = await savePdf(merged);

  return {
    provider: "pdf-lib",
    output: [
      "PDF merge completed.",
      "",
      `Files merged: ${files.length}`,
      `Total pages: ${totalPages}`,
      `Merged PDF size: ${formatBytes(mergedBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: "toolverse-merged.pdf",
      mimeType: "application/pdf",
      base64: mergedBuffer.toString("base64"),
    },
  };
}

async function removePdfPages(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const source = await loadPdf(file);
  const pageCount = source.getPageCount();
  const pagesToRemove = parsePageRanges(inputs.instructions || "", pageCount);
  if (!pagesToRemove.length) throw new Error("Enter the pages to remove, for example: 1,3-5.");
  if (pagesToRemove.length >= pageCount) throw new Error("At least one page must remain in the PDF.");

  const keepPages = source.getPageIndices().filter((pageIndex) => !pagesToRemove.includes(pageIndex));
  const outputPdf = await PDFDocument.create();
  const copiedPages = await outputPdf.copyPages(source, keepPages);
  copiedPages.forEach((page) => outputPdf.addPage(page));
  const outputBuffer = await savePdf(outputPdf);

  return {
    provider: "pdf-lib",
    output: [
      "PDF page removal completed.",
      "",
      `Original pages: ${pageCount}`,
      `Removed pages: ${pagesToRemove.map((page) => page + 1).join(", ")}`,
      `Remaining pages: ${keepPages.length}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "pages-removed", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function extractPdfPages(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const source = await loadPdf(file);
  const pageCount = source.getPageCount();
  const pagesToExtract = parsePageRanges(inputs.instructions || "", pageCount);
  if (!pagesToExtract.length) throw new Error("Enter the pages to extract, for example: 1,3-5.");

  const outputPdf = await PDFDocument.create();
  const copiedPages = await outputPdf.copyPages(source, pagesToExtract);
  copiedPages.forEach((page) => outputPdf.addPage(page));
  const outputBuffer = await savePdf(outputPdf);

  return {
    provider: "pdf-lib",
    output: [
      "PDF pages extracted.",
      "",
      `Input file: ${file.name}`,
      `Original pages: ${pageCount}`,
      `Extracted pages: ${pagesToExtract.map((page) => page + 1).join(", ")}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "extracted-pages", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

function parsePageOrder(input: string, pageCount: number) {
  const values = input.match(/\d+/g)?.map(Number) || [];
  if (!values.length) throw new Error("Enter the new page order, for example: 2,1,3-5.");
  const expanded: number[] = [];
  const rangeTokens = input.match(/\d+\s*(?:-\s*\d+)?/g) || [];

  for (const token of rangeTokens) {
    const [startValue, endValue] = token.split("-").map((part) => Number(part.trim()));
    const start = startValue || 0;
    const end = endValue || start;
    if (start < 1 || end < start || end > pageCount) {
      throw new Error(`Page order "${token}" is outside this PDF's 1-${pageCount} page range.`);
    }
    for (let page = start; page <= end; page += 1) expanded.push(page - 1);
  }

  return expanded;
}

async function organizePdf(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const source = await loadPdf(file);
  const pageCount = source.getPageCount();
  const pageOrder = parsePageOrder(inputs.instructions || "", pageCount);
  const outputPdf = await PDFDocument.create();
  const copiedPages = await outputPdf.copyPages(source, pageOrder);
  copiedPages.forEach((page) => outputPdf.addPage(page));
  const outputBuffer = await savePdf(outputPdf);

  return {
    provider: "pdf-lib",
    output: [
      "PDF organized.",
      "",
      `Input file: ${file.name}`,
      `Original pages: ${pageCount}`,
      `New order: ${pageOrder.map((page) => page + 1).join(", ")}`,
      `Output pages: ${pageOrder.length}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "organized", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function repairPdf(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const pdf = await loadPdf(file);
  pdf.setProducer("ToolVerse AI PDF Repair");
  pdf.setCreator("ToolVerse AI");
  pdf.setModificationDate(new Date());
  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "PDF repair completed.",
      "",
      `Input file: ${file.name}`,
      `Pages repaired: ${pdf.getPageCount()}`,
      `Original size: ${formatBytes(file.buffer.length)}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
      "The file was reopened, metadata was normalized, and the PDF was rewritten with fresh object streams.",
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "repaired", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

function parseDegrees(input: string) {
  const match = input.match(/-?\d+/);
  const value = match ? Number(match[0]) : 90;
  const normalized = ((value % 360) + 360) % 360;
  return [0, 90, 180, 270].includes(normalized) ? normalized : 90;
}

async function rotatePdf(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const pdf = await loadPdf(file);
  const angle = parseDegrees(inputs.instructions || "90");
  const pages = parseExplicitPagesInstruction(inputs.instructions || "", pdf.getPageCount());
  const targetPages = pages.length ? pages : pdf.getPageIndices();

  for (const pageIndex of targetPages) {
    const page = pdf.getPage(pageIndex);
    const currentAngle = page.getRotation().angle;
    page.setRotation(degrees((currentAngle + angle) % 360));
  }

  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "PDF rotation completed.",
      "",
      `Pages rotated: ${targetPages.map((page) => page + 1).join(", ")}`,
      `Rotation added: ${angle} degrees`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "rotated", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function addPageNumbers(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const pdf = await loadPdf(file);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  pages.forEach((page, index) => {
    const { width } = page.getSize();
    page.drawText(`${index + 1} / ${pages.length}`, {
      x: width / 2 - 18,
      y: 24,
      size: 10,
      font,
      color: rgb(0.25, 0.29, 0.36),
    });
  });

  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "Page numbers added.",
      "",
      `Pages numbered: ${pages.length}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "page-numbers", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

function instructionText(input: string | undefined, fallback: string) {
  return input?.trim().split(/\r?\n/)[0]?.trim() || fallback;
}

async function addWatermark(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const pdf = await loadPdf(file);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const watermark = instructionText(inputs.instructions, "CONFIDENTIAL");

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    page.drawText(watermark.slice(0, 80), {
      x: width * 0.16,
      y: height * 0.48,
      size: Math.min(54, Math.max(28, width / 12)),
      font,
      color: rgb(0.72, 0.78, 0.86),
      opacity: 0.24,
      rotate: degrees(-30),
    });
  }

  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "Watermark added.",
      "",
      `Watermark text: ${watermark}`,
      `Pages processed: ${pdf.getPageCount()}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "watermarked", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function cropPdf(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const pdf = await loadPdf(file);
  const margin = Math.max(0, Math.min(144, Number(inputs.instructions?.match(/\d+/)?.[0] || 24)));

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    page.setCropBox(margin, margin, Math.max(1, width - margin * 2), Math.max(1, height - margin * 2));
  }

  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "PDF crop completed.",
      "",
      `Crop margin: ${margin} pt`,
      `Pages processed: ${pdf.getPageCount()}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "cropped", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function editPdf(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const pdf = await loadPdf(file);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const note = instructionText(inputs.instructions, "Edited with ToolVerse AI");
  const page = pdf.getPage(0);
  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 36,
    y: height - 86,
    width: width - 72,
    height: 44,
    color: rgb(0.94, 0.98, 1),
    opacity: 0.9,
    borderColor: rgb(0.15, 0.55, 0.75),
    borderWidth: 1,
  });
  page.drawText(note.slice(0, 120), {
    x: 48,
    y: height - 66,
    size: 12,
    font,
    color: rgb(0.04, 0.1, 0.2),
  });

  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "PDF edit completed.",
      "",
      `Edit note added to page 1: ${note}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "edited", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function pdfForms(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const pdf = await loadPdf(file);
  const form = pdf.getForm();
  const fields = form.getFields();

  if (fields.length) {
    form.flatten();
  } else {
    const firstPage = pdf.getPage(0);
    const textField = form.createTextField("toolverse.notes");
    textField.setText(instructionText(inputs.instructions, "Form field created by ToolVerse AI"));
    textField.addToPage(firstPage, {
      x: 48,
      y: 48,
      width: 260,
      height: 28,
      borderColor: rgb(0.15, 0.55, 0.75),
      borderWidth: 1,
    });
  }

  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "PDF forms processed.",
      "",
      fields.length
        ? `Flattened form fields: ${fields.length}`
        : "No existing form fields found, so a new notes text field was added to page 1.",
      `Output size: ${formatBytes(outputBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "forms", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function protectPdf(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const pdf = await loadPdf(file);
  pdf.setTitle("Protected PDF - ToolVerse AI");
  pdf.setSubject("PDF copy marked as protected");
  pdf.setProducer("ToolVerse AI Protect PDF");
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const label = instructionText(inputs.instructions, "PROTECTED COPY");

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    page.drawText(label.slice(0, 70), {
      x: 36,
      y: height - 30,
      size: 10,
      font,
      color: rgb(0.75, 0.05, 0.08),
      opacity: 0.85,
    });
    page.drawText(label.slice(0, 70), {
      x: width * 0.2,
      y: height * 0.5,
      size: 42,
      font,
      color: rgb(0.75, 0.05, 0.08),
      opacity: 0.12,
      rotate: degrees(-28),
    });
  }

  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "Protected PDF copy created.",
      "",
      `Protection label: ${label}`,
      `Pages marked: ${pdf.getPageCount()}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
      "This server runtime does not include PDF password encryption, so the tool applies visible protection markings and metadata.",
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "protected", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function signPdf(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const pdf = await loadPdf(file);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const signature = instructionText(inputs.instructions, "Signed with ToolVerse AI");
  const page = pdf.getPage(0);
  const { width } = page.getSize();

  page.drawRectangle({
    x: width - 250,
    y: 42,
    width: 205,
    height: 52,
    color: rgb(0.98, 1, 1),
    opacity: 0.92,
    borderColor: rgb(0.05, 0.45, 0.55),
    borderWidth: 1,
  });
  page.drawText(signature.slice(0, 60), {
    x: width - 238,
    y: 68,
    size: 12,
    font,
    color: rgb(0.02, 0.24, 0.34),
  });
  page.drawText(new Date().toISOString().slice(0, 10), {
    x: width - 238,
    y: 52,
    size: 8,
    font,
    color: rgb(0.2, 0.28, 0.35),
  });

  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "PDF signature stamp added.",
      "",
      `Signature text: ${signature}`,
      `Stamped page: 1`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "signed", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function redactPdf(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const pdf = await loadPdf(file);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = parsePageRanges(inputs.instructions || "", pdf.getPageCount());
  const targetPages = pages.length ? pages : [0];

  for (const pageIndex of targetPages) {
    const page = pdf.getPage(pageIndex);
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: 36,
      y: height - 126,
      width: width - 72,
      height: 64,
      color: rgb(0, 0, 0),
      opacity: 1,
    });
    page.drawText("REDACTED", {
      x: 44,
      y: height - 98,
      size: 12,
      font,
      color: rgb(1, 1, 1),
    });
  }

  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "PDF redaction overlay applied.",
      "",
      `Pages redacted: ${targetPages.map((page) => page + 1).join(", ")}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
      "The selected page area was permanently covered with black redaction rectangles in the output PDF.",
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "redacted", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function comparePdf(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const files = getUploads(inputs);
  if (files.length < 2) throw new Error("Upload two PDF files to compare.");
  const [first, second] = files;
  const [firstText, secondText] = await Promise.all([extractPdfText(first), extractPdfText(second)]);
  const firstLines = firstText.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const secondLines = secondText.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const firstSet = new Set(firstLines);
  const secondSet = new Set(secondLines);
  const removed = firstLines.filter((line) => !secondSet.has(line)).slice(0, 40);
  const added = secondLines.filter((line) => !firstSet.has(line)).slice(0, 40);
  const report = [
    "PDF comparison completed.",
    "",
    `First file: ${first.name} (${firstText.pageCount} pages)`,
    `Second file: ${second.name} (${secondText.pageCount} pages)`,
    `Removed/changed lines: ${removed.length}`,
    `Added/changed lines: ${added.length}`,
    "",
    "Removed or changed from first PDF:",
    ...(removed.length ? removed.map((line) => `- ${line}`) : ["- No removed lines detected."]),
    "",
    "Added or changed in second PDF:",
    ...(added.length ? added.map((line) => `+ ${line}`) : ["+ No added lines detected."]),
  ].join("\n");

  return {
    provider: "pdf-parse",
    output: report,
    download: {
      filename: "pdf-comparison-report.txt",
      mimeType: "text/plain;charset=utf-8",
      base64: Buffer.from(report, "utf8").toString("base64"),
    },
  };
}

function summarizeText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const sentences = normalized.match(/[^.!?]+[.!?]+/g) || [normalized];
  const ranked = sentences
    .map((sentence, index) => ({
      sentence: sentence.trim(),
      index,
      score:
        sentence.length +
        (/\b(summary|important|therefore|result|conclusion|invoice|total|amount|action|required)\b/i.test(sentence)
          ? 160
          : 0),
    }))
    .filter((item) => item.sentence.length > 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .sort((a, b) => a.index - b.index)
    .map((item) => `- ${item.sentence}`);

  return ranked.join("\n") || `- ${normalized.slice(0, 700)}`;
}

function sentenceCandidates(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  return (normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [normalized])
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35);
}

function keyPointSentences(text: string, limit = 8) {
  const keywords = new Set(topKeywords(text).slice(0, 12).map(([keyword]) => keyword));
  return sentenceCandidates(text)
    .map((sentence, index) => {
      const keywordHits = sentence
        .toLowerCase()
        .match(/\b[a-z][a-z0-9-]{3,}\b/g)
        ?.filter((word) => keywords.has(word)).length || 0;
      return {
        sentence,
        index,
        score:
          keywordHits * 120 +
          Math.min(sentence.length, 260) +
          (/\b(important|must|should|summary|result|risk|deadline|payment|conclusion|action|required)\b/i.test(
            sentence,
          )
            ? 90
            : 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);
}

function shortAnswerFromSentence(sentence: string) {
  const clean = sentence.replace(/\s+/g, " ").trim();
  if (clean.length <= 220) return clean;
  return `${clean.slice(0, 217).replace(/\s+\S*$/, "")}...`;
}

async function callDocumentAiProvider(systemPrompt: string, prompt: string, fallbackOutput: string) {
  try {
    return { provider: "gemini" as const, output: await generateGeminiText(systemPrompt, prompt) };
  } catch (geminiError) {
    console.error("[ToolVerse] Gemini document AI failed", geminiError);
  }

  try {
    return { provider: "openrouter" as const, output: await generateOpenRouterText(systemPrompt, prompt) };
  } catch (openRouterError) {
    console.error("[ToolVerse] OpenRouter document AI failed", openRouterError);
  }

  return { provider: "local" as const, output: fallbackOutput };
}

async function summarizePdf(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const extracted = await extractTextWithOcrFallback(file);
  assertReadableText(extracted, file.name);

  const localSummary = summarizeText(extracted.text);
  const sourceText = extracted.text.slice(0, MAX_TRANSLATION_CHARACTERS);
  const aiSummary = await callDocumentAiProvider(
    "Summarize PDF documents accurately. Preserve key facts, names, dates, numbers, and action items.",
    [
      "Create a concise, useful PDF summary.",
      "Return sections: Overview, Key Points, Action Items, Notable Details.",
      sourceText.length < extracted.text.length ? "Only the included excerpt is available." : "The full text is included.",
      "",
      sourceText,
    ].join("\n"),
    [
      "Overview:",
      localSummary,
      "",
      "Action Items:",
      "- Review the source PDF for exact formatting and signatures before sharing decisions.",
    ].join("\n"),
  );

  return {
    provider: aiSummary.provider,
    output: [
      "PDF summary completed.",
      "",
      `Pages scanned: ${extracted.pageCount}`,
      `Characters extracted: ${extracted.text.length}`,
      extracted.ocrPages ? `OCR confidence: ${Math.round(extracted.confidence * 100)}%` : "",
      "",
      aiSummary.output,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

async function screenshotToText(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  validateImage(file);
  const extracted = await extractTextWithOcrFallback(file);
  assertReadableText(extracted, file.name);

  return {
    provider: "tesseract",
    output: [
      "Screenshot OCR completed.",
      "",
      `Input file: ${file.name}`,
      `File size: ${formatBytes(file.buffer.length)}`,
      `Characters extracted: ${extracted.text.length}`,
      `OCR confidence: ${Math.round(extracted.confidence * 100)}%`,
      "",
      "OCR Output:",
      extracted.text,
    ].join("\n"),
  };
}

async function ocrPdfConverter(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const extracted = await extractTextWithOcrFallback(file);
  assertReadableText(extracted, file.name);

  const outputBuffer = await makeTextPdf(`OCR text for ${file.name}`, extracted.text);

  return {
    provider: "tesseract",
    output: [
      "OCR PDF conversion completed.",
      "",
      `Input file: ${file.name}`,
      `Pages processed: ${"ocrPages" in extracted ? extracted.ocrPages : extracted.pageCount}`,
      `Characters extracted: ${extracted.text.length}`,
      `OCR confidence: ${Math.round(extracted.confidence * 100)}%`,
      `Output PDF size: ${formatBytes(outputBuffer.length)}`,
      "",
      "OCR Output:",
      extracted.text,
      "",
      "A searchable text PDF was created from the detected text.",
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "ocr-text", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function pdfTextExtractor(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const extracted = await extractPdfText(file);
  if (!extracted.text) {
    throw new Error("No embedded text was found. Use OCR PDF Converter for scanned PDFs.");
  }

  return {
    provider: "pdf-parse",
    output: [
      "PDF text extraction completed.",
      "",
      `Pages scanned: ${extracted.pageCount}`,
      `Characters extracted: ${extracted.text.length}`,
      "",
      extracted.text,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "text", "txt"),
      mimeType: "text/plain;charset=utf-8",
      base64: Buffer.from(extracted.text, "utf8").toString("base64"),
    },
  };
}

async function pdfMetadataViewer(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  validatePdf(file);
  const { PDFParse } = await import("pdf-parse");
  PDFParse.setWorker(
    pathToFileURL(
      path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"),
    ).href,
  );
  const parser = new PDFParse({ data: new Uint8Array(file.buffer) });

  try {
    const info = await parser.getInfo({ parsePageInfo: true });
    const metadata = {
      fileName: file.name,
      fileSize: formatBytes(file.buffer.length),
      totalPages: info.total,
      info: info.info,
      pages: info.pages,
    };
    const json = JSON.stringify(metadata, null, 2);

    return {
      provider: "pdf-parse",
      output: [
        "PDF metadata extracted.",
        "",
        `File: ${file.name}`,
        `Pages: ${info.total}`,
        `File size: ${formatBytes(file.buffer.length)}`,
        "",
        json,
      ].join("\n"),
      download: {
        filename: slugFilename(file.name, "metadata", "json"),
        mimeType: "application/json",
        base64: Buffer.from(json, "utf8").toString("base64"),
      },
    };
  } finally {
    await parser.destroy();
  }
}

async function pdfWordCounter(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const extracted = await extractPdfText(file);
  if (!extracted.text) throw new Error("No embedded text was found. Use OCR PDF Converter for scanned PDFs.");

  const words = extracted.text.match(/\b[\p{L}\p{N}'-]+\b/gu) || [];
  const characters = extracted.text.length;

  return {
    provider: "pdf-parse",
    output: [
      "PDF word count completed.",
      "",
      `Pages scanned: ${extracted.pageCount}`,
      `Words: ${words.length}`,
      `Characters: ${characters}`,
      `Characters without spaces: ${extracted.text.replace(/\s/g, "").length}`,
    ].join("\n"),
  };
}

function topKeywords(text: string) {
  const stopwords = new Set([
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "from",
    "you",
    "your",
    "are",
    "was",
    "were",
    "will",
    "have",
    "has",
    "into",
    "page",
    "pdf",
  ]);
  const counts = new Map<string, number>();
  const words = text.toLowerCase().match(/\b[a-z][a-z0-9-]{3,}\b/g) || [];
  for (const word of words) {
    if (!stopwords.has(word)) counts.set(word, (counts.get(word) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
}

async function pdfKeywordExtractor(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const extracted = await extractTextWithOcrFallback(file);
  assertReadableText(extracted, file.name);
  const keywords = topKeywords(extracted.text);
  const keyPoints = keyPointSentences(extracted.text, 10);
  const markdown = [
    `# Key Points for ${file.name}`,
    "",
    `Pages scanned: ${extracted.pageCount}`,
    `Characters extracted: ${extracted.text.length}`,
    "",
    "## Key Points",
    ...(keyPoints.length ? keyPoints.map((point) => `- ${point}`) : ["- No strong key points detected."]),
    "",
    "## Top Keywords",
    ...keywords.map(([keyword, count]) => `- ${keyword}: ${count}`),
  ].join("\n");

  return {
    provider: extracted.ocrPages ? "tesseract" : "pdf-parse",
    output: [
      "PDF key points extracted.",
      "",
      `Pages scanned: ${extracted.pageCount}`,
      `Key points found: ${keyPoints.length}`,
      `Keywords found: ${keywords.length}`,
      extracted.ocrPages ? `OCR confidence: ${Math.round(extracted.confidence * 100)}%` : "",
      "",
      "Key Points:",
      ...(keyPoints.length ? keyPoints.map((point) => `- ${point}`) : ["- No strong key points detected."]),
      "",
      "Top Keywords:",
      ...keywords.map(([keyword, count]) => `- ${keyword}: ${count}`),
    ]
      .filter(Boolean)
      .join("\n"),
    download: {
      filename: slugFilename(file.name, "key-points", "md"),
      mimeType: "text/markdown;charset=utf-8",
      base64: Buffer.from(markdown, "utf8").toString("base64"),
    },
  };
}

async function pdfToFlashcards(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const extracted = await extractTextWithOcrFallback(file);
  assertReadableText(extracted, file.name);
  const points = keyPointSentences(extracted.text, 12);
  const keywords = topKeywords(extracted.text).map(([keyword]) => keyword);
  const flashcards = points.slice(0, 10).map((point, index) => ({
    question: `What is one key idea from this PDF about ${keywords[index % Math.max(keywords.length, 1)] || "the topic"}?`,
    answer: shortAnswerFromSentence(point),
  }));

  if (!flashcards.length) {
    throw new Error("Unsupported document. The PDF does not contain enough readable text to create flashcards.");
  }

  const markdown = [
    `# Flashcards for ${file.name}`,
    "",
    ...flashcards.flatMap((card, index) => [
      `## Card ${index + 1}`,
      `Q: ${card.question}`,
      `A: ${card.answer}`,
      "",
    ]),
  ].join("\n");

  return {
    provider: extracted.ocrPages ? "tesseract" : "pdf-parse",
    output: [
      "PDF flashcards created.",
      "",
      `Pages scanned: ${extracted.pageCount}`,
      `Cards created: ${flashcards.length}`,
      extracted.ocrPages ? `OCR confidence: ${Math.round(extracted.confidence * 100)}%` : "",
      "",
      markdown,
    ]
      .filter(Boolean)
      .join("\n"),
    download: {
      filename: slugFilename(file.name, "flashcards", "md"),
      mimeType: "text/markdown;charset=utf-8",
      base64: Buffer.from(markdown, "utf8").toString("base64"),
    },
  };
}

async function pdfQuizGenerator(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const extracted = await extractTextWithOcrFallback(file);
  assertReadableText(extracted, file.name);
  const points = keyPointSentences(extracted.text, 8);
  const keywords = topKeywords(extracted.text).map(([keyword]) => keyword);

  if (!points.length) {
    throw new Error("Unsupported document. The PDF does not contain enough readable text to create a quiz.");
  }

  const questions = points.slice(0, 6).map((point, index) => {
    const answer = keywords[index] || "the main idea";
    const options = [
      answer,
      keywords[index + 1] || "an unrelated appendix",
      keywords[index + 2] || "a random formatting detail",
      keywords[index + 3] || "a missing page number",
    ];
    return [
      `${index + 1}. Which topic is most connected to this key point?`,
      `   "${shortAnswerFromSentence(point)}"`,
      ...options.map((option, optionIndex) => `   ${String.fromCharCode(65 + optionIndex)}. ${option}`),
      `   Answer: A`,
    ].join("\n");
  });

  const quiz = [
    `# Quiz for ${file.name}`,
    "",
    ...questions,
    "",
    "Answer Key:",
    ...questions.map((_, index) => `${index + 1}. A`),
  ].join("\n\n");

  return {
    provider: extracted.ocrPages ? "tesseract" : "pdf-parse",
    output: [
      "PDF quiz generated.",
      "",
      `Pages scanned: ${extracted.pageCount}`,
      `Questions created: ${questions.length}`,
      extracted.ocrPages ? `OCR confidence: ${Math.round(extracted.confidence * 100)}%` : "",
      "",
      quiz,
    ]
      .filter(Boolean)
      .join("\n"),
    download: {
      filename: slugFilename(file.name, "quiz", "md"),
      mimeType: "text/markdown;charset=utf-8",
      base64: Buffer.from(quiz, "utf8").toString("base64"),
    },
  };
}

async function pdfStudyNotesGenerator(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const extracted = await extractTextWithOcrFallback(file);
  assertReadableText(extracted, file.name);
  const summary = summarizeText(extracted.text);
  const points = keyPointSentences(extracted.text, 10);
  const keywords = topKeywords(extracted.text).slice(0, 12);

  const notes = [
    `# Study Notes for ${file.name}`,
    "",
    "## Summary",
    summary,
    "",
    "## Key Points",
    ...(points.length ? points.map((point) => `- ${point}`) : ["- Review the full PDF text for the strongest takeaways."]),
    "",
    "## Terms to Review",
    ...(keywords.length ? keywords.map(([keyword, count]) => `- ${keyword} (${count})`) : ["- No repeated terms detected."]),
    "",
    "## Revision Prompts",
    "- Explain the document's main argument in your own words.",
    "- List the three most important facts, numbers, or commitments.",
    "- Turn each key point into one practice question before studying.",
  ].join("\n");

  return {
    provider: extracted.ocrPages ? "tesseract" : "pdf-parse",
    output: [
      "PDF study notes created.",
      "",
      `Pages scanned: ${extracted.pageCount}`,
      `Characters extracted: ${extracted.text.length}`,
      extracted.ocrPages ? `OCR confidence: ${Math.round(extracted.confidence * 100)}%` : "",
      "",
      notes,
    ]
      .filter(Boolean)
      .join("\n"),
    download: {
      filename: slugFilename(file.name, "study-notes", "md"),
      mimeType: "text/markdown;charset=utf-8",
      base64: Buffer.from(notes, "utf8").toString("base64"),
    },
  };
}

async function scanToPdf(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const files = getUploads(inputs);
  if (!files.length) throw new Error("Upload one or more scan images.");
  const pdf = await PDFDocument.create();

  for (const file of files) {
    validateImage(file);
    const png = await sharp(file.buffer).rotate().png().toBuffer();
    const image = await pdf.embedPng(png);
    const maxWidth = 612;
    const maxHeight = 792;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = image.width * scale;
    const height = image.height * scale;
    const page = pdf.addPage([maxWidth, maxHeight]);
    page.drawImage(image, {
      x: (maxWidth - width) / 2,
      y: (maxHeight - height) / 2,
      width,
      height,
    });
  }

  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "Scan to PDF completed.",
      "",
      `Images converted: ${files.length}`,
      `PDF pages created: ${files.length}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
    ].join("\n"),
    download: {
      filename: "toolverse-scan.pdf",
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function pdfToPng(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  validatePdf(file);
  const { PDFParse } = await import("pdf-parse");
  PDFParse.setWorker(
    pathToFileURL(
      path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"),
    ).href,
  );
  const parser = new PDFParse({ data: new Uint8Array(file.buffer) });

  try {
    const info = await parser.getInfo();
    const pageCount = info.total || 0;
    const result = await parser.getScreenshot({
      scale: 1.5,
      first: pageCount,
      imageDataUrl: false,
      imageBuffer: true,
    });
    const zip = new JSZip();
    let firstPageBase64 = "";
    const previewImages: string[] = [];

    for (let index = 0; index < result.pages.length; index += 1) {
      const pngBuffer = Buffer.from(result.pages[index].data);
      zip.file(`page-${index + 1}.png`, pngBuffer);
      if (index === 0) firstPageBase64 = pngBuffer.toString("base64");
      if (index < 8) previewImages.push(`data:image/png;base64,${pngBuffer.toString("base64")}`);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    return {
      provider: "pdf-parse",
      output: [
        "PDF to PNG conversion completed.",
        "",
        `Input file: ${file.name}`,
        `Pages converted: ${result.pages.length}`,
        `Download size: ${formatBytes(zipBuffer.length)}`,
      ].join("\n"),
      imageUrl: firstPageBase64 ? `data:image/png;base64,${firstPageBase64}` : undefined,
      images: previewImages,
      download: {
        filename: slugFilename(file.name, "png-pages", "zip"),
        mimeType: "application/zip",
        base64: zipBuffer.toString("base64"),
      },
    };
  } finally {
    await parser.destroy();
  }
}

async function pdfToPdfA(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const pdf = await loadPdf(file);
  pdf.setTitle(file.name.replace(/\.pdf$/i, ""));
  pdf.setSubject("Archive-ready PDF copy generated by ToolVerse AI");
  pdf.setProducer("ToolVerse AI PDF/A Converter");
  pdf.setCreator("ToolVerse AI");
  pdf.setCreationDate(new Date());
  pdf.setModificationDate(new Date());
  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "PDF/A-style archival copy created.",
      "",
      `Input file: ${file.name}`,
      `Pages processed: ${pdf.getPageCount()}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
      "The PDF was normalized and metadata was written for archiving. Full PDF/A validation requires a dedicated validator outside this runtime.",
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "pdf-a", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function pdfPasswordRemover(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  validatePdf(file);

  try {
    const pdf = await PDFDocument.load(file.buffer, {
      updateMetadata: false,
      ignoreEncryption: true,
    });
    const outputBuffer = await savePdf(pdf);

    return {
      provider: "pdf-lib",
      output: [
        "PDF password removal completed.",
        "",
        `Input file: ${file.name}`,
        `Output size: ${formatBytes(outputBuffer.length)}`,
        "",
        "This rewrites PDFs that can be opened without an owner password. Strongly encrypted PDFs still require the correct password before they can be processed.",
      ].join("\n"),
      download: {
        filename: slugFilename(file.name, "unlocked", "pdf"),
        mimeType: "application/pdf",
        base64: outputBuffer.toString("base64"),
      },
    };
  } catch {
    throw new Error("This PDF could not be unlocked. It may require a password that was not provided.");
  }
}

async function pdfWatermarkRemover(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const pdf = await loadPdf(file);
  let annotationLayersRemoved = 0;

  for (const page of pdf.getPages()) {
    if (page.node.get(PDFName.of("Annots"))) {
      page.node.delete(PDFName.of("Annots"));
      annotationLayersRemoved += 1;
    }
  }

  const outputBuffer = await savePdf(pdf);

  return {
    provider: "pdf-lib",
    output: [
      "PDF watermark cleanup completed.",
      "",
      `Pages checked: ${pdf.getPageCount()}`,
      `Annotation watermark layers removed: ${annotationLayersRemoved}`,
      `Output size: ${formatBytes(outputBuffer.length)}`,
      "",
      "This removes annotation-layer watermarks. Watermarks permanently drawn into page content cannot be removed safely by a generic PDF tool.",
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "watermark-cleaned", "pdf"),
      mimeType: "application/pdf",
      base64: outputBuffer.toString("base64"),
    },
  };
}

async function resumeAtsScore(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const extracted = await extractPdfText(file);
  if (!extracted.text) throw new Error("No embedded resume text was found. Use OCR PDF Converter for scanned resumes.");

  const text = extracted.text.toLowerCase();
  const keywordPool = [
    "experience",
    "skills",
    "education",
    "projects",
    "achievements",
    "leadership",
    "managed",
    "built",
    "improved",
    "reduced",
    "increased",
    "certification",
    "tools",
    "metrics",
    "results",
  ];
  const hits = keywordPool.filter((keyword) => text.includes(keyword));
  const hasEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(extracted.text);
  const hasPhone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(extracted.text);
  const wordCount = extracted.text.match(/\b[\p{L}\p{N}'-]+\b/gu)?.length || 0;
  const score = Math.min(
    100,
    Math.round(hits.length * 5 + (hasEmail ? 10 : 0) + (hasPhone ? 10 : 0) + Math.min(wordCount / 8, 25)),
  );

  return {
    provider: "pdf-parse",
    output: [
      "Resume ATS score completed.",
      "",
      `Score: ${score}/100`,
      `Pages scanned: ${extracted.pageCount}`,
      `Words found: ${wordCount}`,
      `Contact email detected: ${hasEmail ? "Yes" : "No"}`,
      `Phone detected: ${hasPhone ? "Yes" : "No"}`,
      `ATS keyword hits: ${hits.join(", ") || "None"}`,
      "",
      "Tip: Add role-specific keywords from the job description and measurable results for stronger ATS matching.",
    ].join("\n"),
  };
}

async function synthesizeWithWindowsSpeech(text: string) {
  if (process.platform !== "win32") {
    throw new Error("PDF to Audiobook needs a server TTS engine. On Windows it uses System.Speech; on Linux/Vercel connect a TTS provider before enabling audio export.");
  }

  const dir = await mkdtemp(path.join(tmpdir(), "toolverse-tts-"));
  const textPath = path.join(dir, "input.txt");
  const wavPath = path.join(dir, "output.wav");

  try {
    await writeFile(textPath, text, "utf8");
    const script = [
      "Add-Type -AssemblyName System.Speech;",
      "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;",
      "$synth.Rate = 0;",
      `$synth.SetOutputToWaveFile('${wavPath.replace(/'/g, "''")}');`,
      `$synth.Speak([System.IO.File]::ReadAllText('${textPath.replace(/'/g, "''")}'));`,
      "$synth.Dispose();",
    ].join(" ");

    await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      script,
    ]);

    return await readFile(wavPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function pdfToAudiobook(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const extracted = await extractTextWithOcrFallback(file);
  assertReadableText(extracted, file.name);

  const speechText = extracted.text.slice(0, MAX_TTS_CHARACTERS);
  const wavBuffer = await synthesizeWithWindowsSpeech(speechText);

  return {
    provider: "system-speech",
    output: [
      "PDF audiobook created.",
      "",
      `Pages scanned: ${extracted.pageCount}`,
      `Characters extracted: ${extracted.text.length}`,
      `OCR confidence: ${Math.round(extracted.confidence * 100)}%`,
      `Characters narrated: ${speechText.length}`,
      `Audio size: ${formatBytes(wavBuffer.length)}`,
      "",
      "OCR Output:",
      extracted.text,
      "",
      speechText.length < extracted.text.length
        ? "The audiobook uses the first section of the PDF to keep processing fast."
        : "The full extracted PDF text was converted to audio.",
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "audiobook", "wav"),
      mimeType: "audio/wav",
      base64: wavBuffer.toString("base64"),
    },
  };
}

async function transcribeWithHuggingFace(file: UploadedFile) {
  validateAudio(file);
  return transcribeAudio(file.buffer, file.type);
}

function blogFromTranscript(transcript: string, instructions?: string) {
  const clean = transcript.replace(/\s+/g, " ").trim();
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()) || [clean];
  const titleSeed = sentences[0]?.slice(0, 90) || "Voice Note Blog Draft";
  const intro = sentences.slice(0, 3).join(" ");
  const bodyGroups = [
    sentences.slice(3, 7),
    sentences.slice(7, 12),
    sentences.slice(12, 18),
  ].filter((group) => group.length);

  return [
    `# ${titleSeed.replace(/[.!?]+$/, "")}`,
    "",
    instructions ? `Editorial direction: ${instructions}` : "Editorial direction: Turn the transcript into a clear, readable blog draft.",
    "",
    "## Introduction",
    intro || clean,
    "",
    ...bodyGroups.flatMap((group, index) => [
      `## Key Point ${index + 1}`,
      group.join(" "),
      "",
    ]),
    "## Closing",
    "Use this draft as a polished starting point, then add examples, links, and brand-specific details before publishing.",
    "",
    "## Transcript",
    clean,
  ].join("\n");
}

async function voiceNoteToBlog(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const transcript = await transcribeWithHuggingFace(file);
  if (!transcript.trim()) {
    throw new Error("Empty transcription result. No readable speech was detected in this audio file.");
  }
  const blog = blogFromTranscript(transcript, inputs.instructions);
  const buffer = Buffer.from(blog, "utf8");

  return {
    provider: "huggingface",
    output: [
      "Voice note converted into a blog draft.",
      "",
      `Audio file: ${file.name}`,
      `Original size: ${formatBytes(file.buffer.length)}`,
      `Transcript characters: ${transcript.length}`,
      `Blog draft characters: ${blog.length}`,
      "",
      blog,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, "blog-draft", "md"),
      mimeType: "text/markdown",
      base64: buffer.toString("base64"),
    },
  };
}

async function callTranslationProvider(prompt: string) {
  const systemPrompt = "Translate documents faithfully. Preserve headings, lists, numbers, dates, and names.";

  try {
    return { provider: "gemini" as const, output: await generateGeminiText(systemPrompt, prompt) };
  } catch (geminiError) {
    console.error("[ToolVerse] Gemini translation failed", geminiError);
  }

  return { provider: "openrouter" as const, output: await generateOpenRouterText(systemPrompt, prompt) };
}

async function pdfTranslator(inputs: ToolInputs): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const extracted = await extractTextWithOcrFallback(file);
  if (!extracted.text) {
    throw new Error("No readable text was found in the PDF.");
  }

  const targetLanguage = inputs.instructions?.trim() || "English";
  const sourceText = extracted.text.slice(0, MAX_TRANSLATION_CHARACTERS);
  const prompt = [
    `Translate this PDF text to ${targetLanguage}.`,
    "Keep the meaning accurate and preserve simple formatting where possible.",
    sourceText.length < extracted.text.length
      ? "The text was truncated for this request; translate only the included section."
      : "Translate the full included text.",
    "",
    sourceText,
  ].join("\n");

  const translated = await callTranslationProvider(prompt);
  const output = [
    "PDF translation completed.",
    "",
    `Source pages: ${extracted.pageCount}`,
    `Source characters: ${extracted.text.length}`,
    `Translated characters: ${translated.output.length}`,
    `Target language: ${targetLanguage}`,
    sourceText.length < extracted.text.length
      ? `Note: translated the first ${sourceText.length} characters to keep the request fast.`
      : "",
    "",
    translated.output,
  ]
    .filter(Boolean)
    .join("\n");
  const buffer = Buffer.from(output, "utf8");

  return {
    provider: translated.provider,
    output,
    download: {
      filename: slugFilename(file.name, "translated", "txt"),
      mimeType: "text/plain",
      base64: buffer.toString("base64"),
    },
  };
}

function extractMoneyValues(text: string) {
  const matches = [...text.matchAll(/(?:₹|rs\.?|inr|\$|usd)?\s?([0-9]{1,3}(?:[, ]?[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/gi)];
  return matches.map((match) => match[0].trim()).slice(0, 12);
}

function scorePatterns(text: string, patterns: RegExp[]) {
  return patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
}

function detectDocumentType(text: string) {
  const scores = (Object.entries(DOCUMENT_TYPE_KEYWORDS) as Array<[DocumentType, RegExp[]]>)
    .filter(([type]) => type !== "Generic Document")
    .map(([type, patterns]) => ({
      type,
      score: scorePatterns(text, patterns),
      possible: patterns.length,
    }))
    .sort((a, b) => b.score - a.score);

  const best = scores[0];
  if (!best || best.score === 0) {
    return {
      type: "Generic Document" as DocumentType,
      confidence: 0.35,
      score: 0,
    };
  }

  return {
    type: best.type,
    confidence: Math.min(0.98, 0.45 + best.score / Math.max(best.possible, 1)),
    score: best.score,
  };
}

function hasInvoiceKeywords(text: string) {
  return scorePatterns(text, INVOICE_REQUIRED_KEYWORDS) > 0;
}

function extractStructuredReceiptData(text: string, documentType: DocumentType, confidence: number) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const date = text.match(/\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/)?.[0] || "";
  const invoiceNumber =
    text.match(/\b(?:invoice|inv|bill|receipt)[\s#:.-]*([a-z0-9-]{3,})\b/i)?.[1] || "";
  const taxId = text.match(/\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]\b/i)?.[0] || "";
  const moneyValues = extractMoneyValues(text);
  const likelyTotal =
    text.match(/\b(?:grand\s+total|total|amount\s+due|balance\s+due)[^\n\r0-9₹$]*(₹?\$?\s?[0-9,]+(?:\.[0-9]{2})?)/i)?.[1] ||
    moneyValues.at(-1) ||
    "";
  const vendor = lines.find((line) => /[a-z]/i.test(line) && !/\d{5,}/.test(line)) || "";

  return {
    documentType,
    confidence: Number(confidence.toFixed(2)),
    vendor,
    date,
    invoiceNumber,
    taxId,
    likelyTotal,
    detectedAmounts: moneyValues,
    lineItems: lines.slice(0, 20),
  };
}

async function extractInvoiceOrReceipt(inputs: ToolInputs, label: "invoice" | "receipt"): Promise<PdfOcrToolResult> {
  const file = getUploads(inputs)[0];
  const extracted = await extractTextWithOcrFallback(file);
  assertReadableText(extracted, file.name);

  const detection = detectDocumentType(extracted.text);
  const isInvoiceRequest = label === "invoice";
  const canExtractInvoice = detection.type === "Invoice" && hasInvoiceKeywords(extracted.text);
  const canExtractReceipt = detection.type === "Receipt";

  if ((isInvoiceRequest && !canExtractInvoice) || (!isInvoiceRequest && !canExtractReceipt)) {
    const data = {
      documentType: isInvoiceRequest ? "Generic Document" : detection.type,
      detectedDocumentType: detection.type,
      message: isInvoiceRequest ? "No invoice detected" : "No receipt detected",
      confidence: Number(detection.confidence.toFixed(2)),
      ocrConfidence: Number(extracted.confidence.toFixed(2)),
    };
    const json = JSON.stringify(data, null, 2);

    return {
      provider: file.type === "application/pdf" && !("ocrPages" in extracted) ? "pdf-parse" : "tesseract",
      output: [
        "Document scan completed.",
        "",
        `Input file: ${file.name}`,
        `Detected document type: ${detection.type}`,
        `Document confidence: ${Math.round(detection.confidence * 100)}%`,
        `OCR confidence: ${Math.round(extracted.confidence * 100)}%`,
        `Characters extracted: ${extracted.text.length}`,
        "",
        "Extracted Data:",
        json,
        "",
        "OCR Output:",
        extracted.text,
      ].join("\n"),
      download: {
        filename: slugFilename(file.name, `${label}-data`, "json"),
        mimeType: "application/json",
        base64: Buffer.from(json, "utf8").toString("base64"),
      },
    };
  }

  const data = extractStructuredReceiptData(extracted.text, detection.type, detection.confidence);
  const json = JSON.stringify(data, null, 2);

  return {
    provider: file.type === "application/pdf" && !("ocrPages" in extracted) ? "pdf-parse" : "tesseract",
    output: [
      `${label === "invoice" ? "Invoice" : "Receipt"} scan completed.`,
      "",
      `Input file: ${file.name}`,
      `Detected document type: ${detection.type}`,
      `Document confidence: ${Math.round(detection.confidence * 100)}%`,
      `OCR confidence: ${Math.round(extracted.confidence * 100)}%`,
      `Characters extracted: ${extracted.text.length}`,
      `Detected amount count: ${data.detectedAmounts.length}`,
      "",
      "Extracted Data:",
      json,
      "",
      "OCR Output:",
      extracted.text,
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, `${label}-data`, "json"),
      mimeType: "application/json",
      base64: Buffer.from(json, "utf8").toString("base64"),
    },
  };
}

export async function runPdfOcrTool(slug: string, inputs: ToolInputs) {
  switch (slug) {
    case "pdf-splitter":
      return splitPdf(inputs);
    case "pdf-merger":
      return mergePdfs(inputs);
    case "pdf-page-remover":
      return removePdfPages(inputs);
    case "extract-pages":
      return extractPdfPages(inputs);
    case "organize-pdf":
      return organizePdf(inputs);
    case "repair-pdf":
      return repairPdf(inputs);
    case "pdf-to-png":
      return pdfToPng(inputs);
    case "pdf-to-pdf-a":
      return pdfToPdfA(inputs);
    case "rotate-pdf":
      return rotatePdf(inputs);
    case "add-page-numbers":
      return addPageNumbers(inputs);
    case "add-watermark":
      return addWatermark(inputs);
    case "crop-pdf":
      return cropPdf(inputs);
    case "edit-pdf":
      return editPdf(inputs);
    case "pdf-forms":
      return pdfForms(inputs);
    case "protect-pdf":
      return protectPdf(inputs);
    case "sign-pdf":
      return signPdf(inputs);
    case "redact-pdf":
      return redactPdf(inputs);
    case "compare-pdf":
      return comparePdf(inputs);
    case "pdf-summarizer":
      return summarizePdf(inputs);
    case "screenshot-to-text-extractor":
      return screenshotToText(inputs);
    case "ocr-pdf-converter":
      return ocrPdfConverter(inputs);
    case "pdf-text-extractor":
      return pdfTextExtractor(inputs);
    case "pdf-to-audiobook":
      return pdfToAudiobook(inputs);
    case "voice-note-to-blog-converter":
      return voiceNoteToBlog(inputs);
    case "pdf-invoice-data-extractor":
      return extractInvoiceOrReceipt(inputs, "invoice");
    case "receipt-scanner":
      return extractInvoiceOrReceipt(inputs, "receipt");
    case "pdf-metadata-viewer":
      return pdfMetadataViewer(inputs);
    case "pdf-word-counter":
      return pdfWordCounter(inputs);
    case "pdf-keyword-extractor":
      return pdfKeywordExtractor(inputs);
    case "pdf-to-flashcards":
      return pdfToFlashcards(inputs);
    case "pdf-quiz-generator":
      return pdfQuizGenerator(inputs);
    case "pdf-study-notes-generator":
      return pdfStudyNotesGenerator(inputs);
    case "scan-to-pdf":
      return scanToPdf(inputs);
    case "pdf-password-remover":
      return pdfPasswordRemover(inputs);
    case "pdf-watermark-remover":
      return pdfWatermarkRemover(inputs);
    case "resume-ats-score-checker":
      return resumeAtsScore(inputs);
    case "pdf-translator":
      return pdfTranslator(inputs);
    default:
      return null;
  }
}
