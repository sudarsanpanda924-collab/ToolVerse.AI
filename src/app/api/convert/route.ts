import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { parseToolRequest, recordUsage } from "@/lib/api-helpers";
import { imageConversionToolSlugs, runImageConversionTool } from "@/lib/image-conversion-tools";
import { compressPdf } from "@/lib/pdf-compressor";
import { pdfOcrToolSlugs, runPdfOcrTool } from "@/lib/pdf-ocr-tools";
import { runLocalTool } from "@/lib/providers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const parsed = await parseToolRequest(request);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    if (imageConversionToolSlugs.has(parsed.tool.slug)) {
      const result = await runImageConversionTool(parsed.tool.slug, parsed.inputs);
      if (!result) {
        return NextResponse.json({ error: "Image conversion tool is not implemented." }, { status: 404 });
      }

      const usage = await recordUsage(request, parsed.tool.slug, false);
      return NextResponse.json({
        ...result,
        remaining: usage.remaining,
        limit: usage.limit,
      });
    }

    if (parsed.tool.slug === "pdf-compressor") {
      const result = await compressPdf(parsed.inputs);
      const usage = await recordUsage(request, parsed.tool.slug, false);

      return NextResponse.json({
        provider: "pdf-lib",
        ...result,
        remaining: usage.remaining,
        limit: usage.limit,
      });
    }

    if (pdfOcrToolSlugs.has(parsed.tool.slug)) {
      const result = await runPdfOcrTool(parsed.tool.slug, parsed.inputs);
      if (!result) {
        return NextResponse.json({ error: "PDF/OCR tool is not implemented." }, { status: 404 });
      }

      const usage = await recordUsage(request, parsed.tool.slug, false);
      return NextResponse.json({
        ...result,
        remaining: usage.remaining,
        limit: usage.limit,
      });
    }

    const usage = await recordUsage(request, parsed.tool.slug, false);
    const localResult = await runLocalTool(parsed.tool, parsed.inputs);
    const localPayload = typeof localResult === "string" ? { output: localResult } : localResult;

    return NextResponse.json({
      provider: "local",
      ...localPayload,
      remaining: usage.remaining,
      limit: usage.limit,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid conversion request." }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[ToolVerse] /api/convert failed", error);
    return NextResponse.json({ error: "Conversion route failed." }, { status: 500 });
  }
}
