"use client";

import { useState, useRef, type DragEvent } from "react";
import { 
  Upload, Trash2, Copy, Download, RefreshCw, Undo, Redo, Sparkles, 
  Sliders, Image as ImageIcon, Layers, ZoomIn, Scissors, History, 
  Eye, Settings, Edit, Plus, FileText, Check, ChevronDown, Wand2, 
  Info, Minimize2, Maximize2, HelpCircle, Loader2, Sparkle
} from "lucide-react";
import type { Tool } from "@/config/tools";
import { CopyButton } from "@/components/CopyButton";
import { DownloadButton } from "@/components/DownloadButton";
import { UsageLimitBanner } from "@/components/UsageLimitBanner";

type AiImageSuiteProps = {
  tool: Tool;
  usage: { remaining: number; limit: number };
  setUsage: (val: { remaining: number; limit: number }) => void;
};

type HistoryItem = {
  id: string;
  toolSlug: string;
  prompt: string;
  negativePrompt: string;
  style: string;
  size: string;
  quality: string;
  imageCount: number;
  images: string[];
  date: string;
};

type DownloadFormat = "png" | "jpg" | "webp";

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1", desc: "Square (Post)", width: 40, height: 40 },
  { id: "16:9", label: "16:9", desc: "Landscape (YouTube)", width: 56, height: 32 },
  { id: "9:16", label: "9:16", desc: "Portrait (Reels/TikTok)", width: 32, height: 56 },
  { id: "4:5", label: "4:5", desc: "Social (Instagram)", width: 38, height: 48 },
  { id: "3:2", label: "3:2", desc: "Classic (Photo)", width: 48, height: 32 },
  { id: "21:9", label: "21:9", desc: "Ultrawide (Banner)", width: 60, height: 26 },
];

const QUALITY_OPTIONS = ["Standard", "HD", "Ultra HD"];
const IMAGE_COUNTS = [1, 2, 4, 8];
const DOWNLOAD_FORMATS = ["png", "jpg", "webp"] as const;

const STYLE_PRESETS = [
  { name: "Realistic", icon: "📸" },
  { name: "Cinematic", icon: "🎬" },
  { name: "Documentary", icon: "📰" },
  { name: "Business Documentary", icon: "💼" },
  { name: "Luxury Commercial", icon: "💎" },
  { name: "Anime", icon: "🌸" },
  { name: "Cartoon", icon: "🎨" },
  { name: "Pixar", icon: "🎈" },
  { name: "3D Render", icon: "🧊" },
  { name: "Cyberpunk", icon: "🌆" },
  { name: "Fantasy", icon: "🦄" },
  { name: "Watercolor", icon: "🖌️" },
  { name: "Oil Painting", icon: "🖼️" },
  { name: "Concept Art", icon: "✏️" },
  { name: "Architecture", icon: "🏛️" },
  { name: "Product Photography", icon: "📦" },
  { name: "Fashion Photography", icon: "👗" },
  { name: "YouTube Thumbnail", icon: "📺" }
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function loadStoredHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem("toolverse-image-history");
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as HistoryItem[]) : [];
  } catch (err) {
    console.error("Failed to load history", err);
    return [];
  }
}

