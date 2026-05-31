import { NextResponse } from "next/server";
import { z } from "zod";
import { getManagedTools, setToolEnabled } from "@/lib/admin-store";
import { verifyAdminRequest } from "@/lib/admin-token";

export const runtime = "nodejs";

const updateSchema = z.object({
  slug: z.string().min(1),
  enabled: z.boolean(),
});

async function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export async function GET(request: Request) {
  const session = await verifyAdminRequest(request);
  if (session?.role !== "admin") return unauthorized();

  return NextResponse.json({ tools: await getManagedTools() });
}

export async function PATCH(request: Request) {
  const session = await verifyAdminRequest(request);
  if (session?.role !== "admin") return unauthorized();

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tool update." }, { status: 400 });
  }

  return NextResponse.json({
    tools: await setToolEnabled(parsed.data.slug, parsed.data.enabled),
  });
}
