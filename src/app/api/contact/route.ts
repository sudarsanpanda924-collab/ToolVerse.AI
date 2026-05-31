import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getFirestoreAdmin, getFirestoreErrorMessage } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Full name is required.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(160),
  inquiryType: z.enum([
    "General Support",
    "Bug Report",
    "Feature Request",
    "Partnership Inquiry",
    "Business Inquiry",
    "API Issue",
  ]),
  subject: z.string().trim().min(3, "Subject is required.").max(160),
  message: z.string().trim().min(10, "Message must be at least 10 characters.").max(4000),
});

export async function POST(request: Request) {
  try {
    const payload = contactSchema.parse(await request.json());
    const db = getFirestoreAdmin();

    if (!db) {
      return NextResponse.json(
        { error: "Unable to submit right now. Please email toolverseai18@gmail.com" },
        { status: 503 },
      );
    }

    const createdAt = new Date().toISOString();
    await db.collection("contactMessages").doc(crypto.randomUUID()).set({
      ...payload,
      createdAt,
      status: "new",
    });

    return NextResponse.json({
      ok: true,
      message: "Message sent successfully. We'll get back to you soon.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid contact form submission." },
        { status: 400 },
      );
    }

    console.error("[ToolVerse] Contact submission failed", error);
    return NextResponse.json(
      {
        error: "Unable to submit right now. Please email toolverseai18@gmail.com",
        details: getFirestoreErrorMessage(error),
      },
      { status: 503 },
    );
  }
}
