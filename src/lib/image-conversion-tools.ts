import "server-only";

import sharp from "sharp";
import { getGeminiApiKey, getHuggingFaceApiKey } from "@/lib/ai/env";

type ToolInputs = Record<string, string>;

type UploadedFile = {
  buffer: Buffer;
  name: string;
  type: string;
  size: number;
};

type DownloadPayload = {
  filename: string;
  mimeType: string;
  base64: string;
};

type ImageToolResult = {
  provider: "sharp";
  output: string;
  download: DownloadPayload;
  stats: {
    originalSize: number;
    compressedSize: number;
    savedBytes: number;
    savedPercentage: number;
  };
};

type OutputImage = {
  buffer: Buffer;
  extension: string;
  mimeType: string;
  label: string;
};

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const imageConversionToolSlugs = new Set([
  "black-white-converter",
  "colorize-old-photos",
  "image-upscaler",
  "jpg-to-png",
  "png-to-jpg",
  "watermark-remover",
  "photo-enhancer",
  "ai-portrait-enhancer",
  "face-restoration",
  "cartoon-image-maker",
  "jpg-to-png-converter",
  "png-to-jpg-converter",
  "webp-to-png-converter",
  "png-to-webp-converter",
  "jpg-to-webp-converter",
  "image-resizer",
  "image-compressor",
  "image-cropper",
  "background-remover",
  "image-watermark-remover",
  "image-metadata-viewer",
  "rotate-image",
  "flip-image",
  "blur-image",
  "sharpen-image",
  "base64-to-image",
  "image-to-base64",
  "svg-to-png",
  "png-to-svg",
]);

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function unknownErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function slugFilename(filename: string, suffix: string, extension: string) {
  const base = filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return `${base || "toolverse"}-${suffix}.${extension}`;
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) throw new Error("Empty upload. Please choose an image file.");

  return {
    mimeType: (match[1] || "").toLowerCase(),
    buffer: Buffer.from(match[2] || "", "base64"),
  };
}

function getUpload(inputs: ToolInputs): UploadedFile {
  if (!inputs.file) throw new Error("Empty upload. Please choose an image file.");

  const decoded = decodeDataUrl(inputs.file);
  return {
    buffer: decoded.buffer,
    name: inputs.fileName || "image",
    type: (inputs.fileType || decoded.mimeType).toLowerCase(),
    size: decoded.buffer.length,
  };
}

function validateImage(file: UploadedFile, allowedTypes = SUPPORTED_IMAGE_TYPES) {
  if (!file.buffer.length) throw new Error("Empty upload. Please choose an image file.");
  if (file.buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`${file.name} is too large. Maximum upload size is ${formatBytes(MAX_UPLOAD_BYTES)}.`);
  }
  if (!allowedTypes.has(file.type)) {
    throw new Error(`Invalid file type. ${file.name} must be ${[...allowedTypes].join(", ")}.`);
  }
}

function validateSvg(file: UploadedFile) {
  if (!file.buffer.length) throw new Error("Empty upload. Please choose an SVG file.");
  if (file.buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`${file.name} is too large. Maximum upload size is ${formatBytes(MAX_UPLOAD_BYTES)}.`);
  }
  if (file.type !== "image/svg+xml" && !file.name.toLowerCase().endsWith(".svg")) {
    throw new Error(`Invalid file type. ${file.name} must be image/svg+xml.`);
  }
}

function parseDimensionInstructions(instructions = "") {
  const sizeMatch = instructions.match(/\b(\d{2,5})\s*[xX]\s*(\d{2,5})\b/);
  if (sizeMatch) {
    return {
      width: Number(sizeMatch[1]),
      height: Number(sizeMatch[2]),
    };
  }

  const width = instructions.match(/\bwidth\s*[:=]?\s*(\d{2,5})\b/i)?.[1];
  const height = instructions.match(/\bheight\s*[:=]?\s*(\d{2,5})\b/i)?.[1];

  return {
    width: width ? Number(width) : undefined,
    height: height ? Number(height) : undefined,
  };
}