export function AiImageSuite({ tool, usage, setUsage }: AiImageSuiteProps) {
  // Inputs State
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Premium 3D");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [quality, setQuality] = useState("Standard");
  const [imageCount, setImageCount] = useState(1);
  const [mode, setMode] = useState("Text to Image"); // "Text to Image", "Image to Image", "Style Transfer", "Face Transfer", "Character Consistency"

  // Reference Images
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [similarity, setSimilarity] = useState("50%"); // 20%, 50%, 80%, 100%
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // App UI State
  const [activeTab, setActiveTab] = useState<"workspace" | "history">("workspace");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  const [assistLoading, setAssistLoading] = useState(false);
  const [editLoadingAction, setEditLoadingAction] = useState<string | null>(null);

  // Outputs State
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("png");

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(loadStoredHistory);

  // Save History Helper
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("toolverse-image-history", JSON.stringify(newHistory));
    } catch (err) {
      console.error("Failed to save history", err);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      setError("Please upload image files only.");
      return;
    }

    setError("");
    const base64Promises = validFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    });

    try {
      const base64s = await Promise.all(base64Promises);
      setReferenceImages(prev => [...prev, ...base64s].slice(0, 5)); // limit to 5 reference images
    } catch (err) {
      setError("Failed to read image file.");
    }
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  // AI Prompt Assist Handlers
  const handleAiAssist = async (action: string) => {
    if (!prompt && action !== "suggestions" && action !== "recommend_style") {
      setError("Please write an initial prompt idea first.");
      return;
    }
    setError("");
    setAssistLoading(true);
    try {
      const response = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, prompt, style: selectedStyle })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI assist failed");

      if (action === "negative") {
        setNegativePrompt(data.result);
      } else if (action === "recommend_style") {
        setSelectedStyle(data.result);
      } else if (action === "suggestions") {
        setPrompt(prev => prev ? `${prev}\n\nSuggested Variations:\n${data.result}` : data.result);
      } else {
        setPrompt(data.result);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Prompt assistant failed."));
    } finally {
      setAssistLoading(false);
    }
  };

  // Main Generation Handler
  const handleGenerate = async () => {
    if (!prompt) {
      setError("Please specify what image you want to generate.");
      return;
    }
    setError("");
    setLoading(true);
    setLoadingStep("Enhancing prompt parameters...");

    const steps = [
      "Connecting to image generation pipeline...",
      "Injecting artistic style preset...",
      "Processing reference image similarity...",
      "Generating high quality pixels...",
      "Finalizing image details..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoadingStep(steps[currentStep]);
        currentStep++;
      }
    }, 1800);

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolSlug: tool.slug,
          inputs: {
            prompt,
            negativePrompt,
            style: selectedStyle,
            size: aspectRatio,
            quality,
            imageCount: String(imageCount),
            mode,
            referenceImages: JSON.stringify(referenceImages),
            similarity
          }
        })
      });

      const data = await response.json();
      clearInterval(interval);

      if (!response.ok) throw new Error(data.error || "Generation failed.");

      const newImages = data.images || [data.imageUrl];
      setGeneratedImages(newImages);
      setSelectedImageIndex(0);
      setActiveTab("workspace");

      // Update remaining usage
      if (typeof data.remaining === "number") {
        setUsage({ remaining: data.remaining, limit: data.limit || usage.limit });
      }

      // Add to History
      const newHistoryItem: HistoryItem = {
        id: `gen-${Date.now()}`,
        toolSlug: tool.slug,
        prompt,
        negativePrompt,
        style: selectedStyle,
        size: aspectRatio,
        quality,
        imageCount,
        images: newImages,
        date: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      saveHistory([newHistoryItem, ...history]);
    } catch (err: unknown) {
      clearInterval(interval);
      setError(getErrorMessage(err, "AI image generation failed."));
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  // Image Edit operations (Bg removal, Upscale, etc.)
  const handleImageEdit = async (action: string) => {
    const currentImage = generatedImages[selectedImageIndex];
    if (!currentImage) return;

    setError("");
    setEditLoadingAction(action);

    try {
      const response = await fetch("/api/image-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          imageUrl: currentImage,
          prompt
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Edit failed");

      // Update current image with edited image
      setGeneratedImages(prev => {
        const copy = [...prev];
        copy[selectedImageIndex] = data.imageUrl;
        return copy;
      });

      // Update history record
      const activeGen = history[0];
      if (activeGen) {
        const updatedImages = [...activeGen.images];
        updatedImages[selectedImageIndex] = data.imageUrl;
        const updatedHistory = history.map((item, idx) => 
          idx === 0 ? { ...item, images: updatedImages } : item
        );
        saveHistory(updatedHistory);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to process image edit."));
    } finally {
      setEditLoadingAction(null);
    }
  };

  // Client side format downloader (PNG, JPG, WEBP)
  const triggerDownload = (imageUrl: string, format: "png" | "jpg" | "webp") => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      let mimeType = "image/png";
      let ext = "png";
      if (format === "jpg") {
        mimeType = "image/jpeg";
        ext = "jpg";
      } else if (format === "webp") {
        mimeType = "image/webp";
        ext = "webp";
      }

      const dataUrl = canvas.toDataURL(mimeType, 0.95);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `toolverse-generation-${Date.now()}.${ext}`;
      link.click();
    };
    img.src = imageUrl;
  };

  // Load from history
  const loadHistoryItem = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setNegativePrompt(item.negativePrompt);
    setSelectedStyle(item.style);
    setAspectRatio(item.size);
    setQuality(item.quality);
    setImageCount(item.imageCount);
    setGeneratedImages(item.images);
    setSelectedImageIndex(0);
    setActiveTab("workspace");
  };

  const deleteHistoryItem = (id: string) => {
    saveHistory(history.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {tool.isAI ? <UsageLimitBanner remaining={usage.remaining} limit={usage.limit} /> : null}

      <div className="glass-panel grid grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur-xl lg:grid-cols-[380px_1fr]">
        
        {/* LEFT PANEL: ADVANCED CONTROLS */}
        <div className="border-r border-white/10 p-5 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-md font-semibold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              Advanced Controls
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Pro Suite
            </span>
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              Generation Mode
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {["Text to Image", "Image to Image", "Style Transfer", "Face Transfer"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-1.5 px-2.5 rounded-lg text-left text-xs font-medium border transition-all ${
                    mode === m 
                      ? "border-cyan-400 bg-cyan-400/10 text-cyan-200" 
                      : "border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5 text-cyan-400" />
                Artistic Prompt
              </label>
              {assistLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />}
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create (e.g. realistic cat wearing spacesuit)..."
              className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-900/50 p-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/60"
            />

            {/* Prompt Helper Shortcuts */}
            <div className="flex flex-wrap gap-1">
              {[
                { label: "Enhance", action: "enhance" },
                { label: "Rewrite", action: "rewrite" },
                { label: "Expand", action: "expand" },
                { label: "Suggest", action: "suggestions" }
              ].map((btn) => (
                <button
                  key={btn.label}
                  disabled={assistLoading}
                  onClick={() => handleAiAssist(btn.action)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
                >
                  <Sparkle className="h-2.5 w-2.5 text-yellow-400" />
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Negative Prompt (Avoid)
              </label>
              <button
                type="button"
                disabled={assistLoading}
                onClick={() => handleAiAssist("negative")}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 transition"
              >
                Auto Generate
              </button>
            </div>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, distorted, low resolution, bad hands..."
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Style Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Visual Style Preset
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1 border border-white/5 rounded-xl p-1.5 bg-slate-900/20">
              {STYLE_PRESETS.map((styleObj) => (
                <button
                  key={styleObj.name}
                  onClick={() => setSelectedStyle(styleObj.name)}
                  className={`py-1.5 px-2 rounded-lg text-left text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedStyle === styleObj.name
                      ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-200"
                      : "border border-transparent bg-white/[0.01] text-slate-400 hover:bg-white/[0.04]"
                  }`}
                >
                  <span>{styleObj.icon}</span>
                  <span className="truncate">{styleObj.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5 text-cyan-400" />
              Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`flex flex-col items-center justify-between p-2 rounded-xl border transition-all ${
                    aspectRatio === ratio.id 
                      ? "border-cyan-400 bg-cyan-400/5 text-cyan-200" 
                      : "border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]"
                  }`}
                >
                  <div 
                    style={{ width: `${ratio.width * 0.5}px`, height: `${ratio.height * 0.5}px` }} 
                    className={`rounded border border-dashed transition-all ${
                      aspectRatio === ratio.id ? "border-cyan-400 bg-cyan-400/20" : "border-slate-500"
                    }`}
                  />
                  <span className="text-[10px] font-semibold mt-1.5">{ratio.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality & Image Count */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/60"
              >
                {QUALITY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Image Count</label>
              <div className="grid grid-cols-4 gap-1">
                {IMAGE_COUNTS.map(count => (
                  <button
                    key={count}
                    onClick={() => setImageCount(count)}
                    className={`py-1.5 px-1 rounded-lg text-xs font-semibold border transition-all ${
                      imageCount === count
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                        : "border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reference Image System */}
          <div className="space-y-3 border-t border-white/5 pt-4">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                Reference Images ({referenceImages.length}/5)
              </span>
              {referenceImages.length > 0 && (
                <button
                  onClick={() => setReferenceImages([])}
                  className="text-[10px] text-rose-400 hover:text-rose-300"
                >
                  Clear All
                </button>
              )}
            </label>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-cyan-400 bg-cyan-400/10"
                  : "border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03]"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <Upload className="h-5 w-5 mx-auto text-slate-400 mb-1.5" />
              <p className="text-[11px] text-slate-300">Drag & drop or click to upload</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Supports PNG, JPG, WebP</p>
            </div>

            {/* Reference Previews */}
            {referenceImages.length > 0 && (
              <div className="grid grid-cols-5 gap-1.5 bg-slate-950/30 p-2 rounded-xl border border-white/5">
                {referenceImages.map((src, index) => (
                  <div key={index} className="relative aspect-square rounded overflow-hidden border border-white/10 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Reference Preview" className="h-full w-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeReferenceImage(index);
                      }}
                      className="absolute top-0.5 right-0.5 p-0.5 rounded bg-slate-950/80 text-rose-400 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Similarity Control */}
            {referenceImages.length > 0 && (
              <div className="space-y-1.5 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                <div className="flex justify-between text-[10px] font-medium">
                  <span className="text-slate-400">Reference Strength:</span>
                  <span className="text-cyan-400 font-semibold">{similarity}</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: "Low", val: "20%" },
                    { label: "Medium", val: "50%" },
                    { label: "High", val: "80%" },
                    { label: "Exact", val: "100%" }
                  ].map((strength) => (
                    <button
                      key={strength.val}
                      onClick={() => setSimilarity(strength.val)}
                      className={`py-1 rounded text-[10px] font-bold border transition ${
                        similarity === strength.val 
                          ? "border-cyan-400 bg-cyan-400/10 text-cyan-200" 
                          : "border-transparent bg-white/5 text-slate-400"
                      }`}
                    >
                      {strength.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-xs text-rose-200 border border-rose-300/30 bg-rose-400/10 p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white hover:bg-cyan-100 text-slate-950 font-bold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-white/5 hover:shadow-cyan-400/20"
          >
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Wand2 className="h-4.5 w-4.5 group-hover:rotate-12 transition-transform" />
            )}
            {loading ? "Generating Image..." : `Generate (${imageCount} variations)`}
          </button>
        </div>

        {/* RIGHT PANEL: WORKSPACE */}
        <div className="flex flex-col bg-slate-950/20">
          
          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-950/30">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                {tool.category} / {mode}
              </p>
              <h1 className="text-lg font-semibold text-white tracking-tight">
                {tool.name} Pro Suite
              </h1>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("workspace")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  activeTab === "workspace"
                    ? "bg-white/10 border-white/20 text-white"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Workspace
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  activeTab === "history"
                    ? "bg-white/10 border-white/20 text-white"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                History ({history.length})
              </button>
            </div>
          </div>

          {/* TAB CONTENT: WORKSPACE */}
          {activeTab === "workspace" && (
            <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[500px]">
              
              {/* Case 1: LOADING STATE */}
              {loading ? (
                <div className="w-full max-w-md space-y-6 text-center">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-400/20 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" />
                    <Sparkles className="h-8 w-8 text-cyan-300 animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-white font-semibold text-md">Generating your AI Masterpiece</h3>
                    <p className="text-xs text-slate-400">{loadingStep}</p>
                  </div>
                  {/* Pulse loading indicator */}
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 animate-infinite-loading" />
                  </div>
                </div>
              ) : generatedImages.length > 0 ? (
                /* Case 2: GENERATED OUTPUT */
                <div className="w-full grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
                  
                  {/* Preview Left */}
                  <div className="space-y-4">
                    <div className="relative aspect-auto rounded-2xl overflow-hidden border border-white/10 bg-slate-900 flex items-center justify-center p-2 max-h-[60vh]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={generatedImages[selectedImageIndex]} 
                        alt="AI Generated Output" 
                        className="max-h-[58vh] max-w-full rounded-xl object-contain shadow-2xl" 
                      />
                      
                      {editLoadingAction && (
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                          <p className="text-xs text-white font-semibold uppercase tracking-wider">
                            Applying {editLoadingAction.replace("_", " ")}...
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Variations Grid Selection */}
                    {generatedImages.length > 1 && (
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 bg-slate-900/30 p-2.5 rounded-xl border border-white/5">
                        {generatedImages.map((src, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                              selectedImageIndex === idx 
                                ? "border-cyan-400 scale-95 shadow-[0_0_10px_rgba(34,211,238,0.3)]" 
                                : "border-white/10 hover:border-white/30"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="variation thumbnail" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Metadata summary */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-300">Prompt Used:</p>
                      <p className="text-xs text-slate-400 italic leading-relaxed">{prompt}</p>
                    </div>
                  </div>

                  {/* Actions Right Panel */}
                  <div className="space-y-5 bg-white/[0.02] border border-white/5 rounded-2xl p-4.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2">
                      Actions
                    </h3>

                    {/* Copy and Download Area */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                        <span>Format</span>
                        <div className="flex gap-1.5">
                          {DOWNLOAD_FORMATS.map((f) => (
                            <button
                              key={f}
                              onClick={() => setDownloadFormat(f)}
                              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold transition ${
                                downloadFormat === f 
                                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                                  : "bg-transparent border border-transparent hover:text-white"
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => triggerDownload(generatedImages[selectedImageIndex], downloadFormat)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs hover:bg-cyan-300 transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download {downloadFormat.toUpperCase()}
                      </button>

                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(prompt);
                          setError("Prompt copied to clipboard!");
                          setTimeout(() => setError(""), 2000);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy Prompt
                      </button>
                    </div>

                    {/* Image Editing Tools */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        AI Editing Toolbox
                      </h4>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          { id: "remove_bg", label: "Background Removal", icon: <Scissors className="h-3 w-3" /> },
                          { id: "upscale_2x", label: "Upscale 2x", icon: <ZoomIn className="h-3 w-3" /> },
                          { id: "upscale_4x", label: "Upscale 4x", icon: <ZoomIn className="h-3 w-3" /> },
                          { id: "sharpen", label: "Image Sharpening", icon: <Sparkles className="h-3 w-3" /> },
                          { id: "face_enhance", label: "Face Enhancement", icon: <Eye className="h-3 w-3" /> },
                          { id: "remove_text", label: "Text Removal", icon: <Trash2 className="h-3 w-3" /> },
                          { id: "remove_object", label: "Object Removal", icon: <Trash2 className="h-3 w-3" /> },
                          { id: "replace_object", label: "Replace Object", icon: <Edit className="h-3 w-3" /> },
                          { id: "inpainting", label: "Inpainting", icon: <Layers className="h-3 w-3" /> },
                          { id: "outpainting", label: "Outpainting", icon: <Layers className="h-3 w-3" /> }
                        ].map((edit) => (
                          <button
                            key={edit.id}
                            disabled={Boolean(editLoadingAction)}
                            onClick={() => handleImageEdit(edit.id)}
                            className="w-full flex items-center gap-2 py-1.5 px-3 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] text-left text-[11px] font-semibold text-slate-300 hover:text-white transition disabled:opacity-40"
                          >
                            {edit.icon}
                            <span className="truncate">{edit.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Case 3: INITIAL PLACEHOLDER VIEW */
                <div className="text-center max-w-md space-y-4">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-pulse">
                    <Wand2 className="h-6 w-6 text-cyan-300" />
                  </div>
                  <h2 className="text-white font-semibold text-lg">AI Studio Canvas</h2>
                  <p className="text-xs leading-relaxed text-slate-400">
                    Use the advanced controls on the left to set up your prompt, preset style, aspect ratio, and batch variation size. Your generated output will appear here.
                  </p>
                  <div className="pt-4 grid grid-cols-2 gap-2 text-left">
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] text-slate-300">
                      <span className="font-bold text-cyan-400 block mb-1">💡 Quick Pro Tip:</span>
                      Use the &quot;Enhance&quot; assistant button under prompt input to automatically polish details!
                    </div>
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] text-slate-300">
                      <span className="font-bold text-cyan-400 block mb-1">🖼️ Upload References:</span>
                      Drag and drop style reference images or character faces to guide layout composition.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: HISTORY */}
          {activeTab === "history" && (
            <div className="flex-1 p-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  <History className="h-10 w-10 mx-auto opacity-30 mb-3" />
                  No generations recorded yet. Generated assets will appear in this history vault.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {history.map((item) => (
                    <div 
                      key={item.id} 
                      className="glass-card rounded-xl overflow-hidden border border-white/10 flex flex-col group hover:border-cyan-500/30 transition-all duration-300"
                    >
                      {/* Image Preview */}
                      <div className="relative aspect-video bg-slate-900 border-b border-white/5 overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={item.images[0]} 
                          alt="History generation" 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        {item.images.length > 1 && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 text-[9px] font-bold text-white">
                            +{item.images.length - 1} variations
                          </span>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 flex justify-between">
                            <span>{item.date}</span>
                            <span className="text-cyan-400 font-semibold">{item.style}</span>
                          </p>
                          <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed">
                            {item.prompt}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 pt-3">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-bold border border-white/5">
                            {item.size} / {item.quality}
                          </span>
                          
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => loadHistoryItem(item)}
                              className="p-1.5 rounded bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 border border-white/5 transition"
                              title="Load settings to workspace"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => triggerDownload(item.images[0], "png")}
                              className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition"
                              title="Download PNG"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteHistoryItem(item.id)}
                              className="p-1.5 rounded bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/5 transition"
                              title="Delete generation record"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
