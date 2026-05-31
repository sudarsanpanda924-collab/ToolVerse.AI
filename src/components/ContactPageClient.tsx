"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Bug,
  CheckCircle2,
  Handshake,
  Lightbulb,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const SUPPORT_EMAIL = "toolverseai18@gmail.com";

const inquiryTypes = [
  "General Support",
  "Bug Report",
  "Feature Request",
  "Partnership Inquiry",
  "Business Inquiry",
  "API Issue",
] as const;

type InquiryType = (typeof inquiryTypes)[number];

type FormState = {
  name: string;
  email: string;
  inquiryType: InquiryType;
  subject: string;
  message: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

type ProviderStatus = {
  name: string;
  configured?: boolean;
  ok?: boolean;
};

const stats = [
  "204+ Free Tools",
  "AI Powered Platform",
  "Fast Support",
  "Growing Community",
];

const contactCards = [
  {
    title: "Support",
    body: SUPPORT_EMAIL,
    detail: "Response within 24 hours",
    icon: Mail,
  },
  {
    title: "Bug Reports",
    body: "Report issues and broken tools",
    detail: "Help us keep every tool sharp",
    icon: Bug,
  },
  {
    title: "Feature Requests",
    body: "Suggest new tools and improvements",
    detail: "Shape the next ToolVerse release",
    icon: Lightbulb,
  },
  {
    title: "Partnerships",
    body: "Business and collaboration inquiries",
    detail: "Build with the ToolVerse AI team",
    icon: Handshake,
  },
];

const faqs = [
  {
    question: "Is ToolVerse AI free?",
    answer:
      "Yes. ToolVerse AI offers a large library of free tools for creators, students, freelancers, and businesses.",
  },
  {
    question: "How many daily uses are available?",
    answer:
      "Non-AI tools are unlimited. AI tools use a fair daily free quota so the platform stays fast and available.",
  },
  {
    question: "How can I request a new tool?",
    answer:
      "Choose Feature Request in the form and describe the workflow, input, output, and who the tool should help.",
  },
  {
    question: "How do I report bugs?",
    answer:
      "Choose Bug Report and include the tool name, what you uploaded or entered, and what happened instead.",
  },
  {
    question: "Which AI models power ToolVerse AI?",
    answer:
      "ToolVerse AI routes work across providers such as Gemini, Groq, OpenRouter, Hugging Face, and Pollinations depending on the task.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No account is needed for the current free tools experience. Usage limits are handled privately without exposing provider keys.",
  },
];

const trustCards = [
  {
    title: "Privacy Focused",
    body: "Support messages are used to solve your request and improve ToolVerse AI.",
    icon: ShieldCheck,
  },
  {
    title: "Secure Processing",
    body: "Provider keys and Firebase access stay on the server side.",
    icon: Lock,
  },
  {
    title: "Fast Performance",
    body: "The contact flow is lightweight, responsive, and built for quick support handoffs.",
    icon: Zap,
  },
  {
    title: "Community Driven",
    body: "Bug reports and tool ideas directly influence the product roadmap.",
    icon: Users,
  },
];

const statusProviders = ["Gemini", "Groq", "OpenRouter", "Hugging Face", "Pollinations", "Firebase"];

const socialLinks = [
  { label: "YouTube", href: "https://www.youtube.com/" },
  { label: "X (Twitter)", href: "https://x.com/" },
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "GitHub", href: "https://github.com/" },
];

