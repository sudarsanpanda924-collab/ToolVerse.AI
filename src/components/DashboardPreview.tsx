"use client";

import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Gauge, Search, Zap } from "lucide-react";

const rows = [
  ["AI Writing", "Live", "45/day"],
  ["PDF Tools", "Ready", "Unlimited"],
  ["YouTube SEO", "Live", "AI"],
  ["Converters", "Ready", "Unlimited"],
];

export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="perspective-1200 relative mx-auto w-full max-w-xl"
    >
      <div className="glass-panel preserve-3d overflow-hidden rounded-xl p-4 shadow-glow">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-sm font-semibold text-white">ToolVerse Command Center</p>
            <p className="text-xs text-slate-400">200+ free tools routed by one engine</p>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-200">
            Online
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "AI Uses", value: "45", icon: Zap },
            { label: "Fast APIs", value: "6", icon: Gauge },
            { label: "Indexed", value: "SEO", icon: Search },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
              <stat.icon className="h-4 w-4 text-cyan-200" />
              <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/42 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
            <BarChart3 className="h-4 w-4 text-cyan-200" />
            Category health
          </div>
          <div className="space-y-2">
            {rows.map(([name, status, limit], index) => (
              <div
                key={name}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2 text-xs"
              >
                <span className="text-slate-200">{name}</span>
                <span className="flex items-center gap-1 text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {status}
                </span>
                <span className="text-slate-400">{limit}</span>
                <span
                  className="col-span-3 h-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
                  style={{ width: `${86 - index * 8}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
