import "server-only";

import { createHash } from "crypto";
import { getFirestoreAdmin } from "@/lib/firebase-admin";

export type UsageRecord = {
  key: string;
  ipHash: string;
  date: string;
  aiCount: number;
  nonAiCount: number;
  lastTool?: string;
  updatedAt: string;
};

export type UsageStats = {
  totalUsers: number;
  totalAiUses: number;
  totalNonAiUses: number;
  todayAiUses: number;
  todayUsers: number;
};

const memoryUsage = new Map<string, UsageRecord>();
const DAILY_AI_LIMIT = Number(process.env.FREE_AI_DAILY_LIMIT || 45);

export function getDailyAiLimit() {
  return DAILY_AI_LIMIT;
}

export function todayKey() {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value || "2026";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const day = parts.find((part) => part.type === "day")?.value || "01";
  return `${year}-${month}-${day}`;
}

export function hashIp(ip: string) {
  const salt = process.env.IP_HASH_SALT || process.env.ADMIN_JWT_SECRET || "toolverse-local-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function getRequestIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || "unknown";
}

function emptyRecord(ipHash: string, date = todayKey()): UsageRecord {
  return {
    key: `${ipHash}_${date}`,
    ipHash,
    date,
    aiCount: 0,
    nonAiCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function getUsage(ipHash: string, date = todayKey()) {
  const key = `${ipHash}_${date}`;
  const db = getFirestoreAdmin();

  if (!db) return memoryUsage.get(key) || emptyRecord(ipHash, date);

  const snapshot = await db.collection("usage").doc(key).get();
  if (!snapshot.exists) return emptyRecord(ipHash, date);
  return snapshot.data() as UsageRecord;
}

export async function incrementUsage(params: {
  ipHash: string;
  isAI: boolean;
  toolSlug: string;
  date?: string;
}) {
  const date = params.date || todayKey();
  const key = `${params.ipHash}_${date}`;
  const db = getFirestoreAdmin();
  const existing = await getUsage(params.ipHash, date);

  if (params.isAI && existing.aiCount >= DAILY_AI_LIMIT) {
    return {
      allowed: false,
      usage: existing,
      remaining: 0,
      limit: DAILY_AI_LIMIT,
    };
  }

  const next: UsageRecord = {
    ...existing,
    aiCount: existing.aiCount + (params.isAI ? 1 : 0),
    nonAiCount: existing.nonAiCount + (params.isAI ? 0 : 1),
    lastTool: params.toolSlug,
    updatedAt: new Date().toISOString(),
  };

  if (db) {
    await db.collection("usage").doc(key).set(next, { merge: true });
  } else {
    memoryUsage.set(key, next);
  }

  return {
    allowed: true,
    usage: next,
    remaining: Math.max(DAILY_AI_LIMIT - next.aiCount, 0),
    limit: DAILY_AI_LIMIT,
  };
}

export async function getUsageStats(): Promise<UsageStats> {
  const date = todayKey();
  const db = getFirestoreAdmin();

  if (!db) {
    const records = [...memoryUsage.values()];
    return {
      totalUsers: new Set(records.map((record) => record.ipHash)).size,
      totalAiUses: records.reduce((sum, record) => sum + record.aiCount, 0),
      totalNonAiUses: records.reduce((sum, record) => sum + record.nonAiCount, 0),
      todayAiUses: records
        .filter((record) => record.date === date)
        .reduce((sum, record) => sum + record.aiCount, 0),
      todayUsers: new Set(records.filter((record) => record.date === date).map((record) => record.ipHash)).size,
    };
  }

  const snapshot = await db.collection("usage").limit(500).get();
  const records = snapshot.docs.map((doc) => doc.data() as UsageRecord);

  return {
    totalUsers: new Set(records.map((record) => record.ipHash)).size,
    totalAiUses: records.reduce((sum, record) => sum + record.aiCount, 0),
    totalNonAiUses: records.reduce((sum, record) => sum + record.nonAiCount, 0),
    todayAiUses: records
      .filter((record) => record.date === date)
      .reduce((sum, record) => sum + record.aiCount, 0),
    todayUsers: new Set(records.filter((record) => record.date === date).map((record) => record.ipHash)).size,
  };
}
