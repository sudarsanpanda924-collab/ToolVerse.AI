import "server-only";

import sharp from "sharp";

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

async function watermarkRemover(file: UploadedFile) {
  const buffer = await sharp(file.buffer)
    .rotate()
    .median(3)
    .normalize()
    .png({ compressionLevel: 9 })
    .toBuffer();

  return outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Image watermark cleanup",
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

async function blurImage(file: UploadedFile, instructions?: string) {
  const sigma = Math.max(0.3, Math.min(Number(instructions?.match(/\b(\d{1,2})(?:px)?\b/)?.[1] || 5), 20));
  const buffer = await sharp(file.buffer).rotate().blur(sigma).png({ compressionLevel: 9 }).toBuffer();

  return outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Image blur",
  });
}

async function sharpenImage(file: UploadedFile) {
  const buffer = await sharp(file.buffer).rotate().sharpen().png({ compressionLevel: 9 }).toBuffer();

  return outputResult(file, {
    buffer,
    extension: "png",
    mimeType: "image/png",
    label: "Image sharpen",
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

export async function runImageConversionTool(slug: string, inputs: ToolInputs) {
  const file = getUpload(inputs);

  try {
    switch (slug) {
      case "jpg-to-png-converter":
        validateImage(file, new Set(["image/jpeg"]));
        return convertFormat(file, "png", "JPG to PNG conversion");
      case "png-to-jpg-converter":
        validateImage(file, new Set(["image/png"]));
        return convertFormat(file, "jpeg", "PNG to JPG conversion");
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
        return resizeImage(file, inputs.instructions);
      case "image-compressor":
        validateImage(file);
        return compressImage(file);
      case "image-cropper":
        validateImage(file);
        return cropImage(file, inputs.instructions);
      case "background-remover":
        validateImage(file);
        return removeBackground(file, inputs.instructions);
      case "image-watermark-remover":
        validateImage(file);
        return watermarkRemover(file);
      case "image-metadata-viewer":
        validateImage(file, new Set([...SUPPORTED_IMAGE_TYPES, "image/svg+xml"]));
        return imageMetadataViewer(file);
      case "rotate-image":
        validateImage(file);
        return rotateImage(file, inputs.instructions);
      case "flip-image":
        validateImage(file);
        return flipImage(file, inputs.instructions);
      case "blur-image":
        validateImage(file);
        return blurImage(file, inputs.instructions);
      case "sharpen-image":
        validateImage(file);
        return sharpenImage(file);
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