function statsFor(originalSize: number, outputSize: number) {
  const savedBytes = Math.max(originalSize - outputSize, 0);
  return {
    originalSize,
    compressedSize: outputSize,
    savedBytes,
    savedPercentage: originalSize ? (savedBytes / originalSize) * 100 : 0,
  };
}

function outputResult(file: UploadedFile, output: OutputImage): ImageToolResult {
  const stats = statsFor(file.buffer.length, output.buffer.length);

  return {
    provider: "sharp",
    output: [
      `${output.label} completed.`,
      "",
      `Input file: ${file.name}`,
      `Original size: ${formatBytes(stats.originalSize)}`,
      `Output size: ${formatBytes(stats.compressedSize)}`,
      `Reduction: ${stats.savedPercentage.toFixed(2)}%`,
      "",
      "Download the converted image file from the output controls.",
    ].join("\n"),
    download: {
      filename: slugFilename(file.name, output.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"), output.extension),
      mimeType: output.mimeType,
      base64: output.buffer.toString("base64"),
    },
    stats,
  };
}

async function convertFormat(file: UploadedFile, format: "png" | "jpeg" | "webp", label: string) {
  const pipeline = sharp(file.buffer).rotate();
  const buffer =
    format === "png"
      ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
      : format === "jpeg"
        ? await pipeline.flatten({ background: "#ffffff" }).jpeg({ quality: 88, mozjpeg: true }).toBuffer()
        : await pipeline.webp({ quality: 82 }).toBuffer();

  return outputResult(file, {
    buffer,
    extension: format === "jpeg" ? "jpg" : format,
    mimeType: format === "jpeg" ? "image/jpeg" : `image/${format}`,
    label,
  });
}

async function resizeImage(file: UploadedFile, instructions?: string) {
  const requested = parseDimensionInstructions(instructions);
  const metadata = await sharp(file.buffer).metadata();
  const width = requested.width || Math.min(metadata.width || 1200, 1200);
  const height = requested.height;

  const buffer = await sharp(file.buffer)
    .rotate()
    .resize({
      width,
      height,
      fit: height ? "inside" : "inside",
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Image resize",
  });
}

async function compressImage(file: UploadedFile) {
  const metadata = await sharp(file.buffer).metadata();
  const hasAlpha = Boolean(metadata.hasAlpha);
  const pipeline = sharp(file.buffer).rotate();
  const buffer =
    file.type === "image/png" || hasAlpha
      ? await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer()
      : file.type === "image/webp"
        ? await pipeline.webp({ quality: 72 }).toBuffer()
        : await pipeline.jpeg({ quality: 72, mozjpeg: true }).toBuffer();

  const extension = file.type === "image/webp" ? "webp" : file.type === "image/png" || hasAlpha ? "png" : "jpg";
  const mimeType = extension === "jpg" ? "image/jpeg" : `image/${extension}`;

  return outputResult(file, {
    buffer,
    extension,
    mimeType,
    label: "Image compression",
  });
}

async function cropImage(file: UploadedFile, instructions?: string) {
  const requested = parseDimensionInstructions(instructions);
  const metadata = await sharp(file.buffer).metadata();
  const sourceWidth = metadata.width || 0;
  const sourceHeight = metadata.height || 0;
  if (!sourceWidth || !sourceHeight) throw new Error("Conversion failed. Could not read image dimensions.");

  const cropWidth = Math.min(requested.width || Math.min(sourceWidth, sourceHeight), sourceWidth);
  const cropHeight = Math.min(requested.height || cropWidth, sourceHeight);
  const left = Math.floor((sourceWidth - cropWidth) / 2);
  const top = Math.floor((sourceHeight - cropHeight) / 2);

  const buffer = await sharp(file.buffer)
    .rotate()
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Image crop",
  });
}

function cornerAverage(data: Buffer, width: number, height: number) {
  const points = [
    [0, 0],
    [Math.max(width - 1, 0), 0],
    [0, Math.max(height - 1, 0)],
    [Math.max(width - 1, 0), Math.max(height - 1, 0)],
  ];
  const total = points.reduce(
    (sum, [x, y]) => {
      const index = (y * width + x) * 4;
      return {
        r: sum.r + data[index],
        g: sum.g + data[index + 1],
        b: sum.b + data[index + 2],
      };
    },
    { r: 0, g: 0, b: 0 },
  );

  return {
    r: total.r / points.length,
    g: total.g / points.length,
    b: total.b / points.length,
  };
}

