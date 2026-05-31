import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { blogArticles, getBlogArticle } from "@/config/blog";
import { absoluteUrl } from "@/lib/utils";

type BlogArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: absoluteUrl(`/blog/${article.slug}`),
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  if (!article) notFound();

  return (
    <article className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-cyan-100 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>
        <header className="glass-panel mt-6 rounded-xl p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
            {article.category} / {article.readTime}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">{article.description}</p>
        </header>
        <div className="mt-6 space-y-4">
          {article.sections.map((section) => (
            <section key={section.heading} className="glass-card rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white">{section.heading}</h2>
              <p className="mt-4 text-base leading-8 text-slate-300">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
