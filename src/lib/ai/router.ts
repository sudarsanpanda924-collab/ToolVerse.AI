import "server-only";

import { getAiEnvReport, validateRequiredAiEnv } from "@/lib/ai/env";
import { generateGeminiText, testGeminiConnection } from "@/lib/ai/gemini";
import { generateGroqText, testGroqConnection } from "@/lib/ai/groq";
import { testHuggingFaceConnection } from "@/lib/ai/huggingface";
import { generateOpenRouterText, testOpenRouterConnection } from "@/lib/ai/openrouter";
import type {
  AiProviderId,
  AiRouterRequest,
  AiRouterResult,
  FreelancerProposalResult,
  ProviderStatus,
  TweetRewriteResult,
} from "@/lib/ai/types";

function buildSystemPrompt({ tool }: AiRouterRequest) {
  if (tool.slug === "ai-product-description-generator") {
    return [
      "You are ToolVerse AI running the AI Product Description Generator.",
      "You write original, conversion-focused product descriptions for ecommerce, SaaS, marketplaces, and landing pages.",
      "Use only the provided product details. Do not invent certifications, awards, discounts, reviews, shipping claims, guarantees, or technical specs.",
      "Return polished marketing copy, not a placeholder, scaffold response, or explanation of what you could do.",
      "Use clear markdown headings and concise bullets.",
    ].join("\n");
  }

  if (tool.slug === "ai-bio-generator") {
    return [
      "You are ToolVerse AI running the AI Bio Generator.",
      "You write professional, engaging, and highly optimized personal and professional bios for various platforms.",
      "Use the details provided by the user. Do not invent fake jobs, companies, or credentials that are not implied by the inputs.",
      "Return the completed bios directly, without any introductory or concluding remarks, explanations, or meta-commentary.",
      "Use clear markdown headings (e.g. ## Short bio) to separate the sections.",
    ].join("\n");
  }

  if (tool.slug === "ai-tweet-rewriter") {
    return [
      "You are ToolVerse AI running the AI Tweet Rewriter.",
      "You rewrite user-provided tweets into high-performing X/Twitter content using the requested mode.",
      "Rules:",
      "- Do not change the core meaning of the original tweet.",
      "- Improve clarity, hook strength, emotion, and engagement.",
      "- Single tweet modes must stay under 280 characters.",
      "- Thread Mode must produce 5 to 8 tweets; keep each tweet under 280 characters.",
      "- Do not copy copyrighted text, slogans, catchphrases, or distinctive wording.",
      "- Do not generate harmful, abusive, harassing, or hateful content.",
      "- If a mode names a public figure, use broad communication traits only; do not impersonate the person or claim they wrote it.",
      "- Return only valid JSON. Do not include markdown fences, commentary, or placeholders.",
    ].join("\n");
  }

  if (tool.slug === "freelancer-proposal-generator") {
    return [
      "You are ToolVerse AI running the Freelancer Proposal Generator.",
      "You write premium, human, client-winning freelance proposals for Upwork, Fiverr, agencies, and direct client outreach.",
      "Rules:",
      "- Use only the user-provided job post, skills, experience, portfolio link, budget, and delivery time.",
      "- Do not invent fake projects, fake client results, fake years of experience, fake testimonials, or fake portfolio claims.",
      "- Never use generic openings like 'Dear Sir/Madam', 'I hope this message finds you well', or 'I am writing to express my interest'.",
      "- Mention the client's project naturally and show you understand the pain points.",
      "- Highlight relevant skills with confidence, but do not sound desperate or overpromise.",
      "- Keep the proposal human, concise, specific, and safe.",
      "- Return only valid JSON. Do not include markdown fences, commentary, or placeholders.",
    ].join("\n");
  }

  if (tool.slug === "ai-startup-idea-generator") {
    return [
      "You are ToolVerse AI running the AI Startup Idea Generator.",
      "You generate premium, highly detailed, and original startup business plans, validation metrics, and launch strategies based on founder inputs.",
      "Rules:",
      "- Avoid generic, cliché, or simple wrapper business ideas (like a basic checklist app or simple delivery clone). Give highly custom, creative, and viable ideas.",
      "- Output the content structured strictly using the tag boundaries: [START_IDEA], [END_IDEA], [START_BUS], [END_BUS], [START_MVP], and [END_MVP].",
      "- Return the markdown content directly, with no introductory or concluding remarks, explanations, or meta-commentary.",
    ].join("\n");
  }

  if (tool.slug === "linkedin-post-formatter") {
    return [
      "You are ToolVerse AI running the LinkedIn Post Formatter.",
      "You write highly engaging, optimized, and professional LinkedIn posts based on raw text and user preferences.",
      "Rules:",
      "- Do not make up fake claims, fake testimonials, or false metrics.",
      "- Make the posts highly engaging, readable (use single line spacing and clear line breaks), and professional (avoid cringey or spammy language).",
      "- Return the formatted markdown directly, with no introductory or concluding remarks, explanations, or meta-commentary.",
    ].join("\n");
  }

  return [
    `You are ToolVerse AI running the ${tool.name}.`,
    `Category: ${tool.category}.`,
    "Return practical, original, safe, non-copyrighted output.",
    "Use clear headings, short bullets, and avoid unsupported factual claims.",
    "If the request involves legal, finance, medical, or platform policy advice, add a concise review note.",
  ].join("\n");
}

