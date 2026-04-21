import { useState, useRef } from "react";
import { ImageIcon, X, Loader2, Link2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = "Cover image" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `images/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("uploads")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    onChange(data.publicUrl);
    toast.success("Image uploaded!");
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadImage(file);
  };

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-1 text-xs">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "px-2 py-1 rounded-md transition-colors",
            mode === "upload"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={cn(
            "px-2 py-1 rounded-md transition-colors",
            mode === "url"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          URL
        </button>
      </div>

      {mode === "url" ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="pl-8"
            />
          </div>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground"
            >
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
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
            className="hidden"
          />

          {value ? (
            <div className="relative group">
              <img
                src={value}
                alt="Cover"
                className="w-full h-40 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="px-3 py-1.5 bg-white text-black text-xs font-medium rounded-md"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="px-3 py-1.5 bg-white/20 text-white text-xs font-medium rounded-md"
                >
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