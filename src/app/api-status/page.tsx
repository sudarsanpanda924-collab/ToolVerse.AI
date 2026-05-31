import type { Metadata } from "next";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { getProviderStatus } from "@/lib/providers";

export const metadata: Metadata = {
  title: "API Status",
  description:
    "Check ToolVerse AI provider configuration status for Gemini, Groq, OpenRouter, Pollinations, Hugging Face, and Firebase.",
};

export const dynamic = "force-dynamic";

export default async function ApiStatusPage() {
  const providers = await getProviderStatus();

  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
            API status
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Provider readiness dashboard
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            This page reads server-side environment configuration only. It does
            not expose API keys or private secrets.
          </p>
        </div>
        <div className="grid gap-4">
          {providers.map((provider) => (
            <div
              key={provider.name}
              className="glass-card flex flex-col justify-between gap-4 rounded-xl p-5 sm:flex-row sm:items-center"
            >
              <div>
                <h2 className="text-lg font-semibold text-white">{provider.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{provider.purpose}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-100">
                {provider.configured ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                ) : (
                  <CircleAlert className="h-4 w-4 text-amber-300" />
                )}
                {provider.configured ? "Configured" : "Needs env key"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
