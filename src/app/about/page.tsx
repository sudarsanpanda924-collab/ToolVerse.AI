import type { Metadata } from "next";
import { categoryToolCounts, toolCount } from "@/config/tools";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about ToolVerse AI, a free tools platform for creators, students, freelancers, and businesses.",
};

export default function AboutPage() {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="glass-panel rounded-xl p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
            About us
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            ToolVerse AI makes useful web tools easier to find and faster to use
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            ToolVerse AI is a launch-ready platform for free AI tools,
            converters, calculators, and creator utilities. The goal is simple:
            give students, creators, freelancers, and businesses a clean place
            to complete everyday digital tasks without installing heavy software
            or creating an account.
          </p>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            The website is built around a dynamic tool engine. Instead of
            maintaining hundreds of duplicated pages, every tool is powered by a
            central config file that provides fields, SEO metadata, FAQs,
            related tools, provider routing, and visual category identity.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="glass-card rounded-xl p-5">
            <p className="text-3xl font-semibold text-white">200+</p>
            <p className="mt-2 text-sm text-slate-400">Tools configured for launch</p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <p className="text-3xl font-semibold text-white">{categoryToolCounts.length}</p>
            <p className="mt-2 text-sm text-slate-400">Distinct visual categories</p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <p className="text-3xl font-semibold text-white">0</p>
            <p className="mt-2 text-sm text-slate-400">Logins required in v1</p>
          </div>
        </div>
      </div>
    </section>
  );
}
