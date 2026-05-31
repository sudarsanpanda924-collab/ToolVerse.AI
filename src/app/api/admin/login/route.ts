import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAdmin } from "@/lib/admin-auth";
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE } from "@/lib/admin-token";

export const runtime = "nodejs";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = loginSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const token = await authenticateAdmin(body.data.username, body.data.password);
  if (!token) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return response;
}
