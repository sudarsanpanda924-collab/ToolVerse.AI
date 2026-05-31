import Link from "next/link";
import { Sparkles } from "lucide-react";
import { categories, toolCount } from "@/config/tools";

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-500">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="font-semibold text-white">ToolVerse AI</p>
              <p className="text-sm text-slate-400">200+ free AI and utility tools</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
            A premium, mobile-ready free tools platform for creators, students, freelancers,
            and businesses. Built with server-side provider routing and clean SEO foundations.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-white">Explore</p>
            <div className="mt-3 space-y-2">
              <Link className="block text-sm text-slate-400 hover:text-cyan-200" href="/tools">
                All tools
              </Link>
              <Link className="block text-sm text-slate-400 hover:text-cyan-200" href="/pricing">
                Pricing
              </Link>
              <Link className="block text-sm text-slate-400 hover:text-cyan-200" href="/blog">
                Blog
              </Link>
              <Link className="block text-sm text-slate-400 hover:text-cyan-200" href="/api-status">
                API status
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Categories</p>
            <div className="mt-3 space-y-2">
              {categories.slice(0, 6).map((category) => (
                <Link
                  className="block text-sm text-slate-400 hover:text-cyan-200"
                  href={`/tools?category=${category.id}`}
                  key={category.id}
                >
                  {category.shortName}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Trust</p>
            <div className="mt-3 space-y-2">
              {legalLinks.map((link) => (
                <Link
                  className="block text-sm text-slate-400 hover:text-cyan-200"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ToolVerse AI. Original tools, clear navigation, and no real ads in v1.
      </div>
    </footer>
  );
}
