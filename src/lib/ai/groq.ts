import "server-only";

import { getGroqApiKey } from "@/lib/ai/env";
import { fetchWithRetry, readProviderError } from "@/lib/ai/http";
import type { ProviderStatus } from "@/lib/ai/types";

function getGroqModel() {
  return process.env.GROQ_MODEL || "llama-3.1-8b-instant";
}

function requireGroqApiKey() {
  const apiKey = getGroqApiKey();
  if (!apiKey) throw new Error("Missing GROQ_API_KEY. Add it to .env.local and restart the server.");
  return apiKey;
}

export async function generateGroqText(systemPrompt: string, userPrompt: string) {
  const apiKey = requireGroqApiKey();
  const response = await fetchWithRetry("groq", "https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getGroqModel(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 1800,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq failed: ${await readProviderError(response)}`);
  }

  const data = await response.json();
  const output = data?.choices?.[0]?.message?.content;
  if (typeof output !== "string" || !output.trim()) {
    throw new Error("Groq returned an empty response.");
  }

  return output.trim();
}

export async function testGroqConnection(): Promise<ProviderStatus> {
  const startedAt = Date.now();
  const testedAt = new Date().toISOString();

  try {
    const apiKey = requireGroqApiKey();
    const response = await fetchWithRetry(
      "groq",
      "https://api.groq.com/openai/v1/models",
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
      id: "groq",
      name: "Groq",
      purpose: "Hooks, titles, rewrites, and fast creator copy",
      configured: true,
      ok: true,
      message: "Connected",
      latencyMs: Date.now() - startedAt,
      testedAt,
    };
  } catch (error) {
    return {
      id: "groq",
      name: "Groq",
      purpose: "Hooks, titles, rewrites, and fast creator copy",
      configured: Boolean(getGroqApiKey()),
      ok: false,
      message: error instanceof Error ? error.message : "Groq connection failed.",
      latencyMs: Date.now() - startedAt,
      testedAt,
    };
  }
}