const initialForm: FormState = {
  name: "",
  email: "",
  inquiryType: "General Support",
  subject: "",
  message: "",
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function providerIsLive(provider: ProviderStatus | undefined) {
  if (!provider) return null;
  if (typeof provider.ok === "boolean") return provider.ok;
  return Boolean(provider.configured);
}

function validateForm(form: FormState) {
  if (form.name.trim().length < 2) return "Full Name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
  if (form.subject.trim().length < 3) return "Subject is required.";
  if (form.message.trim().length < 10) return "Message must be at least 10 characters.";
  return "";
}

export function ContactPageClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);

  useEffect(() => {
    let mounted = true;

    fetch("/api/status")
      .then((response) => response.json())
      .then((data) => {
        if (mounted && Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      })
      .catch(() => {
        if (mounted) setProviders([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const providerMap = useMemo(() => {
    const map = new Map<string, ProviderStatus>();
    providers.forEach((provider) => {
      map.set(provider.name, provider);
      if (provider.name === "Firebase Firestore") map.set("Firebase", provider);
    });
    return map;
  }, [providers]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setToast({ type: "error", message: validationError });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          inquiryType: form.inquiryType,
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit right now. Please email toolverseai18@gmail.com");
      }

      setForm(initialForm);
      setToast({
        type: "success",
        message: data.message || "Message sent successfully. We'll get back to you soon.",
      });
    } catch {
      setToast({
        type: "error",
        message: "Unable to submit right now. Please email toolverseai18@gmail.com",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute left-1/2 top-8 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl"
          animate={{ scale: [1, 1.18, 1], opacity: [0.38, 0.65, 0.38] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 top-64 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl"
          animate={{ x: [0, -28, 0], y: [0, 18, 0], opacity: [0.35, 0.58, 0.35] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        {Array.from({ length: 18 }, (_, index) => (
          <motion.span
            key={index}
            className="absolute h-1.5 w-1.5 rounded-full bg-cyan-200/50 shadow-[0_0_18px_rgba(103,232,249,0.65)]"
            style={{
              left: `${8 + ((index * 19) % 86)}%`,
              top: `${6 + ((index * 31) % 82)}%`,
            }}
            animate={{ y: [-8, 12, -8], opacity: [0.18, 0.7, 0.18] }}
            transition={{ duration: 4 + (index % 5), repeat: Infinity, delay: index * 0.18 }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-7xl space-y-10">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.55 }}
          className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch"
        >
          <div className="glass-panel relative overflow-hidden rounded-xl p-6 sm:p-8 lg:p-10">
            <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Contact ToolVerse AI
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Let&apos;s Build Better Tools Together
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Need support, found a bug, want a partnership, or have an idea for a new AI tool? We&apos;d love to hear from you.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat}
                  className="rounded-xl border border-white/10 bg-white/[0.07] p-4 shadow-[0_18px_48px_rgba(2,6,23,0.22)]"
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 240, damping: 20, delay: index * 0.02 }}
                >
                  <p className="text-sm font-semibold text-white">{stat}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.form
            onSubmit={submit}
            className="glass-card relative overflow-hidden rounded-xl p-5 sm:p-7"
            initial={{ opacity: 0, y: 28, rotateX: 7 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                  Smart Contact Form
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Send us a message</h2>
              </div>
              <div className="rounded-xl border border-cyan-200/20 bg-cyan-200/10 p-3 text-cyan-100">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Full Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/70 focus:ring-2 focus:ring-cyan-300/10"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Email Address</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/70 focus:ring-2 focus:ring-cyan-300/10"
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Inquiry Type</span>
              <select
                value={form.inquiryType}
                onChange={(event) => updateField("inquiryType", event.target.value as InquiryType)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-200/70 focus:ring-2 focus:ring-cyan-300/10"
              >
                {inquiryTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Subject</span>
              <input
                required
                value={form.subject}
                onChange={(event) => updateField("subject", event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/70 focus:ring-2 focus:ring-cyan-300/10"
                placeholder="What should we help with?"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Message</span>
              <textarea
                required
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                className="min-h-36 w-full resize-y rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/70 focus:ring-2 focus:ring-cyan-300/10"
                placeholder="Share details, links, tool names, errors, or collaboration ideas..."
              />
            </label>

            <motion.button
              type="submit"
              disabled={loading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_34px_rgba(103,232,249,0.18)] transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Message
            </motion.button>
          </motion.form>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {contactCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                className="glass-card group rounded-xl p-5 transition hover:border-cyan-200/50"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                whileHover={{ y: -6 }}
              >
                <div className="mb-5 inline-flex rounded-xl border border-cyan-200/20 bg-cyan-200/10 p-3 text-cyan-100 transition group-hover:shadow-[0_0_28px_rgba(34,211,238,0.2)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{card.body}</p>
                <p className="mt-3 text-xs text-slate-500">{card.detail}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <motion.section
            className="glass-card rounded-xl p-6"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl border border-violet-200/20 bg-violet-200/10 p-3 text-violet-100">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">FAQ</p>
                <h2 className="text-2xl font-semibold text-white">Fast answers before you write</h2>
              </div>
            </div>
            <div className="grid gap-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="rounded-xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300 transition hover:border-cyan-200/40"
                >
                  <summary className="cursor-pointer font-semibold text-white outline-none">
                    {faq.question}
                  </summary>
                  <p className="mt-3 leading-6">{faq.answer}</p>
                </details>
              ))}
            </div>
          </motion.section>

          <motion.aside
            className="space-y-6"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1 }}
          >
            <section className="glass-card rounded-xl p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                    API Status
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Live provider health</h2>
                </div>
                <Activity className="h-5 w-5 text-cyan-100" />
              </div>
              <div className="grid gap-3">
                {statusProviders.map((name) => {
                  const provider = providerMap.get(name);
                  const live = providerIsLive(provider);
                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3"
                    >
                      <span className="text-sm font-medium text-slate-100">{name}</span>
                      <span className="inline-flex items-center gap-2 text-xs text-slate-300">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            live === null
                              ? "bg-slate-400"
                              : live
                                ? "bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.65)]"
                                : "bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.55)]"
                          }`}
                        />
                        {live === null ? "Checking" : live ? "Live" : "Attention"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="glass-card rounded-xl p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                Social Links
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-200/50 hover:bg-cyan-200/10"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </section>
          </motion.aside>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                className="glass-card rounded-xl p-5"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Icon className="h-5 w-5 text-cyan-100" />
                <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{card.body}</p>
              </motion.div>
            );
          })}
        </section>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.div
            role="status"
            aria-live="polite"
            className={`fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${
              toast.type === "success"
                ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-50"
                : "border-rose-300/30 bg-rose-400/15 text-rose-50"
            }`}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
