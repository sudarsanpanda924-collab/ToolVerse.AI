import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SidebarAdPlaceholder, InContentAdPlaceholder } from "@/components/AdPlaceholders";
import { FAQ } from "@/components/FAQ";
import { ToolCard3D } from "@/components/ToolCard3D";
import { ToolForm } from "@/components/ToolForm";
import { ToolIllustration } from "@/components/ToolIllustration";
import { getRelatedTools, getToolBySlug, toolRouteSlugs } from "@/config/tools";
import { absoluteUrl } from "@/lib/utils";
import { getDailyAiLimit } from "@/lib/usage";

type ToolPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return toolRouteSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    alternates: {
      canonical: absoluteUrl(`/tools/${tool.slug}`),
    },
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDescription,
      url: absoluteUrl(`/tools/${tool.slug}`),
      type: "website",
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const relatedTools = getRelatedTools(tool, 4);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <article className="px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="glass-panel overflow-hidden rounded-xl p-5 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
                  {tool.isAI ? "AI powered" : "Unlimited utility"} / {tool.outputType}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {tool.name}
                </h1>
                <p className="mt-5 text-lg leading-8 text-slate-300">{tool.description}</p>
              </div>
              <ToolIllustration
                icon={tool.icon}
                accent={tool.accent}
                variant={tool.illustration}
                label={`${tool.name} 3D illustration`}
                className="h-72"
              />
            </div>
          </section>

          <ToolForm tool={tool} />

          <InContentAdPlaceholder />

          <section className="grid gap-5 md:grid-cols-2">
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white">How to use {tool.name}</h2>
              <ol className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                {tool.howToUse.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-300/15 text-xs font-semibold text-cyan-100">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white">Benefits</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                {tool.benefits.map((benefit) => (
                  <li key={benefit}>- {benefit}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="glass-card rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white">SEO content for {tool.name}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {tool.name} is designed for visitors who need a fast, focused,
              browser-friendly workflow without installing extra software. Use it
              to prepare drafts, analyze inputs, convert everyday files, or create
              practical outputs for publishing, school, freelancing, and business
              operations. ToolVerse AI keeps private provider keys on the server,
              applies a fair daily AI quota, and pairs every tool with helpful
              guidance so the page is useful for both people and search engines.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">FAQs</h2>
            <FAQ items={tool.faq} />
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">Related tools</h2>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {relatedTools.map((relatedTool) => (
                <ToolCard3D key={relatedTool.slug} tool={relatedTool} compact />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <SidebarAdPlaceholder />
          <div className="glass-card rounded-xl p-5">
            <h2 className="font-semibold text-white">Tool details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Provider</dt>
                <dd className="text-slate-100">{tool.provider}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">AI usage</dt>
                <dd className="text-slate-100">{tool.isAI ? `Counts toward ${getDailyAiLimit()}/day` : "Unlimited"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Output</dt>
                <dd className="text-slate-100">{tool.outputType}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </article>
  );
}
