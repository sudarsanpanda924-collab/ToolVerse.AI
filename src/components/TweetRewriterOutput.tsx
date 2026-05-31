"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import type { TweetRewriteResult } from "@/lib/ai/types";

type TweetRewriterOutputProps = {
  result: TweetRewriteResult;
  loading: boolean;
  onRegenerate: () => void;
};

function copyValue(result: TweetRewriteResult) {
  const tweetText = result.thread.length
    ? result.thread.map((tweet, index) => `${index + 1}. ${tweet}`).join("\n\n")
    : result.rewrittenTweet;

  return [tweetText, result.hashtags.join(" ")].filter(Boolean).join("\n\n");
}

function scoreClass(score: number) {
  if (score >= 80) return "text-emerald-200";
  if (score >= 65) return "text-cyan-200";
  return "text-amber-200";
}

function countClass(count: number) {
  if (count <= 260) return "text-emerald-200";
  if (count <= 280) return "text-amber-200";
  return "text-rose-200";
}

export function TweetRewriterOutput({
  result,
  loading,
  onRegenerate,
}: TweetRewriterOutputProps) {
  const tweets = result.thread.length ? result.thread : [result.rewrittenTweet];

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Output</h2>
        <div className="flex gap-2">
          <CopyButton value={copyValue(result)} />
          <button
            type="button"
            onClick={onRegenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Regenerate
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
          <p className="text-xs text-slate-400">Hook Score /100</p>
          <p className={`mt-1 text-2xl font-semibold ${scoreClass(result.hookScore)}`}>
            {result.hookScore}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
          <p className="text-xs text-slate-400">Engagement Score /100</p>
          <p className={`mt-1 text-2xl font-semibold ${scoreClass(result.engagementScore)}`}>
            {result.engagementScore}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
          <p className="text-xs text-slate-400">Mode</p>
          <p className="mt-1 text-lg font-semibold text-white">{result.mode}</p>
        </div>
      </div>

      <div className="space-y-4">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Rewritten tweet</h3>
          <div className="space-y-3">
            {tweets.map((tweet, index) => (
              <div
                key={`${tweet}-${index}`}
                className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-100"
              >
                {result.thread.length ? (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-200">
                    Tweet {index + 1}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap">{tweet}</p>
                <p className={`mt-3 text-xs font-medium ${countClass(tweet.length)}`}>
                  Character count: {tweet.length}/280
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Hashtag suggestions</h3>
          <div className="flex flex-wrap gap-2">
            {result.hashtags.map((hashtag) => (
              <span
                key={hashtag}
                className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-sm font-medium text-cyan-100"
              >
                {hashtag}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
