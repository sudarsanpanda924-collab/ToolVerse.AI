"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { DownloadButton } from "@/components/DownloadButton";
import { Copy, FileText, Download } from "lucide-react";

type OutputBoxProps = {
  output: string;
  imageUrl?: string;
  filename?: string;
  download?: {
    filename: string;
    mimeType: string;
    base64: string;
  };
  downloadPng?: {
    filename: string;
    base64: string;
  };
  downloadSvg?: {
    filename: string;
    base64: string;
  };
  stats?: {
    originalSize: number;
    compressedSize: number;
    savedBytes: number;
    savedPercentage: number;
  };
  images?: string[];
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

async function exportToPdf(text: string, title: string) {
  try {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([612, 792]);
    let y = 740;
    const margin = 50;
    const width = 512;
    
    const writeLine = (line: string, isHeading = false) => {
      if (y < 60) {
        page = pdfDoc.addPage([612, 792]);
        y = 740;
      }
      page.drawText(line, {
        x: margin,
        y,
        size: isHeading ? 13 : 9,
        font: isHeading ? boldFont : font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= isHeading ? 20 : 14;
    };

    const lines = text.split("\n");
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) {
        y -= 10;
        continue;
      }
      
      const isHeading = cleanLine.startsWith("#");
      const textToDisplay = cleanLine.replace(/^#+\s*/, "");

      if (isHeading) {
        y -= 10;
        writeLine(textToDisplay, true);
        continue;
      }

      const words = textToDisplay.split(/\s+/);
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 9);
        if (testWidth > width) {
          writeLine(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        writeLine(currentLine);
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Could not generate PDF. Please try copying the text or exporting as TXT.");
  }
}

export function OutputBox({
  output,
  imageUrl,
  filename,
  download,
  downloadPng,
  downloadSvg,
  stats,
  images,
}: OutputBoxProps) {
  const [copiedIdea, setCopiedIdea] = useState(false);
  const [copiedMvp, setCopiedMvp] = useState(false);
  const [copiedBusiness, setCopiedBusiness] = useState(false);

  const handleCopy = async (text: string, setCopied: (val: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const isStartupGenerator = filename?.includes("ai-startup-idea-generator");

  const parsedSections = useMemo(() => {
    if (!isStartupGenerator || !output) return null;

    const extractSection = (startTag: string, endTag: string) => {
      const startIndex = output.indexOf(startTag);
      const endIndex = output.indexOf(endTag);
      if (startIndex !== -1 && endIndex !== -1) {
        return output.slice(startIndex + startTag.length, endIndex).trim();
      }
      return "";
    };

    const idea = extractSection("[START_IDEA]", "[END_IDEA]");
    const mvp = extractSection("[START_MVP]", "[END_MVP]");
    const business = extractSection("[START_BUS]", "[END_BUS]");

    const cleanOutput = output.replace(/\[\/?(START_IDEA|END_IDEA|START_MVP|END_MVP|START_BUS|END_BUS)\]/g, "").trim();

    return { idea, mvp, business, cleanOutput };
  }, [isStartupGenerator, output]);

  const displayedOutput = parsedSections ? parsedSections.cleanOutput : output;

  const isTransparent =
    filename?.toLowerCase().includes("remover") ||
    filename?.toLowerCase().includes("watermark") ||
    filename?.toLowerCase().includes("png") ||
    filename?.toLowerCase().includes("svg") ||
    download?.filename?.toLowerCase().endsWith(".png") ||
    download?.filename?.toLowerCase().endsWith(".svg") ||
    downloadPng !== undefined ||
    downloadSvg !== undefined;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Output</h2>
        <div className="flex flex-wrap gap-2">
          {parsedSections ? (
            <>
              <button
                type="button"
                onClick={() => handleCopy(parsedSections.idea || parsedSections.cleanOutput, setCopiedIdea)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <Copy className="h-4 w-4" />
                {copiedIdea ? "Copied Idea!" : "Copy Idea"}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(parsedSections.mvp || parsedSections.cleanOutput, setCopiedMvp)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <Copy className="h-4 w-4" />
                {copiedMvp ? "Copied MVP!" : "Copy MVP"}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(parsedSections.business || parsedSections.cleanOutput, setCopiedBusiness)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <Copy className="h-4 w-4" />
                {copiedBusiness ? "Copied Plan!" : "Copy Business Plan"}
              </button>
              <button
                type="button"
                onClick={() => exportToPdf(parsedSections.cleanOutput, "Startup Idea")}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <FileText className="h-4 w-4" />
                Export as PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([parsedSections.cleanOutput], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = "startup-idea.txt";
                  anchor.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <Download className="h-4 w-4" />
                Export as TXT
              </button>
            </>
          ) : (
            <>
              {filename?.startsWith("ai-image-generator") ? (
                <CopyButton value={output} label="Copy Prompt" />
              ) : (
                <CopyButton value={imageUrl || output} />
              )}
              {downloadPng && (
                <DownloadButton
                  filename={downloadPng.filename}
                  mimeType="image/png"
                  base64={downloadPng.base64}
                  label="Download PNG"
                />
              )}
              {downloadSvg && (
                <DownloadButton
                  filename={downloadSvg.filename}
                  mimeType="image/svg+xml"
                  base64={downloadSvg.base64}
                  label="Download SVG"
                />
              )}
              {!downloadPng && !downloadSvg && (
                <DownloadButton
                  value={output}
                  filename={download?.filename || filename}
                  mimeType={download?.mimeType}
                  base64={download?.base64}
                  label={
                    download
                      ? (() => {
                          const ext = download.filename.split(".").pop()?.toLowerCase();
                          if (ext === "pdf") return "Download PDF";
                          if (ext === "zip") return "Download ZIP";
                          if (ext === "docx" || ext === "doc") return "Download Word Doc";
                          if (ext === "xlsx" || ext === "xls") return "Download Excel Sheet";
                          if (ext === "pptx" || ext === "ppt") return "Download PPT Presentation";
                          if (ext === "csv") return "Download CSV";
                          if (ext === "txt") return "Download Text";
                          if (ext === "md") return "Download Markdown";
                          return `Download ${ext?.toUpperCase() || "File"}`;
                        })()
                      : "Download"
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
      {stats ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs text-slate-400">Original size</p>
            <p className="mt-1 text-lg font-semibold text-white">{formatBytes(stats.originalSize)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs text-slate-400">Compressed size</p>
            <p className="mt-1 text-lg font-semibold text-white">{formatBytes(stats.compressedSize)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs text-slate-400">Saved</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {stats.savedPercentage.toFixed(2)}%
            </p>
          </div>
        </div>
      ) : null}
      {imageUrl ? (
        <div className={`mb-4 overflow-hidden rounded-xl border border-white/10 p-4 flex items-center justify-center ${isTransparent ? "bg-checkerboard" : "bg-slate-950/50"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Generated ToolVerse AI output" className="h-auto max-h-[500px] w-auto object-contain" />
        </div>
      ) : null}
      {displayedOutput && (
        <pre className="min-h-48 whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-100 font-mono">
          {displayedOutput}
        </pre>
      )}
      {images && images.length > 0 && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="text-md mb-4 font-semibold text-white">Converted Pages ({images.length})</h3>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((imgUrl, idx) => {
              const pageNum = idx + 1;
              const imageType = imgUrl.match(/^data:image\/([^;]+)/)?.[1] || "jpg";
              const extension = imageType === "jpeg" ? "jpg" : imageType;
              return (
                <div key={idx} className="glass-card flex flex-col overflow-hidden rounded-xl border border-white/10 p-2">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-slate-950/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`Page ${pageNum}`} className="h-full w-full object-contain" />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">Page {pageNum}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const anchor = document.createElement("a");
                        anchor.href = imgUrl;
                        anchor.download = `page-${pageNum}.${extension}`;
                        anchor.click();
                      }}
                      className="inline-flex items-center gap-1 rounded bg-white/15 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-white/20"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {extension.toUpperCase()}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
