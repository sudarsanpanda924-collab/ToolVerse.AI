export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { getAiEnvReport } = await import("@/lib/ai/env");
  const { getMissingFirebaseEnv } = await import("@/lib/firebase-config");
  const missingAiEnv = getAiEnvReport()
    .filter((entry) => !entry.configured)
    .map((entry) => entry.key);
  const missingFirebaseEnv = getMissingFirebaseEnv();
  const missing = [...missingAiEnv, ...missingFirebaseEnv];

  if (missing.length) {
    const message = `[ToolVerse] Missing required environment variables: ${missing.join(", ")}. Add them to .env.local and restart the server.`;
    console.error(message);
  }
}
