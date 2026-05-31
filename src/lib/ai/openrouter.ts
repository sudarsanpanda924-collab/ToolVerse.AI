import "server-only";

import { getAppUrl, getOpenRouterApiKey } from "@/lib/ai/env";
import { fetchWithRetry, readProviderError } from "@/lib/ai/http";
import type { ProviderStatus } from "@/lib/ai/types";

function getOpenRouterModel() {
  return process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free";
}

function requireOpenRouterApiKey() {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY. Add it to .env.local and restart the server.");
  return apiKey;
}

function openRouterHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": getAppUrl(),
    "X-Title": "ToolVerse AI",
  };
}

export async function generateOpenRouterText(systemPrompt: string, userPrompt: string) {
  const apiKey = requireOpenRouterApiKey();
  const response = await fetchWithRetry("openrouter", "https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: openRouterHeaders(apiKey),
    body: JSON.stringify({
      model: getOpenRouterModel(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.72,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter failed: ${await readProviderError(response)}`);
  }

  const data = await response.json();
  const output = data?.choices?.[0]?.message?.content;
  if (typeof output !== "string" || !output.trim()) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return output.trim();
}

export async function testOpenRouterConnection(): Promise<ProviderStatus> {
  const startedAt = Date.now();
  const testedAt = new Date().toISOString();

  try {
    const apiKey = requireOpenRouterApiKey();
    const response = await fetchWithRetry(
      "openrouter",
      "https://openrouter.ai/api/v1/auth/key",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      { retries: 1, timeoutMs: 10_000 },
    );

    if (!response.ok) {
      throw new Error(await readProviderError(response));
    }

    return {
      id: "openrouter",
      name: "OpenRouter",
      purpose: "Fallback model routing",
      configured: true,
      ok: true,
      message: "Connected",
      latencyMs: Date.now() - startedAt,
      testedAt,
    };
  } catch (error) {
    return {
      id: "openrouter",
      name: "OpenRouter",
      purpose: "Fallback model routing",
      configured: Boolean(getOpenRouterApiKey()),
      ok: false,
      message: error instanceof Error ? error.message : "OpenRouter connection failed.",
      latencyMs: Date.now() - startedAt,
      testedAt,
    };
  }
}

