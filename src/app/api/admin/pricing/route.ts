import { NextResponse } from "next/server";
import { z } from "zod";
import { getManagedPricing, updatePricingPlan } from "@/lib/admin-store";
import { verifyAdminRequest } from "@/lib/admin-token";

export const runtime = "nodejs";

const updateSchema = z.object({
  id: z.string().min(1),
  price: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
});

async function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export async function GET(request: Request) {
  const session = await verifyAdminRequest(request);
  if (session?.role !== "admin") return unauthorized();

  return NextResponse.json({ plans: await getManagedPricing() });
}

export async function PATCH(request: Request) {
  const session = await verifyAdminRequest(request);
  if (session?.role !== "admin") return unauthorized();

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid pricing update." }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  return NextResponse.json({
    plans: await updatePricingPlan(id, updates),
  });
}
