import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { parseToolRequest, recordUsage } from "@/lib/api-helpers";
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
        { error: "Daily free AI image limit reached.", remaining: 0, limit: usage.limit },
        { status: 429 },
      );
    }

    const result = await runAiTool(
      { ...parsed.tool, provider: "pollinations", outputType: "image" },
      parsed.inputs,
    );

    return NextResponse.json({
      ...result,
      remaining: usage.remaining,
      limit: usage.limit,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid image request." }, { status: 400 });
    }
    if (error instanceof Error) {
      const status = error.name === "ProviderRateLimitError" ? 429 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("[ToolVerse] /api/image failed", error);
    return NextResponse.json({ error: "Image route failed." }, { status: 500 });
  }
}
