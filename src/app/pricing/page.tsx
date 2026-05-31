import type { Metadata } from "next";
import { PricingCard3D } from "@/components/PricingCard3D";
import { pricingPlans } from "@/config/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "ToolVerse AI pricing: free no-login tools, Pro AI usage, and Agency placeholders for future bulk workflows.",
};

export default function PricingPage() {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
            Simple pricing
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Free at launch, ready for paid tiers later
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            v1 requires no login. The free plan gives everyone 45 AI uses per
            day and unlimited non-AI tools. Paid tiers are prepared for future
            account-based limits.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard3D key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
