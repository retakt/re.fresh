import { useState, useRef } from "react";
import { ImageIcon, X, Loader2, Link2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Scrubber from "@/components/ui/smoothui/scrubber";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  position?: string;
  onPositionChange?: (pos: string) => void;
  opacity?: number;
  onOpacityChange?: (opacity: number) => void;
  label?: string;
}

export default function ImageUpload({
  value,
  onChange,
  position = "50% 50%",
  onPositionChange,
  opacity = 1,
  onOpacityChange,
  label = "Cover image",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [px, py] = position.split(" ").map(parseFloat);
  const posX = isNaN(px) ? 50 : px;
  const posY = isNaN(py) ? 50 : py;

  const optimizeImage = (file: File): Promise<File> =>
    new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200, maxHeight = 800;
        let { width, height } = img;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        if (height > maxHeight) { width = (width * maxHeight) / height; height = maxHeight; }
        canvas.width = width; canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], file.name, { type: "image/webp", lastModified: Date.now() }) : file),
          "image/webp", 0.85
        );
      };
      img.src = URL.createObjectURL(file);
    });

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    setUploading(true);
    try {
      const optimized = await optimizeImage(file);
      const ext = optimized.name.split(".").pop();
      const path = `images/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, optimized, { cacheControl: "3600", upsert: false });
      if (error) { toast.error("Upload failed"); return; }
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Failed to process image");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadImage(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 text-xs">
        <button type="button" onClick={() => setMode("upload")}
          className={cn("px-2 py-1 rounded-md transition-colors", mode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
          Upload
        </button>
        <button type="button" onClick={() => setMode("url")}
          className={cn("px-2 py-1 rounded-md transition-colors", mode === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
          URL
        </button>
      </div>

      {mode === "url" ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://example.com/image.jpg" className="pl-8" />
          </div>
          {value && (
            <button type="button" onClick={() => onChange("")} className="p-2 rounded-md hover:bg-muted text-muted-foreground">
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !value && inputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-xl overflow-hidden transition-all",
            value ? "border-transparent cursor-default" : "cursor-pointer p-6 text-center",
            dragging && !value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
        >
          <input ref={inputRef} type="file" accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
            className="hidden" />

          {value ? (
            <div className="space-y-2 p-1">
              {/* Preview */}
              <div className="relative rounded-lg overflow-hidden h-40">
                <img src={value} alt="Cover" className="w-full h-full object-cover"
                  style={{ objectPosition: `${posX}% ${posY}%`, opacity }} />
                {/* Focal point dot */}
                {onPositionChange && (
                  <div className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-md bg-primary pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all"
                    style={{ left: `${posX}%`, top: `${posY}%` }} />
                )}
              </div>

              {/* Scrubbers */}
              <div className="space-y-1.5">
                {onOpacityChange && (
                  <Scrubber
                    label="Opacity"
                    value={opacity}
                    min={0.1}
                    max={1}
                    step={0.01}
                    decimals={2}
                    ticks={9}
                    onValueChange={onOpacityChange}
                  />
                )}
                {onPositionChange && (
                  <>
                    <Scrubber
                      label="Left / Right"
                      value={posX}
                      min={0}
                      max={100}
                      step={1}
                      decimals={0}
                      ticks={9}
                      onValueChange={(v) => onPositionChange(`${v}% ${posY}%`)}
                    />
                    <Scrubber
                      label="Top / Bottom"
                      value={posY}
                      min={0}
                      max={100}
                      step={1}
                      decimals={0}
                      ticks={9}
                      onValueChange={(v) => onPositionChange(`${posX}% ${v}%`)}
                    />
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => inputRef.current?.click()}
                  className="px-3 py-1.5 bg-secondary text-foreground text-xs font-medium rounded-md hover:bg-secondary/80 transition-colors">
                  Change
                </button>
                <button type="button" onClick={() => onChange("")}
                  className="px-3 py-1.5 text-muted-foreground text-xs font-medium rounded-md hover:bg-secondary/80 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ) : uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon size={24} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Drag & drop or click</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
