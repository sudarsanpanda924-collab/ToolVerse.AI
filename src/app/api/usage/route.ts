import { NextResponse } from "next/server";
import { getRequestIp, getUsage, getDailyAiLimit, hashIp } from "@/lib/usage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ipHash = hashIp(getRequestIp(request.headers));
  const usage = await getUsage(ipHash);
  const limit = getDailyAiLimit();

  return NextResponse.json({
    aiCount: usage.aiCount,
    nonAiCount: usage.nonAiCount,
    remaining: Math.max(limit - usage.aiCount, 0),
    limit,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
