"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, RotateCcw, WandSparkles } from "lucide-react";
import type { Tool, ToolField } from "@/config/tools";
import { FreelancerProposalOutput } from "@/components/FreelancerProposalOutput";
import { OutputBox } from "@/components/OutputBox";
import { TweetRewriterOutput } from "@/components/TweetRewriterOutput";
import { UsageLimitBanner } from "@/components/UsageLimitBanner";
import type { FreelancerProposalResult, TweetRewriteResult } from "@/lib/ai/types";
import { AiImageSuite } from "@/components/AiImageSuite";

type ToolFormProps = {
  tool: Tool;
};

type ApiResult = {
  output?: string;
  imageUrl?: string;
  download?: {
    filename: string;
    mimeType: string;
    base64: string;
  };
  downloadPng?: {
    filename: string;
    base64: string;
  };
  downloadSvg?: {
    filename: string;
    base64: string;
  };
  stats?: {
    originalSize: number;
    compressedSize: number;
    savedBytes: number;
    savedPercentage: number;
  };
  images?: string[];
  error?: string;
  remaining?: number;
  limit?: number;
  tweetRewrite?: TweetRewriteResult;
  freelancerProposal?: FreelancerProposalResult;
};

type EncodedUpload = {
  dataUrl: string;
  name: string;
  type: string;
  size: number;
};

function endpointFor(tool: Tool) {
  if (tool.category === "ai-image" && tool.outputType === "image") return "/api/image";
  if (tool.category === "image-conversion") return "/api/convert";
  if (tool.category === "pdf-ocr" && tool.isAI) return "/api/ocr";
  if (tool.isAI) return "/api/ai";
  return "/api/convert";
}

function matchesAccept(file: File, accept?: string) {
  if (!accept) return true;

  return accept.split(",").some((rule) => {
    const normalized = rule.trim().toLowerCase();
    if (!normalized) return true;
    if (normalized.endsWith("/*")) {
      return file.type.toLowerCase().startsWith(normalized.slice(0, -1));
    }
    if (normalized.startsWith(".")) {
      return file.name.toLowerCase().endsWith(normalized);
    }
    return file.type.toLowerCase() === normalized;
  });
}

