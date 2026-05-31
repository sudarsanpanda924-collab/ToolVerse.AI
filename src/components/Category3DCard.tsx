"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ToolCategory } from "@/config/tools";
import { ToolIcon } from "@/components/ToolIcon";
import { cn } from "@/lib/utils";

type Category3DCardProps = {
  category: ToolCategory & { count?: number };
};

export function Category3DCard({ category }: Category3DCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, rotateX: 4, rotateY: 4 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
      className="perspective-1200"
    >
      <Link
        href={`/tools?category=${category.id}`}
        className="glass-card group relative block min-h-64 overflow-hidden rounded-xl p-5"
      >
        <div className={cn("absolute inset-x-0 top-0 h-28 bg-gradient-to-r opacity-80 blur-2xl", category.accent)} />
        <div className="relative flex items-start justify-between gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-xl border border-white/20 bg-white/15 shadow-xl backdrop-blur-md">
            <ToolIcon name={category.icon} className="h-7 w-7 text-white" />
          </div>
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-cyan-100">
            {category.count || 0} tools
          </span>
        </div>
        <div className="relative mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
            {category.imagePrompt}
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">
            {category.name}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {category.description}
          </p>
        </div>
        <div className="absolute -bottom-10 -right-8 h-32 w-32 rounded-[2rem] border border-white/15 bg-white/10 rotate-12 transition group-hover:rotate-6" />
      </Link>
    </motion.div>
  );
}
