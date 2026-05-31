import type { Metadata } from "next";
import { ToolSearch } from "@/components/ToolSearch";
import { categoryToolCounts, toolCount, tools } from "@/config/tools";

export const metadata: Metadata = {
  title: "All Free Tools",
  description:
    "Browse every ToolVerse AI tool: AI writing, YouTube tools, PDF tools, image converters, business calculators, and utilities.",
};

type ToolsPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const params = await searchParams;

  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
            Tool library
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            200+ free tools in one searchable dashboard
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Filter by category, search by task, and open any dynamic tool page.
            AI tools use the fair daily quota; non-AI utilities are unlimited.
          </p>
        </div>
        <ToolSearch
          tools={tools}
          categories={categoryToolCounts}
          initialCategory={params.category || "all"}
        />
      </div>
    </section>
  );
}
