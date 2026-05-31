import "server-only";

import { getGeminiApiKey } from "@/lib/ai/env";
import { fetchWithRetry, readProviderError } from "@/lib/ai/http";
import type { ProviderStatus } from "@/lib/ai/types";

function getGeminiModel() {
  return process.env.GEMINI_MODEL || "gemini-2.0-flash";
}

function requireGeminiApiKey() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY. Add it to .env.local and restart the server.");
  return apiKey;
}

export async function generateGeminiText(systemPrompt: string, userPrompt: string) {
  const apiKey = requireGeminiApiKey();
  const model = getGeminiModel();
  const response = await fetchWithRetry(
    "gemini",
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.72,
          maxOutputTokens: 1800,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini failed: ${await readProviderError(response)}`);
  }

  const data = await response.json();
  const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof output !== "string" || !output.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  return output.trim();
}

export async function testGeminiConnection(): Promise<ProviderStatus> {
  const startedAt = Date.now();
  const testedAt = new Date().toISOString();

  try {
    const apiKey = requireGeminiApiKey();
    const response = await fetchWithRetry(
      "gemini",
      `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModel()}?key=${encodeURIComponent(apiKey)}`,
      { method: "GET" },
      { retries: 1, timeoutMs: 10_000 },
    );

    if (!response.ok) {
      throw new Error(await readProviderError(response));
    }

    return {
      id: "gemini",
      name: "Gemini",
      purpose: "Writing, SEO, summaries, and PDF reasoning",
      configured: true,
      ok: true,
      message: "Connected",
      latencyMs: Date.now() - startedAt,
      testedAt,
    };
  } catch (error) {
    return {
      id: "gemini",
      name: "Gemini",
      purpose: "Writing, SEO, summaries, and PDF reasoning",
      configured: Boolean(getGeminiApiKey()),
      ok: false,
      message: error instanceof Error ? error.message : "Gemini connection failed.",
      latencyMs: Date.now() - startedAt,
      testedAt,
    };
  }
}
