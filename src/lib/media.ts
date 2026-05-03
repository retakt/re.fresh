import { supabase } from "@/lib/supabase";

export type UploadedAsset = {
  url: string;
  path: string;
  name: string;
  mimeType: string;
  size: number;
};

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export function isImageFile(file: File) {
  return file.type.startsWith("image/") || IMAGE_TYPES.has(file.type);
}

export function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}

export async function uploadPublicAsset(file: File, folder: string) {
  const uploadFile = isImageFile(file) ? await optimizeImage(file) : file;
  const extension = getFileExtension(uploadFile);
  const safeName = file.name.replace(/[^\w.\-]+/g, "-").toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}${extension ? `.${extension}` : ""}`;

  const { error } = await supabase.storage
    .from("uploads")
    .upload(path, uploadFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: uploadFile.type || file.type,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("uploads").getPublicUrl(path);

  return {
    url: data.publicUrl,
    path,
    name: file.name,
    mimeType: uploadFile.type || file.type || "application/octet-stream",
    size: uploadFile.size,
  } satisfies UploadedAsset;
}

export function getFileExtension(file: File) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? "" : "";
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function createYouTubeEmbedUrl(url: string) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i,
    /youtube\.com\/embed\/([\w-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  return null;
}

export function createVimeoEmbedUrl(url: string) {
  const match = url.match(/vimeo\.com\/(\d+)/i);
  if (match?.[1]) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }

  return null;
}

export function normalizeEmbedUrl(input: string) {
  const trimmed = input.trim();
  return createYouTubeEmbedUrl(trimmed) ?? createVimeoEmbedUrl(trimmed) ?? trimmed;
}

function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const image = new Image();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      resolve(file);
      return;
    }

    image.onload = () => {
      const maxWidth = 1600;
      const maxHeight = 1400;
      let { width, height } = image;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
              type: "image/webp",
              lastModified: Date.now(),
            }),
          );
        },
        "image/webp",
        0.88,
      );
    };

    image.onerror = () => resolve(file);
    image.src = URL.createObjectURL(file);
  });
}
