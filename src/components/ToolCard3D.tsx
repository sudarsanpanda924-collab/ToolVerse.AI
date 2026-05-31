"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Tool } from "@/config/tools";
import { ToolIllustration } from "@/components/ToolIllustration";
import { cn } from "@/lib/utils";

type ToolCard3DProps = {
  tool: Tool;
  compact?: boolean;
};

export function ToolCard3D({ tool, compact }: ToolCard3DProps) {
  return (
    <motion.div
      whileHover={{ y: -8, rotateX: 3, rotateY: -3 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="perspective-1200 h-full"
    >
      <Link
        href={`/tools/${tool.slug}`}
        className="glass-card preserve-3d group flex h-full flex-col overflow-hidden rounded-xl p-3 transition hover:border-cyan-200/50"
      >
        <ToolIllustration
          icon={tool.icon}
          accent={tool.accent}
          variant={tool.illustration}
          className={cn(compact ? "h-32" : "h-40")}
          label={`${tool.name} illustration`}
        />
        <div className="flex flex-1 flex-col p-2 pt-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-cyan-100">
              {tool.isAI ? "AI" : "Unlimited"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
              {tool.outputType}
            </span>
          </div>
          <h3 className="text-base font-semibold tracking-tight text-white group-hover:text-cyan-100">
            {tool.name}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
            {tool.description}
          </p>
          <div className="mt-auto flex items-center justify-between pt-5 text-sm font-medium text-cyan-100">
            Open tool
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
