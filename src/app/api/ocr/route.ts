import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { parseToolRequest, recordUsage } from "@/lib/api-helpers";
import { pdfOcrToolSlugs, runPdfOcrTool } from "@/lib/pdf-ocr-tools";
import { runAiTool } from "@/lib/providers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const parsed = await parseToolRequest(request);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const usage = await recordUsage(request, parsed.tool.slug, true);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Daily free AI OCR limit reached.", remaining: 0, limit: usage.limit },
        { status: 429 },
      );
    }

    if (pdfOcrToolSlugs.has(parsed.tool.slug)) {
      const result = await runPdfOcrTool(parsed.tool.slug, parsed.inputs);
      if (!result) {
        return NextResponse.json({ error: "PDF/OCR tool is not implemented." }, { status: 404 });
      }

      return NextResponse.json({
        ...result,
        remaining: usage.remaining,
        limit: usage.limit,
      });
    }

    const result = await runAiTool(
      { ...parsed.tool, provider: parsed.tool.provider === "local" ? "huggingface" : parsed.tool.provider },
      parsed.inputs,
    );

    return NextResponse.json({
      ...result,
      remaining: usage.remaining,
      limit: usage.limit,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid OCR request." }, { status: 400 });
    }
    if (error instanceof Error) {
      const status = error.name === "ProviderRateLimitError" ? 429 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("[ToolVerse] /api/ocr failed", error);
    return NextResponse.json({ error: "OCR route failed." }, { status: 500 });
  }
}
