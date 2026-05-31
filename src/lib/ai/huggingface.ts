import "server-only";

import { getHuggingFaceApiKey } from "@/lib/ai/env";
import { fetchWithRetry, readProviderError } from "@/lib/ai/http";
import type { ProviderStatus } from "@/lib/ai/types";

function requireHuggingFaceApiKey() {
  const apiKey = getHuggingFaceApiKey();
  if (!apiKey) throw new Error("Missing HUGGINGFACE_API_KEY. Add it to .env.local and restart the server.");
  return apiKey;
}

function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

export async function transcribeAudio(buffer: Buffer, mimeType: string) {
  const apiKey = requireHuggingFaceApiKey();
  const model = process.env.HUGGINGFACE_SPEECH_MODEL || "openai/whisper-small";
  const response = await fetchWithRetry(
    "huggingface",
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": mimeType || "application/octet-stream",
      },
      body: toArrayBuffer(buffer),
    },
    { retries: 2, timeoutMs: 45_000 },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Hugging Face speech failed: ${data?.error || (await readProviderError(response))}`);
  }

  const text = typeof data?.text === "string" ? data.text.trim() : "";
  if (!text) throw new Error("Hugging Face returned an empty transcription.");

  return text;
}

export async function testHuggingFaceConnection(): Promise<ProviderStatus> {
  const startedAt = Date.now();
  const testedAt = new Date().toISOString();

  try {
    const apiKey = requireHuggingFaceApiKey();
    const response = await fetchWithRetry(
      "huggingface",
      "https://huggingface.co/api/whoami-v2",
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
      id: "huggingface",
      name: "Hugging Face",
      purpose: "OCR, speech, and background-removal models",
      configured: true,
      ok: true,
      message: "Connected",
      latencyMs: Date.now() - startedAt,
      testedAt,
    };
  } catch (error) {
    return {
      id: "huggingface",
      name: "Hugging Face",
      purpose: "OCR, speech, and background-removal models",
      configured: Boolean(getHuggingFaceApiKey()),
      ok: false,
      message: error instanceof Error ? error.message : "Hugging Face connection failed.",
      latencyMs: Date.now() - startedAt,
      testedAt,
    };
  }
}

