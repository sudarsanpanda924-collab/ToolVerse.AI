import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { blogArticles } from "@/config/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Helpful ToolVerse AI articles about AI tools, YouTube optimization, PDF tools, image converters, and prompt writing.",
};

export default function BlogPage() {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
            Blog
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Original guides for better tool workflows
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Ten starter articles are included for AdSense readiness, search
            indexing, and helpful visitor education.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {blogArticles.map((article) => (
            <Link
              href={`/blog/${article.slug}`}
              key={article.slug}
              className="glass-card group rounded-xl p-6 transition hover:border-cyan-200/50"
            >
              <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                {article.category}
              </span>
              <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">
                {article.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{article.description}</p>
              <div className="mt-6 flex items-center justify-between text-sm text-cyan-100">
                {article.readTime}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