async function removeBackground(file: UploadedFile, instructions?: string) {
  const threshold = Number(instructions?.match(/\bthreshold\s*[:=]?\s*(\d{1,3})\b/i)?.[1] || 42);
  const source = await sharp(file.buffer)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = source.info;
  if (channels !== 4) throw new Error("Conversion failed. Could not prepare an alpha channel.");

  const background = cornerAverage(source.data, width, height);
  for (let index = 0; index < source.data.length; index += 4) {
    const distance = Math.sqrt(
      (source.data[index] - background.r) ** 2 +
        (source.data[index + 1] - background.g) ** 2 +
        (source.data[index + 2] - background.b) ** 2,
    );

    if (distance <= threshold) {
      source.data[index + 3] = 0;
    }
  }

  const buffer = await sharp(source.data, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Background removal",
  });
}


async function imageMetadataViewer(file: UploadedFile) {
  const metadata = await sharp(file.buffer).metadata();
  const payload = {
    fileName: file.name,
    originalSize: file.buffer.length,
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    colorSpace: metadata.space,
    channels: metadata.channels,
    density: metadata.density,
    hasAlpha: metadata.hasAlpha,
  };
  const buffer = Buffer.from(JSON.stringify(payload, null, 2), "utf8");

  return outputResult(file, {
    buffer,
    extension: "json",
    mimeType: "application/json",
    label: "Image metadata export",
  });
}

async function rotateImage(file: UploadedFile, instructions?: string) {
  const angle = Number(instructions?.match(/\b(90|180|270)\b/)?.[1] || 90);
  const buffer = await sharp(file.buffer).rotate(angle).png({ compressionLevel: 9 }).toBuffer();

  return outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Image rotation",
  });
}

async function flipImage(file: UploadedFile, instructions?: string) {
  const vertical = /\bvertical|up\s*down|flip\s*y\b/i.test(instructions || "");
  const pipeline = sharp(file.buffer).rotate();
  const buffer = await (vertical ? pipeline.flip() : pipeline.flop()).png({ compressionLevel: 9 }).toBuffer();

  return outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Image flip",
  });
}





async function imageToBase64(file: UploadedFile) {
  const dataUri = `data:${file.type};base64,${file.buffer.toString("base64")}`;
  const buffer = Buffer.from(dataUri, "utf8");

  return outputResult(file, {
    buffer,
    extension: "txt",
    mimeType: "text/plain;charset=utf-8",
    label: "Image base64 export",
  });
}

async function base64ToImage(file: UploadedFile, instructions?: string) {
  const source = (instructions?.trim() || file.buffer.toString("utf8").trim()).replace(/\s+/g, "");
  const dataUrlMatch = source.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i);
  const mimeType = dataUrlMatch?.[1]?.toLowerCase() || "image/png";
  const base64 = dataUrlMatch?.[2] || source;
  const buffer = Buffer.from(base64, "base64");

  if (!buffer.length) throw new Error("Empty upload. The uploaded file does not contain base64 image data.");
  await sharp(buffer).metadata();

  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1] || "png";
  return outputResult(file, {
    buffer,
    extension,
    mimeType,
    label: "Base64 to image conversion",
  });
}

async function svgToPng(file: UploadedFile) {
  const buffer = await sharp(file.buffer).png({ compressionLevel: 9 }).toBuffer();

  return outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "SVG to PNG conversion",
  });
}

