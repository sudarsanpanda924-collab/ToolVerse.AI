"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  VolumeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type Mood = {
  id: string;
  label: string;
  emoji: string;
  description: string;
};

const MOODS: Mood[] = [
  { id: "friendly", label: "Friendly", emoji: "😊", description: "Warm & casual" },
  { id: "caring", label: "Caring", emoji: "💛", description: "Empathetic & gentle" },
  { id: "study", label: "Study Buddy", emoji: "📚", description: "Learn together" },
  { id: "productivity", label: "Productivity", emoji: "⚡", description: "Get things done" },
  { id: "mentor", label: "Business Mentor", emoji: "🧠", description: "Strategic advice" },
  { id: "motivator", label: "Motivator", emoji: "🔥", description: "Inspire & push" },
];

const GREETING: Record<string, string> = {
  friendly:
    "Hey there! 👋 I'm Nova, your AI companion. What's on your mind today? I'm here to chat about anything!",
  caring:
    "Hi there 💛 I'm Nova, and I'm so glad you're here. How are you feeling today? I'm here to listen and support you.",
  study:
    "Hey study partner! 📚 I'm Nova. Ready to learn something awesome today? Tell me what you're working on!",
  productivity:
    "Let's get it done! ⚡ I'm Nova, your productivity coach. What's the top priority you want to tackle right now?",
  mentor:
    "Welcome! 🧠 I'm Nova, your business mentor. What challenge or idea would you like to explore today?",
  motivator:
    "You showed up — and that's already winning! 🔥 I'm Nova, your motivational companion. What dream are we chasing today?",
};

function createGreetingMessage(mood: string): ChatMessage {
  return {
    id: "greeting",
    role: "assistant",
    content: GREETING[mood] || GREETING.friendly,
    timestamp: Date.now(),
  };
}

export function NovaCompanion() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createGreetingMessage("friendly")]);
  const [input, setInput] = useState("");
  const [mood, setMood] = useState("friendly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatId] = useState(() => `nova-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speak reply
  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const stripped = text.replace(/[#*_`~>\[\]()]/g, "").slice(0, 600);
      const utterance = new SpeechSynthesisUtterance(stripped);
      utterance.rate = 1;
      utterance.pitch = 1.1;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled],
  );

  // Voice input setup
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setError("Voice input is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError("");

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "greeting")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mood,
          chatId,
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nova couldn't respond.");
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speak(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages, mood, chatId, speak]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMoodChange = (nextMood: string) => {
    if (nextMood === mood) return;
    setMood(nextMood);
    setMessages([createGreetingMessage(nextMood)]);
  };

  const clearChat = () => {
    setMessages([createGreetingMessage(mood)]);
    setError("");
    window.speechSynthesis?.cancel();
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
      {/* ─── Sidebar ─── */}
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        {/* Avatar Card */}
        <div className="glass-panel rounded-2xl p-6 text-center">
          <div className="relative mx-auto mb-4 h-24 w-24">
            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 opacity-40 blur-lg" />
            <div className="relative grid h-full w-full place-items-center rounded-full border border-white/20 bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 shadow-xl">
              <Bot className="h-10 w-10 text-white" />
            </div>
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-slate-950 bg-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Nova</h2>
          <p className="text-xs text-slate-400">AI Companion by ToolVerse</p>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3 text-cyan-300" />
            <span className="text-xs font-medium text-cyan-200">Online · Safe Mode</span>
          </div>
        </div>

        {/* Mood Selector */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Companion Mode
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMoodChange(m.id)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition",
                  mood === m.id
                    ? "border-cyan-400/40 bg-cyan-400/10 shadow-inner"
                    : "border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
                )}
              >
                <span className="block text-base">{m.emoji}</span>
                <span
                  className={cn(
                    "block text-xs font-semibold",
                    mood === m.id ? "text-cyan-200" : "text-slate-300",
                  )}
                >
                  {m.label}
                </span>
                <span className="block text-[10px] text-slate-500">{m.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Controls
          </h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 transition",
                voiceEnabled
                  ? "border-cyan-400/30 bg-cyan-400/10"
                  : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]",
              )}
            >
              <span className="text-sm text-slate-300">Voice Reply</span>
              {voiceEnabled ? (
                <Volume2 className="h-4 w-4 text-cyan-300" />
              ) : (
                <VolumeOff className="h-4 w-4 text-slate-500" />
              )}
            </button>
            <button
              type="button"
              onClick={clearChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Conversation
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Chat Panel ─── */}
      <div className="flex flex-col">
        <div className="glass-panel flex min-h-[70vh] flex-col rounded-2xl">
          {/* Chat messages */}
          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "rounded-br-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/20 text-white"
                      : "rounded-bl-md border border-white/8 bg-white/[0.04] text-slate-200",
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
                {msg.role === "user" && (
                  <div className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border border-white/15 bg-white/10">
                    <span className="text-xs font-bold text-white">You</span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl rounded-bl-md border border-white/8 bg-white/[0.04] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Nova is thinking...
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mx-auto max-w-md rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/8 p-4">
            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={cn(
                  "grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border transition",
                  isListening
                    ? "border-red-400/40 bg-red-500/15 text-red-300 animate-pulse"
                    : "border-white/10 bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/10",
                )}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Talk to Nova..."
                  rows={1}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/[0.07]"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />
              </div>

              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className={cn(
                  "grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl transition",
                  input.trim() && !loading
                    ? "bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-lg hover:shadow-cyan-400/25"
                    : "border border-white/10 bg-white/[0.05] text-slate-500",
                )}
                title="Send message"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            <p className="mt-2 text-center text-[11px] text-slate-500">
              Nova is an AI companion. Responses may be inaccurate. Safe mode is always on.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
