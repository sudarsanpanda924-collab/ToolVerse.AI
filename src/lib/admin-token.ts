import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "toolverse_admin";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24;

function jwtSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function createAdminToken(username: string) {
  const secret = jwtSecret();
  if (!secret) throw new Error("Admin session secret is not configured.");

  return new SignJWT({ username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyAdminToken(token?: string) {
  if (!token) return null;

  try {
    const secret = jwtSecret();
    if (!secret) return null;

    const verified = await jwtVerify(token, secret);
    return verified.payload as { username?: string; role?: string };
  } catch {
    return null;
  }
}

export async function verifyAdminRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE}=`))
    ?.slice(ADMIN_COOKIE.length + 1);

  return verifyAdminToken(token ? decodeURIComponent(token) : undefined);
}