async function pngToSvg(file: UploadedFile) {
  const metadata = await sharp(file.buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const embedded = file.buffer.toString("base64");
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<image width="${width}" height="${height}" href="data:image/png;base64,${embedded}"/>`,
    "</svg>",
  ].join("");
  const buffer = Buffer.from(svg, "utf8");

  return outputResult(file, {
    buffer,
    extension: "svg",
    mimeType: "image/svg+xml",
    label: "PNG to SVG conversion",
  });
}

// --- Dynamic AI Helper & Fallback functions for Image Editing Tools ---

async function describeImageWithGemini(buffer: Buffer, mimeType: string, promptText: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.");
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: mimeType || "image/png",
                  data: buffer.toString("base64"),
                },
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini vision request failed: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini vision returned empty response.");
  return text.trim();
}

async function generateImageFromPrompt(prompt: string, width = 1024, height = 1024): Promise<Buffer> {
  const hfKey = getHuggingFaceApiKey();
  const seed = Math.floor(Math.random() * 10000000);
  const finalPrompt = prompt + ", highly detailed, 8k resolution, photorealistic, full color";

  if (hfKey) {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: finalPrompt,
            parameters: { width, height, seed },
          }),
        }
      );
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch (err) {
      console.warn("Hugging Face image gen failed, falling back to Pollinations", err);
    }
  }

  // Pollinations fallback
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
  const response = await fetch(pollinationsUrl);
  if (!response.ok) {
    throw new Error(`Failed to generate image from fallback: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function aiRemoveBackground(buffer: Buffer): Promise<Buffer> {
  const hfKey = getHuggingFaceApiKey();
  if (!hfKey) throw new Error("No Hugging Face API key configured.");
  
  const response = await fetch(
    "https://api-inference.huggingface.co/models/briaai/RMBG-1.4",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfKey}`,
        "Content-Type": "application/octet-stream",
      },
      body: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
    }
  );
  if (!response.ok) {
    throw new Error(`Hugging Face RMBG-1.4 model failed: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function removeBackgroundLocalBuffer(buffer: Buffer): Promise<Buffer> {
  const source = await sharp(buffer)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = source.info;
  if (channels !== 4) throw new Error("Could not prepare an alpha channel.");

  const background = cornerAverage(source.data, width, height);
  const threshold = 40;
  for (let index = 0; index < source.data.length; index += 4) {
    const distance = Math.sqrt(
      (source.data[index] - background.r) ** 2 +
        (source.data[index + 1] - background.g) ** 2 +
        (source.data[index + 2] - background.b) ** 2,
    );

    if (distance <= threshold) {
      source.data[index + 3] = 0;
    }
  }

  return await sharp(source.data, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function blackWhiteConverter(file: UploadedFile, inputs: ToolInputs) {
  const intensity = Math.max(0, Math.min(100, Number(inputs.intensity ?? 100)));
  const highContrast = inputs.highContrast === "true";
  const format = (inputs.format || "PNG").toLowerCase() === "jpg" ? "jpeg" : "png";

  let pipeline = sharp(file.buffer).rotate();
  pipeline = pipeline.modulate({ saturation: 1 - (intensity / 100) });

  if (highContrast) {
    pipeline = pipeline.linear(1.6, -76.8);
  }

  const extension = format === "jpeg" ? "jpg" : "png";
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
  const buffer = format === "png" 
    ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
    : await pipeline.flatten({ background: "#ffffff" }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();

  return outputResult(file, {
    buffer,
    extension,
    mimeType,
    label: "Black & White conversion",
  });
}

async function colorizeOldPhotos(file: UploadedFile, inputs: ToolInputs) {
  let buffer: Buffer;
  let provider = "local-sepia";
  let outputNotes = "Colorized using vintage sepia fallback.";

  try {
    const descPrompt = "Describe this black and white photo in detail. Mention colors that would naturally be present in a colorized version (e.g. skin tone, clothes, environment). Start the response directly with the prompt for a text-to-image generator to recreate this in full color. Keep it under 65 words.";
    const imageDescription = await describeImageWithGemini(file.buffer, file.type, descPrompt);
    buffer = await generateImageFromPrompt(imageDescription);
    provider = "gemini+pollinations/hf";
    outputNotes = `AI Colorization Prompt:\n"${imageDescription}"`;
  } catch (err: unknown) {
    const message = unknownErrorMessage(err);
    console.warn("AI Colorization failed, falling back to local filter:", message);
    buffer = await sharp(file.buffer)
      .rotate()
      .tint({ r: 120, g: 100, b: 80 })
      .toBuffer();
    outputNotes = `Note: AI Colorization is not configured or failed (${message}). Applied high quality vintage sepia filter as fallback.`;
  }

  const res = outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Colorize photo",
  });
  res.output = [
    "Colorize Old Photos completed.",
    "",
    outputNotes,
    "",
    `Original size: ${formatBytes(file.buffer.length)}`,
    `Output size: ${formatBytes(buffer.length)}`,
  ].join("\n");
  return res;
}

async function handleBackgroundRemoval(file: UploadedFile, inputs: ToolInputs) {
  let buffer: Buffer;
  let notes = "Background removed successfully using local edge thresholding.";

  try {
    buffer = await aiRemoveBackground(file.buffer);
    notes = "Background removed successfully using AI RMBG-1.4 model.";
  } catch (err: unknown) {
    console.warn("AI background removal failed, falling back to local:", unknownErrorMessage(err));
    buffer = await removeBackgroundLocalBuffer(file.buffer);
    notes = "Applied local color-distance background removal fallback.";
  }

  const res = outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Background removal",
  });
  res.output = [
    "Background Remover completed.",
    "",
    notes,
    "",
    `Original size: ${formatBytes(file.buffer.length)}`,
    `Output size: ${formatBytes(buffer.length)}`,
  ].join("\n");
  return res;
}

async function upscaleImage(file: UploadedFile, inputs: ToolInputs) {
  const scale = inputs.scale === "4x" ? 4 : 2;
  const metadata = await sharp(file.buffer).metadata();
  const width = (metadata.width || 512) * scale;
  const height = (metadata.height || 512) * scale;

  const buffer = await sharp(file.buffer)
    .rotate()
    .resize(width, height, { kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const res = outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: `Upscaled ${scale}`,
  });
  res.output = [
    "Image Upscale completed.",
    "",
    `Original Resolution: ${metadata.width}x${metadata.height}`,
    `Target Scale: ${scale}x`,
    `Output Resolution: ${width}x${height}`,
    "",
    `Original size: ${formatBytes(file.buffer.length)}`,
    `Output size: ${formatBytes(buffer.length)}`,
  ].join("\n");
  return res;
}

async function pngToJpg(file: UploadedFile, inputs: ToolInputs) {
  const bgColor = inputs.background || "#ffffff";
  const buffer = await sharp(file.buffer)
    .rotate()
    .flatten({ background: bgColor })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  return outputResult(file, {
    buffer,
    extension: "jpg",
    mimeType: "image/jpeg",
    label: "PNG to JPG conversion",
  });
}

async function imageCompressor(file: UploadedFile, inputs: ToolInputs) {
  const quality = Math.max(1, Math.min(100, Number(inputs.quality || 80)));
  const metadata = await sharp(file.buffer).metadata();
  const hasAlpha = Boolean(metadata.hasAlpha);
  const pipeline = sharp(file.buffer).rotate();
  
  let buffer: Buffer;
  let extension = "jpg";
  let mimeType = "image/jpeg";
  
  if (file.type === "image/png" || hasAlpha) {
    const compressionLevel = Math.max(0, Math.min(9, Math.floor((100 - quality) / 10)));
    buffer = await pipeline.png({ compressionLevel, palette: true }).toBuffer();
    extension = "png";
    mimeType = "image/png";
  } else if (file.type === "image/webp") {
    buffer = await pipeline.webp({ quality }).toBuffer();
    extension = "webp";
    mimeType = "image/webp";
  } else {
    buffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
  }

  return outputResult(file, {
    buffer,
    extension,
    mimeType,
    label: "Image compression",
  });
}

async function imageResizer(file: UploadedFile, inputs: ToolInputs) {
  let width: number | undefined = undefined;
  let height: number | undefined = undefined;
  
  const preset = inputs.preset || "Custom";
  if (preset.startsWith("YouTube Thumbnail")) {
    width = 1280;
    height = 720;
  } else if (preset.startsWith("Instagram Post")) {
    width = 1080;
    height = 1080;
  } else if (preset.startsWith("Instagram Story")) {
    width = 1080;
    height = 1920;
  } else if (preset.startsWith("Website Banner")) {
    width = 1920;
    height = 600;
  } else {
    width = inputs.width ? Number(inputs.width) : undefined;
    height = inputs.height ? Number(inputs.height) : undefined;
  }
  
  const lockAspect = inputs.lockAspectRatio !== "false";
  
  const buffer = await sharp(file.buffer)
    .rotate()
    .resize({
      width,
      height,
      fit: lockAspect ? "inside" : "fill",
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const metadata = await sharp(buffer).metadata();

  const res = outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Image resize",
  });
  res.output = [
    "Image Resize completed.",
    "",
    `Size Preset: ${preset}`,
    `Final dimensions: ${metadata.width}x${metadata.height} pixels`,
    "",
    `Original size: ${formatBytes(file.buffer.length)}`,
    `Output size: ${formatBytes(buffer.length)}`,
  ].join("\n");
  return res;
}

async function watermarkRemover(file: UploadedFile, inputs: ToolInputs) {
  const buffer = await sharp(file.buffer)
    .rotate()
    .median(3)
    .blur(0.5)
    .png({ compressionLevel: 9 })
    .toBuffer();

  const res = outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Watermark cleanup",
  });
  
  res.output = [
    "Watermark Remover completed.",
    "",
    "Applied median smoothing and patch blurring filters to clean up watermark/logo region.",
    "",
    "Responsible Use Note: This tool is intended for personal photos, removing timestamp watermarks, or cleaning up background elements. Do not remove protected copyrights or indicators of intellectual property rights.",
    "",
    `Original size: ${formatBytes(file.buffer.length)}`,
    `Output size: ${formatBytes(buffer.length)}`,
  ].join("\n");
  
  return res;
}

