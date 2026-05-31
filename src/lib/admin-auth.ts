import "server-only";

import { timingSafeEqual } from "crypto";
import { createAdminToken } from "@/lib/admin-token";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function authenticateAdmin(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) return null;

  const usernameMatches = safeEqual(username, expectedUsername);
  const passwordMatches = safeEqual(password, expectedPassword);

  if (!usernameMatches || !passwordMatches) return null;

  return createAdminToken(username);
}