export function ToolForm({ tool }: ToolFormProps) {
  const initialInputs = useMemo(
    () =>
      Object.fromEntries(
        tool.fields.map((field) => [field.name, field.options?.[0] || ""]),
      ) as Record<string, string>,
    [tool.fields],
  );
  const [inputs, setInputs] = useState<Record<string, string>>(initialInputs);
  const [output, setOutput] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [download, setDownload] = useState<ApiResult["download"]>();
  const [downloadPng, setDownloadPng] = useState<ApiResult["downloadPng"]>();
  const [downloadSvg, setDownloadSvg] = useState<ApiResult["downloadSvg"]>();
  const [stats, setStats] = useState<ApiResult["stats"]>();
  const [tweetRewrite, setTweetRewrite] = useState<TweetRewriteResult | undefined>();
  const [freelancerProposal, setFreelancerProposal] = useState<FreelancerProposalResult | undefined>();
  const [pageImages, setPageImages] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState({ remaining: 45, limit: 45 });

  useEffect(() => {
    fetch("/api/usage")
      .then((response) => response.json())
      .then((data) => {
        if (typeof data.remaining === "number") {
          setUsage({ remaining: data.remaining, limit: data.limit || 45 });
        }
      })
      .catch(() => undefined);
  }, []);

  async function encodeFile(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    return {
      dataUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    } satisfies EncodedUpload;
  }

  async function handleFile(field: ToolField, fileList?: FileList | null) {
    if (!fileList?.length) return;
    const selectedFiles = Array.from(fileList);

    const invalidFile = selectedFiles.find((file) => !matchesAccept(file, field.accept));
    if (invalidFile) {
      setInputs((current) => ({
        ...current,
        [field.name]: "",
        [`${field.name}Name`]: "",
        [`${field.name}Type`]: "",
      }));
      setError(`Unsupported file type: ${invalidFile.name}. Please upload ${field.accept}.`);
      return;
    }

    const oversizedFile = selectedFiles.find(
      (file) => field.maxSizeMB && file.size > field.maxSizeMB * 1024 * 1024,
    );
    if (oversizedFile) {
      setInputs((current) => ({
        ...current,
        [field.name]: "",
        [`${field.name}Name`]: "",
        [`${field.name}Type`]: "",
      }));
      setError(`${oversizedFile.name} is too large. Maximum upload size is ${field.maxSizeMB} MB.`);
      return;
    }

    setError("");
    const encodedFiles = await Promise.all(selectedFiles.map(encodeFile));

    if (field.multiple) {
      setInputs((current) => ({
        ...current,
        [field.name]: JSON.stringify(encodedFiles),
        [`${field.name}Name`]: encodedFiles.map((file) => file.name).join(", "),
        [`${field.name}Type`]: "multiple",
      }));
      return;
    }

    setInputs((current) => ({
      ...current,
      [field.name]: encodedFiles[0].dataUrl,
      [`${field.name}Name`]: encodedFiles[0].name,
      [`${field.name}Type`]: encodedFiles[0].type,
    }));
  }

  async function runTool(overrides: Record<string, string> = {}) {
    setLoading(true);
    setError("");
    setOutput("");
    setImageUrl(undefined);
    setDownload(undefined);
    setDownloadPng(undefined);
    setDownloadSvg(undefined);
    setStats(undefined);
    setTweetRewrite(undefined);
    setFreelancerProposal(undefined);
    setPageImages(undefined);

    try {
      const requestInputs = { ...inputs, ...overrides };
      const response = await fetch(endpointFor(tool), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug: tool.slug, inputs: requestInputs }),
      });
      const data = (await response.json()) as ApiResult;

      if (!response.ok) throw new Error(data.error || "The tool could not run.");

      setOutput(data.output || "");
      setImageUrl(data.imageUrl);
      setDownload(data.download);
      setDownloadPng(data.downloadPng);
      setDownloadSvg(data.downloadSvg);
      setStats(data.stats);
      setTweetRewrite(data.tweetRewrite);
      setFreelancerProposal(data.freelancerProposal);
      setPageImages(data.images);
      if (typeof data.remaining === "number") {
        setUsage({ remaining: data.remaining, limit: data.limit || usage.limit });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runTool();
  }

  function resetTool() {
    setInputs(initialInputs);
    setOutput("");
    setImageUrl(undefined);
    setDownload(undefined);
    setDownloadPng(undefined);
    setDownloadSvg(undefined);
    setStats(undefined);
    setTweetRewrite(undefined);
    setFreelancerProposal(undefined);
    setPageImages(undefined);
    setError("");
  }

  if (tool.category === "ai-image") {
    return <AiImageSuite tool={tool} usage={usage} setUsage={setUsage} />;
  }

  return (
    <div className="space-y-5">
      {tool.isAI ? <UsageLimitBanner remaining={usage.remaining} limit={usage.limit} /> : null}
      <form onSubmit={onSubmit} className="glass-card space-y-4 rounded-xl p-5">
        {tool.fields.map((field) => (
          <label key={field.name} className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                required={field.required}
                value={inputs[field.name] || ""}
                onChange={(event) =>
                  setInputs((current) => ({ ...current, [field.name]: event.target.value }))
                }
                placeholder={field.placeholder}
                className="min-h-32 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-200/60"
              />
            ) : field.type === "select" ? (
              <select
                value={inputs[field.name] || field.options?.[0] || ""}
                onChange={(event) =>
                  setInputs((current) => ({ ...current, [field.name]: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-200/60"
              >
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.type === "file" ? (
              <input
                required={field.required}
                type="file"
                accept={field.accept}
                multiple={field.multiple}
                onChange={(event) => handleFile(field, event.target.files)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-200 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
              />
            ) : (
              <input
                required={field.required}
                type={field.type}
                value={inputs[field.name] || ""}
                onChange={(event) =>
                  setInputs((current) => ({ ...current, [field.name]: event.target.value }))
                }
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-200/60"
              />
            )}
            {field.helperText ? (
              <span className="mt-2 block text-xs text-slate-400">{field.helperText}</span>
            ) : null}
          </label>
        ))}

        {error ? (
          <div className="rounded-xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
            {tool.outputType === "file" ? "Convert" : "Generate"}
          </button>
          {tool.slug === "gst-calculator" ? (
            <button
              type="button"
              onClick={resetTool}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          ) : null}
        </div>
      </form>

      {tweetRewrite ? (
        <TweetRewriterOutput
          result={tweetRewrite}
          loading={loading}
          onRegenerate={runTool}
        />
      ) : freelancerProposal ? (
        <FreelancerProposalOutput
          result={freelancerProposal}
          loading={loading}
          onAction={(proposalAction) => runTool({ proposalAction })}
        />
      ) : output || imageUrl || downloadPng || downloadSvg ? (
        <OutputBox
          output={output}
          imageUrl={imageUrl}
          filename={`${tool.slug}-output.txt`}
          download={download}
          downloadPng={downloadPng}
          downloadSvg={downloadSvg}
          stats={stats}
          images={pageImages}
        />
      ) : null}
    </div>
  );
}
