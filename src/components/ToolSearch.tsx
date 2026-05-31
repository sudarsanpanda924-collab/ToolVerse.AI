"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Tool, ToolCategory } from "@/config/tools";
import { ToolCard3D } from "@/components/ToolCard3D";
import { cn } from "@/lib/utils";

type ToolSearchProps = {
  tools: Tool[];
  categories: (ToolCategory & { count?: number })[];
  initialCategory?: string;
  limit?: number;
};

const PDF_SECTIONS = [
  {
    title: "1. ORGANIZE PDF",
    toolNames: ["Merge PDF", "Split PDF", "Remove Pages", "Extract Pages", "Organize PDF", "Scan to PDF"]
  },
  {
    title: "2. OPTIMIZE PDF",
    toolNames: ["Compress PDF", "Repair PDF", "OCR PDF"]
  },
  {
    title: "3. CONVERT TO PDF",
    toolNames: ["JPG to PDF", "Word to PDF", "PowerPoint to PDF", "Excel to PDF", "HTML to PDF"]
  },
  {
    title: "4. CONVERT FROM PDF",
    toolNames: ["PDF to JPG", "PDF to Word", "PDF to PowerPoint", "PDF to Excel", "PDF to PDF/A"]
  },
  {
    title: "5. EDIT PDF",
    toolNames: ["Rotate PDF", "Add Page Numbers", "Add Watermark", "Crop PDF", "Edit PDF", "PDF Forms"]
  },
  {
    title: "6. PDF SECURITY",
    toolNames: ["Unlock PDF", "Protect PDF", "Sign PDF", "Redact PDF", "Compare PDF"]
  },
  {
    title: "7. PDF INTELLIGENCE",
    toolNames: ["AI PDF Summarizer", "Translate PDF"]
  }
];

export function ToolSearch({ tools, categories, initialCategory = "all", limit }: ToolSearchProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const results = tools.filter((tool) => {
      const matchesCategory = category === "all" || tool.category === category;
      const matchesQuery =
        !normalizedQuery ||
        tool.name.toLowerCase().includes(normalizedQuery) ||
        tool.description.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });

    return (typeof limit === "number" && category === "all") ? results.slice(0, limit) : results;
  }, [category, limit, query, tools]);

  const renderTools = () => {
    if (category === "pdf-ocr" && !query.trim()) {
      const groupedNames = new Set(PDF_SECTIONS.flatMap((s) => s.toolNames));
      const extraTools = filteredTools.filter((tool) => !groupedNames.has(tool.name));

      return (
        <div className="space-y-10">
          {PDF_SECTIONS.map((section) => {
            const sectionTools = filteredTools.filter((tool) =>
              section.toolNames.includes(tool.name),
            );
            if (sectionTools.length === 0) return null;
            return (
              <div key={section.title} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-white/5 pb-2">
                  {section.title}
                </h3>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {sectionTools.map((tool) => (
                    <ToolCard3D key={tool.slug} tool={tool} />
                  ))}
                </div>
              </div>
            );
          })}
          {extraTools.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-white/5 pb-2">
                8. ADDITIONAL PDF TOOLS
              </h3>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {extraTools.map((tool) => (
                  <ToolCard3D key={tool.slug} tool={tool} />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredTools.map((tool) => (
          <ToolCard3D key={tool.slug} tool={tool} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools, converters, calculators, YouTube analyzers..."
              className="w-full rounded-lg border border-white/10 bg-white/[0.07] py-3 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/60"
            />
          </label>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-3 text-sm transition",
                category === "all"
                  ? "bg-white text-slate-950"
                  : "border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10",
              )}
            >
              All
            </button>
            {categories.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setCategory(item.id)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-4 py-3 text-sm transition",
                  category === item.id
                    ? "bg-white text-slate-950"
                    : "border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10",
                )}
              >
                {item.shortName}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Showing <span className="font-semibold text-white">{filteredTools.length}</span> tools
        </p>
        <p className="text-xs text-slate-500">AI tools use the daily free quota. Utilities are unlimited.</p>
      </div>

      {renderTools()}

      {!filteredTools.length ? (
        <div className="glass-card rounded-xl p-8 text-center text-slate-300">
          No tools found. Try a shorter search or another category.
        </div>
      ) : null}
    </div>
  );
}
