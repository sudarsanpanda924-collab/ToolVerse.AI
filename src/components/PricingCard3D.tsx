"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { PricingPlan } from "@/config/pricing";
import { cn } from "@/lib/utils";

type PricingCard3DProps = {
  plan: PricingPlan;
};

export function PricingCard3D({ plan }: PricingCard3DProps) {
  return (
    <motion.div
      whileHover={{ y: -8, rotateX: 3 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={cn(
        "glass-card rounded-xl p-6",
        plan.highlighted && "border-cyan-200/50 shadow-glow",
      )}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">
        {plan.name}
      </p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-semibold text-white">{plan.price}</span>
        <span className="pb-1 text-sm text-slate-400">/{plan.period}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{plan.description}</p>
      <div className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center gap-3 text-sm text-slate-200">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-cyan-300/15">
              <Check className="h-3.5 w-3.5 text-cyan-100" />
            </span>
            {feature}
          </div>
        ))}
      </div>
      <button
        type="button"
        className={cn(
          "mt-8 w-full rounded-xl px-5 py-3 text-sm font-semibold transition",
          plan.highlighted
            ? "bg-white text-slate-950 hover:bg-cyan-100"
            : "border border-white/10 bg-white/10 text-white hover:bg-white/15",
        )}
      >
        {plan.name === "Free" ? "Start free" : "Coming soon"}
      </button>
    </motion.div>
  );
}