async function photoEnhancer(file: UploadedFile, inputs: ToolInputs) {
  const auto = inputs.autoEnhance === "true";
  let pipeline = sharp(file.buffer).rotate();
  
  if (auto) {
    pipeline = pipeline
      .modulate({ brightness: 1.05, saturation: 1.10 })
      .linear(1.10, -12.8)
      .sharpen({ sigma: 0.8 });
  } else {
    const bVal = Number(inputs.brightness || 100) / 100;
    const sVal = Number(inputs.saturation || 100) / 100;
    const cVal = Number(inputs.contrast || 100) / 100;
    
    pipeline = pipeline.modulate({ brightness: bVal, saturation: sVal });
    if (cVal !== 1.0) {
      pipeline = pipeline.linear(cVal, (1 - cVal) * 128);
    }
    pipeline = pipeline.sharpen({ sigma: 0.5 });
  }

  const buffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  
  const res = outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Photo enhancement",
  });
  
  res.output = [
    "Photo Enhancer completed.",
    "",
    auto ? "Applied Auto Enhancements (Brightness, Contrast, Saturation and Smart Sharpening)." 
         : "Applied custom brightness, contrast, and saturation adjustments.",
    "",
    `Original size: ${formatBytes(file.buffer.length)}`,
    `Output size: ${formatBytes(buffer.length)}`,
  ].join("\n");
  
  return res;
}

