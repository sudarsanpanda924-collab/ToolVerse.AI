"use client";

import type { ReactNode } from "react";
import { Loader2, RefreshCw, Scissors, Sparkles, SmilePlus } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { DownloadButton } from "@/components/DownloadButton";
import type { FreelancerProposalResult } from "@/lib/ai/types";

type ProposalAction = "Regenerate" | "Shorten proposal" | "Make it more premium" | "Make it more friendly";

type FreelancerProposalOutputProps = {
  result: FreelancerProposalResult;
  loading: boolean;
  onAction: (action: ProposalAction) => void;
};

const sections: Array<[keyof FreelancerProposalResult, string]> = [
  ["shortProposal", "Short proposal"],
  ["detailedProposal", "Detailed proposal"],
  ["personalizedOpeningLine", "Personalized opening line"],
  ["clientPainPointAnalysis", "Client pain-point analysis"],
  ["solutionApproach", "Solution approach"],
  ["relevantExperienceParagraph", "Relevant experience paragraph"],
  ["timeline", "Timeline"],
  ["pricingSuggestion", "Pricing suggestion"],
  ["callToAction", "Call-to-action"],
  ["followUpMessage", "Follow-up message"],
];

function fullProposalText(result: FreelancerProposalResult) {
  return [
    ["Short proposal", result.shortProposal],
    ["Detailed proposal", result.detailedProposal],
    ["Personalized opening line", result.personalizedOpeningLine],
    ["Client pain-point analysis", result.clientPainPointAnalysis],
    ["Solution approach", result.solutionApproach],
    ["Relevant experience paragraph", result.relevantExperienceParagraph],
    ["Timeline", result.timeline],
    ["Pricing suggestion", result.pricingSuggestion],
    ["Call-to-action", result.callToAction],
    ["Follow-up message", result.followUpMessage],
    ["Proposal Score", `Personalization: ${result.scores.personalization}/100\nClarity: ${result.scores.clarity}/100\nTrust: ${result.scores.trust}/100\nConversion: ${result.scores.conversion}/100`],
  ]
    .map(([heading, body]) => `${heading}\n${body}`)
    .join("\n\n");
}

function scoreClass(score: number) {
  if (score >= 82) return "text-emerald-200";
  if (score >= 68) return "text-cyan-200";
  return "text-amber-200";
}

function ActionButton({
  action,
  loading,
  onAction,
  icon,
}: {
  action: ProposalAction;
  loading: boolean;
  onAction: (action: ProposalAction) => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onAction(action)}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {action}
    </button>
  );
}

export function FreelancerProposalOutput({
  result,
  loading,
  onAction,
}: FreelancerProposalOutputProps) {
  const exportValue = fullProposalText(result);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Output</h2>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={exportValue} label="Copy proposal" />
          <ActionButton
            action="Regenerate"
            loading={loading}
            onAction={onAction}
            icon={<RefreshCw className="h-4 w-4" />}
          />
          <DownloadButton
            value={exportValue}
            filename="freelancer-proposal.txt"
            label="Export TXT"
          />
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
          <p className="text-xs text-slate-400">Personalization Score /100</p>
          <p className={`mt-1 text-2xl font-semibold ${scoreClass(result.scores.personalization)}`}>
            {result.scores.personalization}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
          <p className="text-xs text-slate-400">Clarity Score /100</p>
          <p className={`mt-1 text-2xl font-semibold ${scoreClass(result.scores.clarity)}`}>
            {result.scores.clarity}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
          <p className="text-xs text-slate-400">Trust Score /100</p>
          <p className={`mt-1 text-2xl font-semibold ${scoreClass(result.scores.trust)}`}>
            {result.scores.trust}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
          <p className="text-xs text-slate-400">Conversion Score /100</p>
          <p className={`mt-1 text-2xl font-semibold ${scoreClass(result.scores.conversion)}`}>
            {result.scores.conversion}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <ActionButton
          action="Shorten proposal"
          loading={loading}
          onAction={onAction}
          icon={<Scissors className="h-4 w-4" />}
        />
        <ActionButton
          action="Make it more premium"
          loading={loading}
          onAction={onAction}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <ActionButton
          action="Make it more friendly"
          loading={loading}
          onAction={onAction}
          icon={<SmilePlus className="h-4 w-4" />}
        />
      </div>

      <div className="space-y-4">
        {sections.map(([key, label]) => {
          const value = result[key];
          if (typeof value !== "string" || !value.trim()) return null;

          return (
            <section
              key={key}
              className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
            >
              <h3 className="mb-2 text-sm font-semibold text-slate-200">{label}</h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-100">{value}</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
