"use client";

import { useState } from "react";
import { BarChart3, CircleDollarSign, Power, ShieldCheck, Users } from "lucide-react";
import type { ManagedTool } from "@/lib/admin-store";
import type { UsageStats } from "@/lib/usage";

type ProviderStatus = {
  name: string;
  purpose: string;
  configured: boolean;
};

type PricingPlanState = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  enabled: boolean;
};

type AdminDashboardProps = {
  initialTools: ManagedTool[];
  stats: UsageStats;
  providers: ProviderStatus[];
  pricingPlans: PricingPlanState[];
};

export function AdminDashboard({
  initialTools,
  stats,
  providers,
  pricingPlans: initialPricingPlans,
}: AdminDashboardProps) {
  const [tools, setTools] = useState(initialTools);
  const [pricingPlans, setPricingPlans] = useState(initialPricingPlans);
  const [saving, setSaving] = useState("");

  async function updateTool(slug: string, enabled: boolean) {
    setSaving(slug);
    const response = await fetch("/api/admin/tools", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, enabled }),
    });
    const data = await response.json();
    if (response.ok) setTools(data.tools);
    setSaving("");
  }

  async function updatePlan(id: string, enabled: boolean) {
    setSaving(id);
    const response = await fetch("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    const data = await response.json();
    if (response.ok) setPricingPlans(data.plans);
    setSaving("");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const statCards = [
    { label: "Total users", value: stats.totalUsers, icon: Users },
    { label: "Total AI uses", value: stats.totalAiUses, icon: BarChart3 },
    { label: "Today AI uses", value: stats.todayAiUses, icon: ShieldCheck },
    { label: "Non-AI uses", value: stats.totalNonAiUses, icon: CircleDollarSign },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
            Secure admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            ToolVerse AI dashboard
          </h1>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
        >
          Logout
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card rounded-xl p-5">
            <card.icon className="h-5 w-5 text-cyan-100" />
            <p className="mt-4 text-3xl font-semibold text-white">{card.value}</p>
            <p className="mt-1 text-sm text-slate-400">{card.label}</p>
          </div>
        ))}
      </div>

      <section className="glass-card rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-white">Manage tools</h2>
          <span className="text-sm text-slate-400">{tools.length} total</span>
        </div>
        <div className="max-h-[34rem] overflow-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/[0.06] text-slate-300">
              <tr>
                <th className="px-4 py-3">Tool</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">AI</th>
                <th className="px-4 py-3">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr key={tool.slug} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{tool.name}</td>
                  <td className="px-4 py-3 text-slate-300">{tool.category}</td>
                  <td className="px-4 py-3 text-slate-300">{tool.provider}</td>
                  <td className="px-4 py-3 text-slate-300">{tool.isAI ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={saving === tool.slug}
                      onClick={() => updateTool(tool.slug, !tool.enabled)}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                        tool.enabled
                          ? "bg-emerald-400/15 text-emerald-200"
                          : "bg-rose-400/15 text-rose-200"
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {tool.enabled ? "On" : "Off"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="glass-card rounded-xl p-5">
          <h2 className="text-2xl font-semibold text-white">API status</h2>
          <div className="mt-4 space-y-3">
            {providers.map((provider) => (
              <div key={provider.name} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.05] p-3">
                <div>
                  <p className="font-medium text-white">{provider.name}</p>
                  <p className="text-xs text-slate-400">{provider.purpose}</p>
                </div>
                <span className={provider.configured ? "text-emerald-200" : "text-amber-200"}>
                  {provider.configured ? "Configured" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-xl p-5">
          <h2 className="text-2xl font-semibold text-white">Manage pricing plans</h2>
          <div className="mt-4 space-y-3">
            {pricingPlans.map((plan) => (
              <div key={plan.id} className="rounded-xl bg-white/[0.05] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">
                      {plan.name} - {plan.price}/{plan.period}
                    </p>
                    <p className="text-xs text-slate-400">{plan.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={saving === plan.id}
                    onClick={() => updatePlan(plan.id, !plan.enabled)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      plan.enabled ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200"
                    }`}
                  >
                    {plan.enabled ? "Visible" : "Hidden"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
