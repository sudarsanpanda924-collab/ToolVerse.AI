import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeaderAdPlaceholder, InContentAdPlaceholder } from "@/components/AdPlaceholders";
import { Category3DCard } from "@/components/Category3DCard";
import { Hero3D } from "@/components/Hero3D";
import { ToolCard3D } from "@/components/ToolCard3D";
import { ToolSearch } from "@/components/ToolSearch";
import { categoryToolCounts, featuredTools, toolCount, tools } from "@/config/tools";

export default function HomePage() {
  return (
    <>
      <Hero3D />
      <div className="px-4 pb-4 sm:px-6 lg:px-8">
        <HeaderAdPlaceholder />
      </div>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
                Search the universe
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Find any tool in seconds
              </h2>
            </div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 hover:text-white"
            >
              Explore all 200+ tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ToolSearch tools={tools} categories={categoryToolCounts} limit={9} />
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
              Visual categories
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Every category has its own 3D identity
            </h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Each card uses a distinct visual metaphor so visitors can understand
              the job of the tool before they read the details.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categoryToolCounts.map((category) => (
              <Category3DCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <InContentAdPlaceholder />
          <div className="mb-8 mt-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
                Popular launch tools
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Start with the highest-demand workflows
              </h2>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredTools.map((tool) => (
              <ToolCard3D key={tool.slug} tool={tool} compact />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