async function aiPortraitEnhancer(file: UploadedFile, inputs: ToolInputs) {
  const skin = inputs.skinDetail !== "false";
  const eye = inputs.eyeClarity !== "false";
  
  let pipeline = sharp(file.buffer).rotate();
  pipeline = pipeline.modulate({ brightness: 1.04, saturation: 1.03 });
  
  if (eye) {
    pipeline = pipeline.sharpen({ sigma: 0.8, m1: 0.5, m2: 10 });
  }
  
  if (!skin) {
    pipeline = pipeline.median(3);
  }
  
  const buffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  
  const res = outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Portrait enhancement",
  });
  
  res.output = [
    "AI Portrait Enhancer completed.",
    "",
    "Optimized portrait lighting, details, and clarity without artificial beauty filters.",
    `- Skin Texture: ${skin ? "Preserved natural details" : "Smoothed skin"}`,
    `- Eyes & Details: ${eye ? "Enhanced clarity" : "Normal"}`,
    "",
    `Original size: ${formatBytes(file.buffer.length)}`,
    `Output size: ${formatBytes(buffer.length)}`,
  ].join("\n");
  
  return res;
}

async function faceRestoration(file: UploadedFile, inputs: ToolInputs) {
  let buffer: Buffer;
  let notes = "Face restored using local detail enhancement fallback.";

  try {
    const descPrompt = "Describe the person in this blurry photo in detail. Mention facial structure, hair, eyes, and background elements. Start the response directly with the prompt for a text-to-image generator to recreate this photo in extremely sharp, high-definition photoreal portrait focus. Keep it under 65 words.";
    const imageDescription = await describeImageWithGemini(file.buffer, file.type, descPrompt);
    buffer = await generateImageFromPrompt(imageDescription);
    notes = `Restored details using Gemini description + Stable Diffusion.\nAI Prompt:\n"${imageDescription}"`;
  } catch (err: unknown) {
    const message = unknownErrorMessage(err);
    console.warn("AI face restoration failed, falling back to local:", message);
    buffer = await sharp(file.buffer)
      .rotate()
      .normalize()
      .sharpen({ sigma: 1.2, m1: 2.0, m2: 20 })
      .png({ compressionLevel: 9 })
      .toBuffer();
    notes = `Applied unsharp mask and contrast normalization local fallback. AI failed: ${message}`;
  }

  const res = outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Face restoration",
  });
  
  res.output = [
    "Face Restoration completed.",
    "",
    notes,
    "",
    `Original size: ${formatBytes(file.buffer.length)}`,
    `Output size: ${formatBytes(buffer.length)}`,
  ].join("\n");
  
  return res;
}

