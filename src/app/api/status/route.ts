import { NextResponse } from "next/server";
import { toolCount } from "@/config/tools";
import { getAiEnvReport } from "@/lib/ai/env";
import { getFirebaseEnvReport } from "@/lib/firebase-config";
import { getProviderStatus } from "@/lib/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const providers = await getProviderStatus();
  const aiEnvironment = getAiEnvReport();
  const firebaseEnvironment = getFirebaseEnvReport().map((entry) => ({
    ...entry,
    label: "Firebase",
    source: entry.configured ? entry.key : undefined,
  }));
  const environment = [...aiEnvironment, ...firebaseEnvironment];

  return NextResponse.json({
    ok:
      providers.every((provider) => !("ok" in provider) || provider.ok) &&
      environment.every((entry) => entry.configured),
    name: "ToolVerse AI",
    toolCount,
    generatedAt: new Date().toISOString(),
    environment: environment.map(({ key, label, configured, source }) => ({
      key,
      label,
      configured,
      source,
    })),
    providers,
  });
}
