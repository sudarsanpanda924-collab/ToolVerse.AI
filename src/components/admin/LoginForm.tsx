"use client";

import { useState, type FormEvent } from "react";
import { Lock, Loader2 } from "lucide-react";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      window.location.href = "/admin";
      return;
    }

    const data = await response.json();
    setError(data.error || "Login failed.");
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="glass-card mx-auto max-w-md rounded-xl p-6">
      <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-cyan-300/15">
        <Lock className="h-6 w-6 text-cyan-100" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-white">Admin login</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Server-side authentication protects dashboard analytics, tools, pricing,
        and API status controls.
      </p>

      <label className="mt-6 block">
        <span className="mb-2 block text-sm font-medium text-slate-200">Username</span>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none focus:border-cyan-200/60"
          autoComplete="username"
          required
        />
      </label>
      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none focus:border-cyan-200/60"
          autoComplete="current-password"
          required
        />
      </label>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Login
      </button>
    </form>
  );
}