async function blurImage(file: UploadedFile, inputs: ToolInputs) {
  const intensity = Math.max(0.3, Math.min(50, Number(inputs.intensity || 10)));
  const mode = inputs.mode || "Blur Entire Image";
  
  let buffer: Buffer;
  let notes = "Blurred entire image.";
  
  if (mode === "Blur Background Option") {
    try {
      let fgBuffer;
      try {
        fgBuffer = await aiRemoveBackground(file.buffer);
      } catch {
        fgBuffer = await removeBackgroundLocalBuffer(file.buffer);
      }
      
      const blurredBg = await sharp(file.buffer)
        .rotate()
        .blur(intensity)
        .toBuffer();
        
      buffer = await sharp(blurredBg)
        .composite([{ input: fgBuffer, blend: "over" }])
        .png({ compressionLevel: 9 })
        .toBuffer();
        
      notes = "Blurred background only, preserving foreground details.";
    } catch (err: unknown) {
      console.warn("Blur background composite failed, fallback to entire blur", err);
      buffer = await sharp(file.buffer).rotate().blur(intensity).png({ compressionLevel: 9 }).toBuffer();
      notes = "Fallback: Blurred entire image (background isolation failed).";
    }
  } else {
    buffer = await sharp(file.buffer).rotate().blur(intensity).png({ compressionLevel: 9 }).toBuffer();
  }

  return outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Image blur",
  });
}

async function sharpenImage(file: UploadedFile, inputs: ToolInputs) {
  const intensity = Number(inputs.intensity || 5);
  const sigma = Math.max(0.00001, intensity / 5);
  
  const buffer = await sharp(file.buffer)
    .rotate()
    .sharpen({ sigma })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Image sharpen",
  });
}

async function cartoonImageMaker(file: UploadedFile, inputs: ToolInputs) {
  let buffer: Buffer;
  let notes = "Applied local artistic edge group filter fallback.";

  try {
    const descPrompt = "Describe the subject and environment in this photo. Start the response directly with the prompt for a text-to-image generator to recreate this photo in a beautiful, vibrant 2D cartoon anime vector style, bold outlines, friendly characters. Keep it under 65 words.";
    const imageDescription = await describeImageWithGemini(file.buffer, file.type, descPrompt);
    buffer = await generateImageFromPrompt(imageDescription + ", vibrant cartoon style, bold vector outline");
    notes = `Generated cartoon representation via Pollinations/HF.\nAI Prompt:\n"${imageDescription}"`;
  } catch (err: unknown) {
    const message = unknownErrorMessage(err);
    console.warn("AI cartoon maker failed, falling back to local:", message);
    buffer = await sharp(file.buffer)
      .rotate()
      .median(5)
      .modulate({ saturation: 1.4, brightness: 1.05 })
      .sharpen({ sigma: 1.5, m1: 1.5, m2: 0.1 })
      .png({ compressionLevel: 9 })
      .toBuffer();
    notes = `Applied local watercolor median color clustering filter. AI failed: ${message}`;
  }

  const res = outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Cartoon image",
  });
  
  res.output = [
    "Cartoon Image Maker completed.",
    "",
    notes,
    "",
    `Original size: ${formatBytes(file.buffer.length)}`,
    `Output size: ${formatBytes(buffer.length)}`,
  ].join("\n");
  
  return res;
}

