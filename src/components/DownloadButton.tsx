"use client";

import { Download } from "lucide-react";

type DownloadButtonProps = {
  value?: string;
  filename?: string;
  mimeType?: string;
  base64?: string;
  label?: string;
};

function base64ToBlob(base64: string, mimeType: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

export function DownloadButton({
  value = "",
  filename = "toolverse-output.txt",
  mimeType = "text/plain;charset=utf-8",
  base64,
  label = "Download",
}: DownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        const blob = base64
          ? base64ToBlob(base64, mimeType)
          : new Blob([value], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
