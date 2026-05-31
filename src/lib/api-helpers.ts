import "server-only";

import { z } from "zod";
import { getToolBySlug } from "@/config/tools";
import { isToolEnabled } from "@/lib/admin-store";
import { getRequestIp, hashIp, incrementUsage } from "@/lib/usage";

export const toolRequestSchema = z.object({
  toolSlug: z.string().min(1),
  inputs: z.record(z.string(), z.string()).default({}),
});

export async function parseToolRequest(request: Request) {
  const json = await request.json();
  const parsed = toolRequestSchema.parse(json);
  const tool = getToolBySlug(parsed.toolSlug);

  if (!tool) {
    return { error: "Unknown tool.", status: 404 as const };
  }

  const enabled = await isToolEnabled(tool.slug);
  if (!enabled) {
    return { error: "This tool is temporarily disabled by the admin.", status: 423 as const };
  }

  return { tool, inputs: parsed.inputs };
}

export async function recordUsage(request: Request, toolSlug: string, isAI: boolean) {
  const ip = getRequestIp(request.headers);
  const ipHash = hashIp(ip);
  return incrementUsage({ ipHash, isAI, toolSlug });
}
