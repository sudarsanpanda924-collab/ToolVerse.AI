import "server-only";

import type { AiProviderId } from "@/lib/ai/types";

type EnvSpec = {
  key: string;
  aliases?: string[];
  provider?: AiProviderId;
  label: string;
};

export class MissingEnvironmentError extends Error {
  missing: string[];

  constructor(missing: string[]) {
    super(`Missing required environment variables: ${missing.join(", ")}. Add them to .env.local and restart the server.`);
    this.name = "MissingEnvironmentError";
    this.missing = missing;
  }
}

const requiredEnvSpecs: EnvSpec[] = [
  { key: "GEMINI_API_KEY", provider: "gemini", label: "Gemini" },
  { key: "GROQ_API_KEY", provider: "groq", label: "Groq" },
  { key: "OPENROUTER_API_KEY", provider: "openrouter", label: "OpenRouter" },
  {
    key: "HUGGINGFACE_API_KEY",
    aliases: ["HF_API_KEY"],
    provider: "huggingface",
    label: "Hugging Face",
  },
  { key: "NEXT_PUBLIC_APP_URL", aliases: ["NEXT_PUBLIC_SITE_URL"], label: "App URL" },
];

function readEnv(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return { key, value };
  }

  return null;
}

export function getEnvValue(key: string, aliases: string[] = []) {
  return readEnv([key, ...aliases])?.value || "";
}

export function getAppUrl() {
  return getEnvValue("NEXT_PUBLIC_APP_URL", ["NEXT_PUBLIC_SITE_URL"]) || "http://localhost:3000";
}

export function getGeminiApiKey() {
  return getEnvValue("GEMINI_API_KEY");
}

export function getGroqApiKey() {
  return getEnvValue("GROQ_API_KEY");
}

export function getOpenRouterApiKey() {
  return getEnvValue("OPENROUTER_API_KEY");
}

export function getHuggingFaceApiKey() {
  return getEnvValue("HUGGINGFACE_API_KEY", ["HF_API_KEY"]);
}

export function getAiEnvReport() {
  return requiredEnvSpecs.map((spec) => {
    const resolved = readEnv([spec.key, ...(spec.aliases || [])]);
    return {
      key: spec.key,
      provider: spec.provider,
      label: spec.label,
      configured: Boolean(resolved),
      source: resolved?.key,
    };
  });
}

export function validateRequiredAiEnv() {
  const missing = getAiEnvReport()
    .filter((entry) => !entry.configured)
    .map((entry) => entry.key);

  if (missing.length) {
    throw new MissingEnvironmentError(missing);
  }
}

