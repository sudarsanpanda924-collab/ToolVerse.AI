"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { toolCount } from "@/config/tools";
import { DashboardPreview } from "@/components/DashboardPreview";
import { FloatingToolCard } from "@/components/FloatingToolCard";

const stats = ["200+ Tools", "No Login", "Free AI Uses", "Fast Converters"];

export function Hero3D() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <FloatingToolCard label="AI Writing" icon="Sparkles" className="left-8 top-32" />
      <FloatingToolCard label="PDF OCR" icon="FileText" delay={0.3} className="right-10 top-24" />
      <FloatingToolCard label="YouTube SEO" icon="Youtube" delay={0.6} className="bottom-20 left-16" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100"
          >
            <Sparkles className="h-4 w-4" />
            New launch scaffold with 200+ free tools
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-balance mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl"
          >
            200+ Free AI Tools, Converters, Calculators & Creator Utilities
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-6 max-w-2xl text-lg leading-8 text-slate-300"
          >
            Generate content, convert files, analyze YouTube titles, compress PDFs,
            create images, and more - all in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/tools"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-100"
            >
              Explore Tools
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 py-3 font-semibold text-white transition hover:border-cyan-200/60 hover:bg-cyan-300/10"
            >
              Start Free
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <div key={stat} className="glass-card rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-semibold text-white">{stat}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <DashboardPreview />
      </div>
    </section>
  );
}
