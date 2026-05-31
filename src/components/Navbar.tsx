import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";
import { categories, toolCount } from "@/config/tools";

const links = [
  { href: "/tools", label: "Tools" },
  { href: "/ai-companion", label: "Nova AI" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/api-status", label: "API Status" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-500 shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight text-white">ToolVerse AI</span>
            <span className="block text-xs text-cyan-100/70">200+ free tools</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm text-slate-200/80 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/tools"
            className="rounded-full border border-cyan-300/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-300/10"
          >
            Explore all
          </Link>
          <Link
            href="/admin"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
          >
            Admin
          </Link>
        </div>

        <details className="relative lg:hidden">
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl border border-white/10 bg-white/10">
            <Menu className="h-5 w-5" />
          </summary>
          <div className="glass-panel absolute right-0 mt-3 w-72 rounded-xl p-3">
            {[...links, { href: "/admin", label: "Admin" }].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm text-slate-100 hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-white/10 pt-3 text-xs text-slate-400">
              {categories.length} categories built for launch readiness.
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}
