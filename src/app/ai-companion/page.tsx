import type { Metadata } from "next";
import { NovaCompanion } from "@/components/NovaCompanion";

export const metadata: Metadata = {
  title: "Nova AI Companion - Your Personal AI Friend",
  description:
    "Meet Nova, your safe AI companion on ToolVerse AI. Chat, get motivated, study together, or receive business mentorship — powered by Gemini and Groq AI.",
  openGraph: {
    title: "Nova AI Companion - Your Personal AI Friend",
    description:
      "Meet Nova, your safe AI companion. Chat, study, get motivated, or receive business mentorship.",
  },
};

export default function AiCompanionPage() {
  return (
    <>
      {/* Hero Banner */}
      <section className="relative overflow-hidden px-4 pb-2 pt-14 text-center sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
            AI Companion
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Meet{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Nova
            </span>
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Your personal AI companion for support, study, motivation, and mentorship.
            <br className="hidden sm:block" />
            Always safe, always here for you.
          </p>
        </div>
      </section>

      {/* Chat Interface */}
      <NovaCompanion />
    </>
  );
}
