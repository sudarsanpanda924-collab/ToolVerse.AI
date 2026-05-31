import "server-only";

import { PDFDocument } from "pdf-lib";

type CompressionInputs = Record<string, string>;

export type CompressedPdfResult = {
  output: string;
  download: {
    filename: string;
    mimeType: "application/pdf";
    base64: string;
  };
  stats: {
    originalSize: number;
    compressedSize: number;
    savedBytes: number;
    savedPercentage: number;
    method: string;
    note: string;
  };
};

const MAX_PDF_UPLOAD_BYTES = 8 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function sanitizePdfFilename(filename?: string) {
  const fallback = "toolverse-compressed.pdf";
  if (!filename) return fallback;

  const withoutExtension = filename
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return `${withoutExtension || "toolverse"}-compressed.pdf`;
}

function parsePdfUpload(inputs: CompressionInputs) {
  const dataUrl = inputs.file;
  const fileType = inputs.fileType;

  if (!dataUrl) {
    throw new Error("Please upload a PDF file.");
  }

  if (fileType !== "application/pdf") {
    throw new Error("Only PDF files are supported. Please upload a file with type application/pdf.");
  }

  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) {
    throw new Error("The uploaded PDF could not be read. Please choose the file again.");
  }

  const mimeType = match[1]?.toLowerCase();
  if (mimeType !== "application/pdf") {
    throw new Error("Only application/pdf uploads are accepted.");
  }

  const originalBuffer = Buffer.from(match[2] || "", "base64");
  if (originalBuffer.length > MAX_PDF_UPLOAD_BYTES) {
    throw new Error(`PDF is too large. Maximum upload size is ${formatBytes(MAX_PDF_UPLOAD_BYTES)}.`);
  }

  if (originalBuffer.subarray(0, 5).toString("utf8") !== "%PDF-") {
    throw new Error("The uploaded file does not look like a valid PDF document.");
  }

  return originalBuffer;
}

async function rewritePdf(originalBuffer: Buffer) {
  const source = await PDFDocument.load(originalBuffer, {
    updateMetadata: false,
  });

  source.setProducer("ToolVerse AI PDF Compressor");
  source.setCreator("ToolVerse AI");
  source.setModificationDate(new Date());

  return Buffer.from(
    await source.save({
      addDefaultPage: false,
      useObjectStreams: true,
      objectsPerTick: 50,
    }),
  );
}

async function rebuildPdf(originalBuffer: Buffer) {
  const source = await PDFDocument.load(originalBuffer, {
    updateMetadata: false,
  });
  const rebuilt = await PDFDocument.create();
  const pages = await rebuilt.copyPages(source, source.getPageIndices());

  pages.forEach((page) => rebuilt.addPage(page));
  rebuilt.setProducer("ToolVerse AI PDF Compressor");
  rebuilt.setCreator("ToolVerse AI");
  rebuilt.setCreationDate(new Date());
  rebuilt.setModificationDate(new Date());

  return Buffer.from(
    await rebuilt.save({
      addDefaultPage: false,
      useObjectStreams: true,
      objectsPerTick: 50,
    }),
  );
}

export async function compressPdf(inputs: CompressionInputs): Promise<CompressedPdfResult> {
  const originalBuffer = parsePdfUpload(inputs);
  const originalSize = originalBuffer.length;

  let rewrittenBuffer: Buffer;
  let rebuiltBuffer: Buffer;

  try {
    [rewrittenBuffer, rebuiltBuffer] = await Promise.all([
      rewritePdf(originalBuffer),
      rebuildPdf(originalBuffer),
    ]);
  } catch (error) {
    const message =
      error instanceof Error && error.message.toLowerCase().includes("encrypted")
        ? "Encrypted or password-protected PDFs cannot be compressed by this tool."
        : "This PDF could not be processed. It may be damaged, encrypted, or use unsupported PDF features.";
    throw new Error(message);
  }

  const candidates = [
    { method: "Rewritten with pdf-lib object streams", buffer: rewrittenBuffer },
    { method: "Rebuilt with copied pages and optimized object streams", buffer: rebuiltBuffer },
    { method: "Original retained because it was already smaller", buffer: originalBuffer },
  ].sort((a, b) => a.buffer.length - b.buffer.length);

  const best = candidates[0];
  const compressedSize = best.buffer.length;
  const savedBytes = Math.max(originalSize - compressedSize, 0);
  const savedPercentage = originalSize
    ? Number(((savedBytes / originalSize) * 100).toFixed(2))
    : 0;

  const note =
    savedBytes > 0
      ? "The PDF was optimized using pdf-lib object streams and the smallest safe output was selected."
      : "No additional size reduction was available. The source PDF was already optimized or mostly made of compressed images, so the safest smallest version was returned without making it larger.";

  const output = [
    "PDF compression completed.",
    "",
    `Original size: ${formatBytes(originalSize)}`,
    `Compressed size: ${formatBytes(compressedSize)}`,
    `Saved: ${formatBytes(savedBytes)} (${savedPercentage.toFixed(2)}%)`,
    "",
    `Method: ${best.method}.`,
    note,
  ].join("\n");

  return {
    output,
    download: {
      filename: sanitizePdfFilename(inputs.fileName),
      mimeType: "application/pdf",
      base64: best.buffer.toString("base64"),
    },
    stats: {
      originalSize,
      compressedSize,
      savedBytes,
      savedPercentage,
      method: best.method,
      note,
    },
  };
}