function buildUserPrompt({ tool, inputs }: AiRouterRequest) {
  if (tool.slug === "ai-product-description-generator") {
    return [
      "Generate a complete product description package using these inputs:",
      "",
      `Product name: ${inputs.productName || ""}`,
      `Product category: ${inputs.productCategory || ""}`,
      `Target audience: ${inputs.targetAudience || ""}`,
      `Key features: ${inputs.keyFeatures || ""}`,
      `Tone: ${inputs.tone || "Professional"}`,
      `Platform: ${inputs.platform || "Ecommerce Store"}`,
      "",
      "Output exactly these sections:",
      "",
      "## Product title",
      "Create one strong product title.",
      "",
      "## Short description",
      "Write 1-2 concise sentences.",
      "",
      "## Long description",
      "Write a polished paragraph for the selected platform and audience.",
      "",
      "## Bullet points",
      "Write 5 benefit-led bullets based on the key features.",
      "",
      "## SEO keywords",
      "List 8-12 comma-separated search keywords.",
      "",
      "## Call to action",
      "Write one clear CTA line.",
    ].join("\n");
  }

  if (tool.slug === "ai-bio-generator") {
    return [
      "Generate a complete personal and professional bio package using these inputs:",
      "",
      `Name: ${inputs.name || ""}`,
      `Profession: ${inputs.profession || ""}`,
      `Platform: ${inputs.platform || "General"}`,
      `Tone: ${inputs.tone || "Professional"}`,
      `Skills: ${inputs.skills || ""}`,
      `Goal: ${inputs.goal || ""}`,
      "",
      "Output exactly these sections, using markdown headings:",
      "",
      "## Short bio",
      "Write a short, engaging 1-2 sentence bio highlighting the core value proposition.",
      "",
      "## Professional bio",
      "Write a formal and detailed professional bio (1-2 paragraphs) suitable for resumes, speaking engagements, or website 'About' pages.",
      "",
      "## Social media bio",
      "Write a concise bio (under 160 characters) suitable for Twitter/X, Instagram, or TikTok, utilizing a few relevant emojis and a clean format.",
      "",
      "## LinkedIn bio",
      "Write a compelling LinkedIn 'About' summary (2-3 short paragraphs), focusing on professional journey, achievements, core skills, and a call-to-action/contact line.",
      "",
      "## YouTube channel bio",
      "Write an engaging channel description (1-2 paragraphs) highlighting the value the channel provides to viewers, target topics, and call to subscribe.",
      "",
      "## Bio variations",
      "Provide 5 distinct bio variations (ranging from quirky/casual to ultra-professional/authoritative, label them clearly as Variation 1, Variation 2, etc.).",
    ].join("\n");
  }

  if (tool.slug === "ai-tweet-rewriter") {
    const mode = inputs.mode || "Viral Mode";

    return [
      "Rewrite and optimize the original tweet draft using these inputs.",
      "",
      `Original tweet: ${inputs.originalTweet || ""}`,
      `Mode: ${mode}`,
      `Target audience: ${inputs.targetAudience || ""}`,
      `Goal: ${inputs.goal || ""}`,
      "",
      "Mode guidance:",
      "- Viral Mode: stronger hook, curiosity, emotion, shareability, and clear payoff.",
      "- Elon Musk Style: concise, direct, contrarian, tech-forward, and plain-spoken without impersonation.",
      "- Alex Hormozi Style: direct, tactical, value-focused, business-growth framing without copying catchphrases.",
      "- Professional Mode: polished, credible, concise, and industry-safe.",
      "- Casual Mode: conversational, warm, simple, and human.",
      "- Thread Mode: turn the idea into a 5-8 tweet thread with a strong opening hook and logical flow.",
      "",
      "Return valid JSON with exactly this shape:",
      "",
      "{\"rewrittenTweet\":\"string\",\"thread\":[\"string\"],\"hashtags\":[\"#string\"]}",
      "",
      "For single tweet modes, set thread to an empty array and keep rewrittenTweet under 280 characters.",
      "For Thread Mode, set rewrittenTweet to the first tweet and thread to 5-8 tweets. Keep every thread item under 280 characters.",
      "Do not include hashtags inside rewrittenTweet or thread items; put hashtags only in the hashtags array.",
      "Provide 3-5 relevant hashtag suggestions. Keep hashtags concise and non-spammy.",
    ].join("\n");
  }

  if (tool.slug === "freelancer-proposal-generator") {
    const proposalAction = inputs.proposalAction || "Generate a fresh premium proposal";
    return [
      "Create a client-winning freelance proposal using these inputs.",
      "",
      `Client job post / project description: ${inputs.jobPost || ""}`,
      `Freelancer skill: ${inputs.freelancerSkill || ""}`,
      `Experience level: ${inputs.experienceLevel || ""}`,
      `Portfolio link: ${inputs.portfolioLink || ""}`,
      `Budget range: ${inputs.budgetRange || ""}`,
      `Delivery time: ${inputs.deliveryTime || ""}`,
      `Tone: ${inputs.tone || "Professional"}`,
      `Requested action: ${proposalAction}`,
      `Variation seed: ${Date.now()}-${Math.random().toString(36).slice(2)}`,
      "",
      "Action guidance:",
      "- Regenerate: create a new proposal angle while preserving the same facts.",
      "- Shorten proposal: make the short and detailed proposals tighter and more concise.",
      "- Make it more premium: use more strategic, polished, high-value positioning without adding fake claims.",
      "- Make it more friendly: make the tone warmer and more conversational without losing professionalism.",
      "",
      "Return valid JSON with exactly this shape:",
      "",
      "{\"shortProposal\":\"string\",\"detailedProposal\":\"string\",\"personalizedOpeningLine\":\"string\",\"clientPainPointAnalysis\":\"string\",\"solutionApproach\":\"string\",\"relevantExperienceParagraph\":\"string\",\"timeline\":\"string\",\"pricingSuggestion\":\"string\",\"callToAction\":\"string\",\"followUpMessage\":\"string\"}",
      "",
      "Output requirements:",
      "- Short proposal: 80-140 words.",
      "- Detailed proposal: 180-320 words unless the requested action is Shorten proposal.",
      "- Personalized opening line: one natural sentence about the client's restaurant website project.",
      "- Client pain-point analysis: explain the practical project needs and risks.",
      "- Solution approach: concrete steps using the provided skills.",
      "- Relevant experience paragraph: use the stated experience level honestly; do not invent past clients.",
      "- Timeline: match the provided delivery time and include a simple milestone breakdown.",
      "- Pricing suggestion: align with the provided budget range and explain scope assumptions.",
      "- Call-to-action: confident next step.",
      "- Follow-up message: short polite nudge for later.",
    ].join("\n");
  }

  if (tool.slug === "ai-startup-idea-generator") {
    return [
      "Generate a premium, detailed startup business plan, MVP specifications, and validation package using these inputs:",
      "",
      `Industry / Niche: ${inputs.industry || ""}`,
      `Idea Mode: ${inputs.ideaMode || "SaaS Startup"}`,
      `Budget Level: ${inputs.budget || "Low"}`,
      `Target Country: ${inputs.country || "Global"}`,
      `Founder Experience: ${inputs.experience || "Beginner"}`,
      "",
      "Structure your response exactly as follows, wrapping the three core sections in the designated tag boundaries:",
      "",
      "[START_IDEA]",
      "# Startup Idea Generation",
      "",
      "## Startup Name",
      "Generate a creative and brandable startup name.",
      "",
      "## One-line Pitch",
      "Write a catchy, compelling one-line elevator pitch.",
      "",
      "## Problem",
      "Explain the core pain point being solved by this idea.",
      "",
      "## Solution",
      "Describe the product/service solution in detail.",
      "",
      "## Target Audience",
      "Detail the specific target customer profile.",
      "",
      "## Revenue Model",
      "Explain how the business will make money (e.g. subscription, transaction fees, licensing).",
      "",
      "## Estimated Difficulty",
      "Specify the difficulty level (Easy / Medium / Hard) and a brief reason based on budget and experience.",
      "[END_IDEA]",
      "",
      "[START_BUS]",
      "# Business Plan & Validation",
      "",
      "## Idea Quality Scores",
      "- Innovation Score: [Score]/100 (Brief rationale)",
      "- Market Potential: [Score]/100 (Brief rationale)",
      "- Scalability Score: [Score]/100 (Brief rationale)",
      "- Competition Score: [Score]/100 (Brief rationale)",
      "- Monetization Score: [Score]/100 (Brief rationale)",
      "",
      "## Business Validation & Risks",
      "- Why this idea may work: [Rationale based on target country, budget, and industry]",
      "- Main risks: [List 3 main operational/market risks]",
      "- Unique advantage: [Moat or key differentiator]",
      "",
      "## Competitor Analysis",
      "- Main competitors: [List 3 actual or potential competitor companies or alternatives]",
      "",
      "## Revenue Projections",
      "- Month 1 estimate: $[Amount]",
      "- Month 6 estimate: $[Amount]",
      "- Year 1 estimate: $[Amount]",
      "- Year 3 estimate: $[Amount]",
      "",
      "## Funding Recommendation",
      "Provide a specific funding route recommendation (Bootstrap, Angel Funding, Venture Capital, or Crowdfunding) tailored to this idea, explaining why.",
      "[END_BUS]",
      "",
      "[START_MVP]",
      "# MVP Plan & Launch Strategy",
      "",
      "## MVP Generator",
      "- Core features: [List 3-4 essential features required for the launch version]",
      "- Nice-to-have features: [List 3-4 backlog features to add later]",
      "",
      "## Launch & Marketing Strategy",
      "- Launch plan: [Rollout timeline and key steps]",
      "- First 100 customers strategy: [Tactical plan to acquire the first 100 users]",
      "",
      "## Startup Name Options",
      "Provide 10 alternative startup names with domain-friendly suggestions (.com, .io, .ai, etc.) and a brandability score from 1-10.",
      "[END_MVP]",
    ].join("\n");
  }

  if (tool.slug === "linkedin-post-formatter") {
    return [
      "Format and optimize the raw LinkedIn content using these inputs:",
      "",
      `Raw text / idea: ${inputs.rawText || ""}`,
      `Target audience: ${inputs.targetAudience || ""}`,
      `Post goal: ${inputs.postGoal || ""}`,
      `Tone: ${inputs.tone || "Professional"}`,
      `Industry: ${inputs.industry || "General"}`,
      "",
      "Provide exactly these sections, using markdown headings:",
      "",
      "## Premium Content Quality Scores",
      "- Hook Score: [Score]/100 (Brief assessment of the first-line scroll-stopping strength)",
      "- Readability Score: [Score]/100 (Brief assessment of the layout, line breaks, and visual scannability)",
      "- Engagement Score: [Score]/100 (Brief assessment of potential interactions, comments, and shares)",
      "- Professional Score: [Score]/100 (Brief assessment of authority, credibility, and brand safety)",
      "",
      "## Clean LinkedIn Post",
      "Write a polished, standard version of the post optimizing spacing and clarity, suitable for general LinkedIn feeds.",
      "(Approximate Character Count: [Count] characters)",
      "",
      "## Hook-First Version",
      "Write a version starting with a highly compelling, curiosity-inducing first-line hook.",
      "(Approximate Character Count: [Count] characters)",
      "",
      "## Storytelling Version",
      "Write a narrative-driven version using a personal or business anecdote style, incorporating tension and key lessons.",
      "(Approximate Character Count: [Count] characters)",
      "",
      "## Short Version",
      "Write a punchy, ultra-concise version designed for fast scrolling and high readability.",
      "(Approximate Character Count: [Count] characters)",
      "",
      "## Long Version",
      "Write an in-depth, comprehensive post offering maximum value, detailed context, and complete ideas.",
      "(Approximate Character Count: [Count] characters)",
      "",
      "## Bullet-Point Version",
      "Write a clean, structured version featuring structured bullet points for ease of readability.",
      "(Approximate Character Count: [Count] characters)",
      "",
      "## CTA & Optimization Suggestions",
      "Provide 3 distinct Call-to-Action (CTA) lines and 1 engagement question designed to prompt comments, based on the post goal.",
      "",
      "## Hashtag Suggestions",
      "Provide 4-6 highly relevant professional hashtags for LinkedIn search visibility.",
    ].join("\n");
  }

  const serializedInputs = Object.entries(inputs)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return `Create the best possible output for ${tool.name}.\n\nInputs:\n${serializedInputs || "No extra input supplied."}`;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function cleanTweetText(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function enforceTweetLimit(tweet: unknown) {
  const cleaned = cleanTweetText(tweet)
    .replace(/(^|\s)#[a-zA-Z0-9_]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (cleaned.length <= 280) return cleaned;

  const clipped = cleaned.slice(0, 277).replace(/\s+\S*$/, "").trimEnd();
  return `${clipped}...`;
}

function normalizedWords(text: string) {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

function containsAny(text: string, terms: string[]) {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function openingHook(text: string) {
  const firstLine = cleanTweetText(text).split("\n").find(Boolean) || "";
  if (firstLine.length <= 140) return firstLine;

  const firstSentence = firstLine.match(/^.{12,140}?[.!?:](?:\s|$)/)?.[0]?.trim();
  return firstSentence || firstLine.slice(0, 140).trim();
}

function scoreHook(text: string) {
  const firstLine = openingHook(text);
  const words = normalizedWords(firstLine);
  let score = 30;

  if (firstLine.length >= 18 && firstLine.length <= 120) score += 16;
  if (firstLine.length > 0 && firstLine.length <= 70) score += 6;
  if (/^(stop|start|why|how|what|the|this|most|here|if|ai|you)\b/i.test(firstLine)) score += 10;
  if (/[?!:]/.test(firstLine)) score += 8;
  if (
    containsAny(firstLine, [
      "why",
      "how",
      "what",
      "secret",
      "truth",
      "mistake",
      "changed",
      "nobody",
      "everyone",
      "simple",
      "better",
    ])
  ) {
    score += 14;
  }
  if (
    containsAny(firstLine, [
      "build",
      "grow",
      "faster",
      "free",
      "creator",
      "business",
      "changing",
      "powerful",
      "hard",
      "easy",
    ])
  ) {
    score += 12;
  }
  if (words.length >= 5 && words.length <= 18) score += 8;
  if (words.some((word) => word.length > 16)) score -= 8;
  if (firstLine.length > 150) score -= 14;

  return clampScore(score);
}

function scoreEngagement(text: string, hashtags: string[]) {
  const cleaned = cleanTweetText(text);
  const words = normalizedWords(cleaned);
  let score = 28;

  if (cleaned.length >= 80 && cleaned.length <= 260) score += 13;
  if (cleaned.length <= 220) score += 7;
  if (/[?]/.test(cleaned)) score += 9;
  if (
    containsAny(cleaned, [
      "reply",
      "share",
      "follow",
      "try",
      "watch",
      "build",
      "learn",
      "save",
      "steal",
      "use",
      "start",
    ])
  ) {
    score += 13;
  }
  if (
    containsAny(cleaned, [
      "free",
      "tools",
      "creator",
      "business",
      "online",
      "content",
      "videos",
      "scripts",
      "growth",
      "ai",
    ])
  ) {
    score += 12;
  }
  if (hashtags.length >= 2 && hashtags.length <= 5) score += 7;
  if (words.length >= 12 && words.length <= 45) score += 8;
  if (cleaned.split(/[.!?]\s+/).filter(Boolean).length <= 3) score += 5;
  if (cleaned.length > 280) score -= 18;

  return clampScore(score);
}

function parseTweetJson(rawOutput: string) {
  const fencedMatch = rawOutput.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] || rawOutput;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end <= start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractThreadLines(rawOutput: string) {
  return rawOutput
    .split(/\n+/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((line) => line.length > 20 && !line.startsWith("{") && !line.endsWith("}"))
    .slice(0, 8)
    .map(enforceTweetLimit);
}

function cleanHashtag(value: unknown) {
  if (typeof value !== "string") return "";
  const tag = value.trim().replace(/^#+/, "").replace(/[^a-zA-Z0-9_]/g, "");
  return tag ? `#${tag}` : "";
}

function fallbackHashtags(inputs: AiRouterRequest["inputs"]) {
  const source = `${inputs.originalTweet || ""} ${inputs.targetAudience || ""} ${inputs.goal || ""}`.toLowerCase();
  const tags = new Set<string>();

  if (source.includes("ai")) tags.add("#AI");
  if (source.includes("creator") || source.includes("content")) tags.add("#CreatorTools");
  if (source.includes("business") || source.includes("startup")) tags.add("#BusinessGrowth");
  if (source.includes("video")) tags.add("#VideoEditing");
  if (source.includes("script")) tags.add("#ContentCreation");
  tags.add("#ToolVerseAI");

  return Array.from(tags).slice(0, 5);
}

function buildFallbackThread(inputs: AiRouterRequest["inputs"], firstTweet: string) {
  const original = enforceTweetLimit(inputs.originalTweet || firstTweet);
  const audience = inputs.targetAudience?.trim();
  const goal = inputs.goal?.trim();

  return [
    firstTweet || "AI is changing how creators and businesses turn ideas into finished work.",
    original,
    audience
      ? `For ${audience}, the advantage is speed: faster drafts, sharper edits, and more chances to publish consistently.`
      : "The advantage is speed: faster drafts, sharper edits, and more chances to publish consistently.",
    "That is why ToolVerse AI is being built as one place for practical AI tools creators and businesses can use for free.",
    goal ? `The goal: ${goal}.` : "Less tool-hopping. More creating. Better output.",
  ].map(enforceTweetLimit);
}

function normalizeTweetRewrite(rawOutput: string, inputs: AiRouterRequest["inputs"]): TweetRewriteResult {
  const mode = inputs.mode || "Viral Mode";
  const parsed = parseTweetJson(rawOutput);
  const isThreadMode = mode === "Thread Mode";
  const parsedThread = Array.isArray(parsed?.thread) ? parsed.thread.map(enforceTweetLimit).filter(Boolean) : [];
  let thread = isThreadMode ? parsedThread : [];
  let rewrittenTweet = enforceTweetLimit((parsed?.rewrittenTweet as string) || rawOutput || inputs.originalTweet || "");

  if (isThreadMode) {
    if (thread.length < 5) {
      const extracted = extractThreadLines(rawOutput);
      thread = extracted.length >= 5 ? extracted : thread;
    }

    if (thread.length < 5) {
      const fallback = buildFallbackThread(inputs, rewrittenTweet);
      thread = [...thread, ...fallback].filter(Boolean).slice(0, 8);
    }

    thread = thread.slice(0, 8).map(enforceTweetLimit);
    rewrittenTweet = thread[0] || rewrittenTweet;
  }

  const parsedHashtags = Array.isArray(parsed?.hashtags)
    ? parsed.hashtags.map(cleanHashtag).filter(Boolean)
    : [];
  const hashtags = (parsedHashtags.length ? parsedHashtags : fallbackHashtags(inputs)).slice(0, 5);
  const scoreText = isThreadMode && thread.length ? thread[0] : rewrittenTweet;
  const engagementText = isThreadMode && thread.length ? thread.join("\n\n") : rewrittenTweet;

  return {
    mode,
    rewrittenTweet,
    thread,
    hookScore: scoreHook(scoreText),
    engagementScore: scoreEngagement(engagementText, hashtags),
    characterCount: rewrittenTweet.length,
    characterCounts: (isThreadMode ? thread : [rewrittenTweet]).map((tweet) => tweet.length),
    hashtags,
  };
}

function formatTweetRewriteOutput(result: TweetRewriteResult) {
  const tweetOutput = result.thread.length
    ? result.thread.map((tweet, index) => `${index + 1}. ${tweet}`).join("\n\n")
    : result.rewrittenTweet;
  const characterOutput = result.thread.length
    ? result.characterCounts.map((count, index) => `Tweet ${index + 1}: ${count}/280`).join("\n")
    : `${result.characterCount}/280`;

  return [
    "## Rewritten tweet",
    tweetOutput,
    "",
    "## Hook Score /100",
    String(result.hookScore),
    "",
    "## Engagement Score /100",
    String(result.engagementScore),
    "",
    "## Character count",
    characterOutput,
    "",
    "## Hashtag suggestions",
    result.hashtags.join(" "),
  ].join("\n");
}

function cleanProposalSection(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function proposalWordCount(value: string) {
  return normalizedWords(value).length;
}

function jobKeywords(jobPost: string) {
  const stopWords = new Set([
    "with",
    "need",
    "want",
    "this",
    "that",
    "have",
    "from",
    "your",
    "will",
    "and",
    "for",
    "the",
    "project",
    "website",
  ]);

  return Array.from(new Set(normalizedWords(jobPost).filter((word) => word.length > 3 && !stopWords.has(word))))
    .slice(0, 10);
}

function keywordMatches(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.filter((keyword) => normalized.includes(keyword)).length;
}

function scoreFreelancerProposal(
  proposal: Omit<FreelancerProposalResult, "tone" | "scores">,
  inputs: AiRouterRequest["inputs"],
) {
  const combined = [
    proposal.shortProposal,
    proposal.detailedProposal,
    proposal.personalizedOpeningLine,
    proposal.clientPainPointAnalysis,
    proposal.solutionApproach,
    proposal.relevantExperienceParagraph,
    proposal.timeline,
    proposal.pricingSuggestion,
    proposal.callToAction,
    proposal.followUpMessage,
  ].join("\n\n");
  const lower = combined.toLowerCase();
  const keywords = jobKeywords(inputs.jobPost || "");
  const skillTerms = jobKeywords(inputs.freelancerSkill || "");
  const projectMatches = keywordMatches(lower, keywords);
  const skillMatches = keywordMatches(lower, skillTerms);
  const genericPenalty = containsAny(lower, [
    "dear sir/madam",
    "to whom it may concern",
    "i hope this message finds you well",
    "i am writing to express my interest",
  ])
    ? 18
    : 0;

  const personalization = clampScore(
    42 +
      Math.min(projectMatches * 8, 32) +
      (inputs.deliveryTime && lower.includes(inputs.deliveryTime.toLowerCase()) ? 8 : 0) +
      (inputs.budgetRange && lower.includes(inputs.budgetRange.toLowerCase()) ? 6 : 0) -
      genericPenalty,
  );
  const detailedWords = proposalWordCount(proposal.detailedProposal);
  const clarity = clampScore(
    48 +
      (detailedWords >= 120 && detailedWords <= 340 ? 18 : 0) +
      (proposal.solutionApproach.length > 80 ? 12 : 0) +
      (proposal.timeline.length > 40 ? 10 : 0) +
      (containsAny(lower, ["first", "then", "final", "milestone", "delivery"]) ? 8 : 0),
  );
  const trust = clampScore(
    44 +
      Math.min(skillMatches * 8, 28) +
      (inputs.portfolioLink && lower.includes(inputs.portfolioLink.toLowerCase()) ? 10 : 0) +
      (inputs.experienceLevel && lower.includes(inputs.experienceLevel.toLowerCase().split(" ")[0]) ? 8 : 0) +
      (containsAny(lower, ["admin dashboard", "responsive", "reservation", "ordering"]) ? 8 : 0) -
      genericPenalty,
  );
  const conversion = clampScore(
    46 +
      (proposal.callToAction.length > 35 ? 14 : 0) +
      (proposal.pricingSuggestion.length > 45 ? 12 : 0) +
      (proposal.followUpMessage.length > 25 ? 8 : 0) +
      (containsAny(lower, ["quick call", "start", "discuss", "send", "next step", "ready"]) ? 12 : 0),
  );

  return {
    personalization,
    clarity,
    trust,
    conversion,
  };
}

function firstSentence(value: string) {
  return value.match(/^.{20,220}?[.!?](?:\s|$)/)?.[0]?.trim() || value.slice(0, 220).trim();
}

function extractJsonStringField(rawOutput: string, key: string) {
  const match = rawOutput.match(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
  if (!match?.[1]) return "";

  try {
    return JSON.parse(`"${match[1]}"`) as string;
  } catch {
    return match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n").trim();
  }
}

function proposalProjectSummary(jobPost: string) {
  const normalized = jobPost.toLowerCase();
  if (normalized.includes("restaurant")) {
    return "Your restaurant website needs online ordering, reservations, mobile responsiveness, and an admin dashboard working together smoothly.";
  }

  return "Your project needs a clear build plan, polished execution, and reliable delivery without generic template work.";
}

function generatedProposalFallback(inputs: AiRouterRequest["inputs"]) {
  const project = proposalProjectSummary(inputs.jobPost || "");
  const skills = inputs.freelancerSkill || "the skills you listed";
  const delivery = inputs.deliveryTime || "the delivery time you provided";
  const budget = inputs.budgetRange || "the budget range you provided";

  return {
    shortProposal: `${project} I can help build this with ${skills}, keeping the scope practical, responsive, and ready for real users within ${delivery}.`,
    detailedProposal: `${project}\n\nI can help turn the brief into a clean, modern build using ${skills}. I would focus first on the customer flow, then the ordering and reservation experience, then the admin dashboard so the restaurant team can manage the essentials confidently. Based on the ${budget} range and ${delivery} timeline, I would keep the scope focused, communicate clearly, and avoid adding anything that is not needed for launch.`,
  };
}

function proposalField(parsed: Record<string, unknown> | null, rawOutput: string, key: string) {
  return cleanProposalSection(parsed?.[key]) || cleanProposalSection(extractJsonStringField(rawOutput, key));
}

function normalizeFreelancerProposal(
  rawOutput: string,
  inputs: AiRouterRequest["inputs"],
): FreelancerProposalResult {
  const parsed = parseTweetJson(rawOutput);
  const fallback = generatedProposalFallback(inputs);
  const detailedFallback = fallback.detailedProposal;
  const shortFallback = fallback.shortProposal;

  const base = {
    shortProposal: proposalField(parsed, rawOutput, "shortProposal") || shortFallback,
    detailedProposal: proposalField(parsed, rawOutput, "detailedProposal") || detailedFallback,
    personalizedOpeningLine:
      proposalField(parsed, rawOutput, "personalizedOpeningLine") ||
      proposalProjectSummary(inputs.jobPost || ""),
    clientPainPointAnalysis:
      proposalField(parsed, rawOutput, "clientPainPointAnalysis") ||
      "The main challenge is combining the visible customer experience with reliable ordering, reservation, mobile responsiveness, and admin workflows.",
    solutionApproach:
      proposalField(parsed, rawOutput, "solutionApproach") ||
      `I would map the pages and flows first, then build the interface with ${inputs.freelancerSkill || "the provided skills"} and test the key actions before delivery.`,
    relevantExperienceParagraph:
      proposalField(parsed, rawOutput, "relevantExperienceParagraph") ||
      `Based on my ${inputs.experienceLevel || "provided"} experience level, I can focus on a clean implementation and communicate clearly throughout the build.`,
    timeline:
      proposalField(parsed, rawOutput, "timeline") ||
      `Delivery can be planned around ${inputs.deliveryTime || "the provided timeline"} with milestones for structure, UI, integrations, and final testing.`,
    pricingSuggestion:
      proposalField(parsed, rawOutput, "pricingSuggestion") ||
      `For the scope described, ${inputs.budgetRange || "the provided budget range"} is a sensible starting point depending on final feature depth.`,
    callToAction:
      proposalField(parsed, rawOutput, "callToAction") ||
      "If this sounds aligned, send me the restaurant branding and preferred ordering flow and I can outline the first build steps.",
    followUpMessage:
      proposalField(parsed, rawOutput, "followUpMessage") ||
      "Just checking in to see if you would like me to map the restaurant website flow and timeline for you.",
  };

  return {
    tone: inputs.tone || "Professional",
    ...base,
    scores: scoreFreelancerProposal(base, inputs),
  };
}

function formatFreelancerProposalOutput(result: FreelancerProposalResult) {
  return [
    "## Short proposal",
    result.shortProposal,
    "",
    "## Detailed proposal",
    result.detailedProposal,
    "",
    "## Personalized opening line",
    result.personalizedOpeningLine,
    "",
    "## Client pain-point analysis",
    result.clientPainPointAnalysis,
    "",
    "## Solution approach",
    result.solutionApproach,
    "",
    "## Relevant experience paragraph",
    result.relevantExperienceParagraph,
    "",
    "## Timeline",
    result.timeline,
    "",
    "## Pricing suggestion",
    result.pricingSuggestion,
    "",
    "## Call-to-action",
    result.callToAction,
    "",
    "## Follow-up message",
    result.followUpMessage,
    "",
    "## Proposal Score",
    `Personalization Score /100: ${result.scores.personalization}`,
    `Clarity Score /100: ${result.scores.clarity}`,
    `Trust Score /100: ${result.scores.trust}`,
    `Conversion Score /100: ${result.scores.conversion}`,
  ].join("\n");
}

function isGroqBestFit(name: string) {
  return ["title", "hook", "rewrite", "ad copy", "roast", "ctr"].some((keyword) =>
    name.includes(keyword),
  );
}

function isGeminiBestFit(name: string, category: string) {
  return (
    category === "ai-writing" ||
    name.includes("seo") ||
    name.includes("summary") ||
    name.includes("summarizer") ||
    name.includes("pdf") ||
    name.includes("proposal") ||
    name.includes("description")
  );
}

function isHuggingFaceBestFit(name: string) {
  return ["ocr", "speech", "voice", "transcript", "background remover"].some((keyword) =>
    name.includes(keyword),
  );
}

function uniqProviders(providers: AiProviderId[]) {
  return providers.filter((provider, index, array) => array.indexOf(provider) === index);
}

export function providersForTool({ tool }: AiRouterRequest): AiProviderId[] {
  const name = `${tool.name} ${tool.slug}`.toLowerCase();

  if (
    tool.slug === "ai-product-description-generator" ||
    tool.slug === "ai-bio-generator" ||
    tool.slug === "ai-tweet-rewriter" ||
    tool.slug === "freelancer-proposal-generator" ||
    tool.slug === "ai-startup-idea-generator" ||
    tool.slug === "linkedin-post-formatter"
  ) {
    return ["gemini", "groq"];
  }

  const preferred: AiProviderId[] = [];

  if (isHuggingFaceBestFit(name)) preferred.push("huggingface");
  if (isGroqBestFit(name)) preferred.push("groq");
  if (isGeminiBestFit(name, tool.category)) preferred.push("gemini");

  if (tool.provider === "gemini" || tool.provider === "groq" || tool.provider === "openrouter") {
    preferred.push(tool.provider);
  }

  preferred.push("gemini", "groq", "openrouter");
  return uniqProviders(preferred).filter((provider) => provider !== "huggingface" || isHuggingFaceBestFit(name));
}

async function runProvider(provider: AiProviderId, systemPrompt: string, userPrompt: string) {
  if (provider === "gemini") return generateGeminiText(systemPrompt, userPrompt);
  if (provider === "groq") return generateGroqText(systemPrompt, userPrompt);
  if (provider === "openrouter") return generateOpenRouterText(systemPrompt, userPrompt);

  throw new Error("Hugging Face is connected for OCR and speech file processing, not generic text generation.");
}

export async function runAiRouter(request: AiRouterRequest): Promise<AiRouterResult> {
  if (
    request.tool.slug !== "ai-product-description-generator" &&
    request.tool.slug !== "ai-bio-generator" &&
    request.tool.slug !== "ai-tweet-rewriter" &&
    request.tool.slug !== "freelancer-proposal-generator" &&
    request.tool.slug !== "ai-startup-idea-generator" &&
    request.tool.slug !== "linkedin-post-formatter"
  ) {
    validateRequiredAiEnv();
  }

  const systemPrompt = buildSystemPrompt(request);
  const userPrompt = buildUserPrompt(request);
  const attempts: string[] = [];

  for (const provider of providersForTool(request)) {
    try {
      const output = await runProvider(provider, systemPrompt, userPrompt);
      if (request.tool.slug === "ai-tweet-rewriter") {
        const tweetRewrite = normalizeTweetRewrite(output, request.inputs);
        return { provider, output: formatTweetRewriteOutput(tweetRewrite), tweetRewrite };
      }
      if (request.tool.slug === "freelancer-proposal-generator") {
        const freelancerProposal = normalizeFreelancerProposal(output, request.inputs);
        return {
          provider,
          output: formatFreelancerProposalOutput(freelancerProposal),
          freelancerProposal,
        };
      }
      return { provider, output };
    } catch (error) {
      const message = error instanceof Error ? error.message : `${provider} failed.`;
      attempts.push(`${provider}: ${message}`);
      console.error(`[ToolVerse] ${provider} provider failed`, error);
    }
  }

  throw new Error(`All AI providers failed. ${attempts.join(" | ")}`);
}

function missingStatus(entry: ReturnType<typeof getAiEnvReport>[number]): ProviderStatus {
  const testedAt = new Date().toISOString();
  const id = entry.provider || "gemini";
  return {
    id,
    name: entry.label,
    purpose:
      id === "groq"
        ? "Hooks, titles, rewrites, and fast creator copy"
        : id === "openrouter"
          ? "Fallback model routing"
          : id === "huggingface"
            ? "OCR, speech, and background-removal models"
            : "Writing, SEO, summaries, and PDF reasoning",
    configured: false,
    ok: false,
    message: `Missing ${entry.key} in .env.local.`,
    testedAt,
  };
}

export async function testAiConnections() {
  const envReport = getAiEnvReport();
  const missingByProvider = new Map(
    envReport
      .filter((entry) => entry.provider && !entry.configured)
      .map((entry) => [entry.provider, missingStatus(entry)]),
  );

  const tests: Array<[AiProviderId, () => Promise<ProviderStatus>]> = [
    ["gemini", testGeminiConnection],
    ["groq", testGroqConnection],
    ["openrouter", testOpenRouterConnection],
    ["huggingface", testHuggingFaceConnection],
  ];

  return Promise.all(
    tests.map(async ([provider, test]) => missingByProvider.get(provider) || test()),
  );
}

export function validateAiEnvironment() {
  validateRequiredAiEnv();
}
