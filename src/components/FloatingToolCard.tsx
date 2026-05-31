"use client";

import { motion } from "framer-motion";
import { ToolIcon } from "@/components/ToolIcon";

type FloatingToolCardProps = {
  label: string;
  icon: string;
  delay?: number;
  className?: string;
};

export function FloatingToolCard({ label, icon, delay = 0, className }: FloatingToolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: [0, -12, 0] }}
      transition={{
        opacity: { delay, duration: 0.5 },
        y: { delay, duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
      className={`glass-card absolute hidden items-center gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-glow md:flex ${className || ""}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300/15">
        <ToolIcon name={icon} className="h-4 w-4 text-cyan-100" />
      </span>
      {label}
    </motion.div>
  );
}
