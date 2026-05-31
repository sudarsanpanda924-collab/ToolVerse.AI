import "server-only";

import type { AiProviderId } from "@/lib/ai/types";

export class ProviderRateLimitError extends Error {
  constructor(provider: AiProviderId) {
    super(`${provider} provider rate limit reached. Please wait a minute and try again.`);
    this.name = "ProviderRateLimitError";
  }
}

const windows = new Map<string, { startsAt: number; count: number }>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function providerRateLimit(provider: AiProviderId) {
  const limit = Number(process.env.AI_PROVIDER_RATE_LIMIT_PER_MINUTE || 60);
  const now = Date.now();
  const windowMs = 60_000;
  const current = windows.get(provider);

  if (!current || now - current.startsAt >= windowMs) {
    windows.set(provider, { startsAt: now, count: 1 });
    return;
  }

  if (current.count >= limit) {
    throw new ProviderRateLimitError(provider);
  }

  current.count += 1;
}

function shouldRetry(response: Response) {
  return response.status === 429 || response.status >= 500;
}

export async function fetchWithRetry(
  provider: AiProviderId,
  input: string | URL,
  init: RequestInit,
  options: { retries?: number; timeoutMs?: number } = {},
) {
  providerRateLimit(provider);

  const retries = options.retries ?? 2;
  const timeoutMs = options.timeoutMs ?? 30_000;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!shouldRetry(response) || attempt === retries) {
        return response;
      }
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt === retries) break;
    }

    await sleep(400 * 2 ** attempt);
  }

  throw lastError instanceof Error ? lastError : new Error(`${provider} request failed after retries.`);
}

export async function readProviderError(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return `${response.status} ${response.statusText}`.trim();

  try {
    const json = JSON.parse(text);
    return json.error?.message || json.error || json.message || text.slice(0, 220);
  } catch {
    return text.slice(0, 220);
  }
}