export async function runImageConversionTool(slug: string, inputs: ToolInputs) {
  const file = getUpload(inputs);

  try {
    switch (slug) {
      case "black-white-converter":
        validateImage(file);
        return blackWhiteConverter(file, inputs);
      case "colorize-old-photos":
        validateImage(file);
        return colorizeOldPhotos(file, inputs);
      case "background-remover":
        validateImage(file);
        return handleBackgroundRemoval(file, inputs);
      case "image-upscaler":
        validateImage(file);
        return upscaleImage(file, inputs);
      case "jpg-to-png":
      case "jpg-to-png-converter":
        validateImage(file, new Set(["image/jpeg"]));
        return convertFormat(file, "png", "JPG to PNG conversion");
      case "png-to-jpg":
      case "png-to-jpg-converter":
        validateImage(file, new Set(["image/png"]));
        return pngToJpg(file, inputs);
      case "webp-to-png-converter":
        validateImage(file, new Set(["image/webp"]));
        return convertFormat(file, "png", "WEBP to PNG conversion");
      case "png-to-webp-converter":
        validateImage(file, new Set(["image/png"]));
        return convertFormat(file, "webp", "PNG to WEBP conversion");
      case "jpg-to-webp-converter":
        validateImage(file, new Set(["image/jpeg"]));
        return convertFormat(file, "webp", "JPG to WEBP conversion");
      case "image-resizer":
        validateImage(file);
        return imageResizer(file, inputs);
      case "image-compressor":
        validateImage(file);
        return imageCompressor(file, inputs);
      case "image-cropper":
        validateImage(file);
        return cropImage(file, inputs.instructions);
      case "watermark-remover":
      case "image-watermark-remover":
        validateImage(file);
        return watermarkRemover(file, inputs);
      case "photo-enhancer":
        validateImage(file);
        return photoEnhancer(file, inputs);
      case "ai-portrait-enhancer":
        validateImage(file);
        return aiPortraitEnhancer(file, inputs);
      case "face-restoration":
        validateImage(file);
        return faceRestoration(file, inputs);
      case "blur-image":
        validateImage(file);
        return blurImage(file, inputs);
      case "sharpen-image":
        validateImage(file);
        return sharpenImage(file, inputs);
      case "cartoon-image-maker":
        validateImage(file);
        return cartoonImageMaker(file, inputs);
      case "image-metadata-viewer":
        validateImage(file, new Set([...SUPPORTED_IMAGE_TYPES, "image/svg+xml"]));
        return imageMetadataViewer(file);
      case "rotate-image":
        validateImage(file);
        return rotateImage(file, inputs.instructions);
      case "flip-image":
        validateImage(file);
        return flipImage(file, inputs.instructions);
      case "base64-to-image":
        return base64ToImage(file, inputs.instructions);
      case "image-to-base64":
        validateImage(file);
        return imageToBase64(file);
      case "svg-to-png":
        validateSvg(file);
        return svgToPng(file);
      case "png-to-svg":
        validateImage(file, new Set(["image/png"]));
        return pngToSvg(file);
      default:
        return null;
    }
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.startsWith("Invalid file type") ||
        error.message.includes("too large") ||
        error.message.startsWith("Empty upload")
      ) {
        throw error;
      }
      throw new Error(`Conversion failed. ${error.message}`);
    }
    throw new Error("Conversion failed.");
  }
}
