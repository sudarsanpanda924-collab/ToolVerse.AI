import type { Tool } from "@/config/tools";

export type AiProviderId = "gemini" | "groq" | "openrouter" | "huggingface";

export type ToolInputs = Record<string, string>;

export type AiRouterResult = {
  provider: AiProviderId;
  output: string;
  tweetRewrite?: TweetRewriteResult;
  freelancerProposal?: FreelancerProposalResult;
};

export type AiRouterRequest = {
  tool: Tool;
  inputs: ToolInputs;
};

export type TweetRewriteResult = {
  mode: string;
  rewrittenTweet: string;
  thread: string[];
  hookScore: number;
  engagementScore: number;
  characterCount: number;
  characterCounts: number[];
  hashtags: string[];
};

export type FreelancerProposalResult = {
  tone: string;
  shortProposal: string;
  detailedProposal: string;
  personalizedOpeningLine: string;
  clientPainPointAnalysis: string;
  solutionApproach: string;
  relevantExperienceParagraph: string;
  timeline: string;
  pricingSuggestion: string;
  callToAction: string;
  followUpMessage: string;
  scores: {
    personalization: number;
    clarity: number;
    trust: number;
    conversion: number;
  };
};

export type ProviderStatus = {
  id: AiProviderId;
  name: string;
  purpose: string;
  configured: boolean;
  ok: boolean;
  message: string;
  latencyMs?: number;
  testedAt: string;
};
