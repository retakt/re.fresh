import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  FolderOpen, Download, Plus,
  FileText, FileImage, FileAudio, FileVideo, File
} from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { supabase } from "@/lib/supabase";
import type { FileItem } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

function fileIcon(type?: string | null) {
  if (!type) return File;
  if (type.startsWith("image/")) return FileImage;
  if (type.startsWith("audio/")) return FileAudio;
  if (type.startsWith("video/")) return FileVideo;
  if (type.includes("pdf") || type.includes("text")) return FileText;
  return File;
}

function FileCard({ file }: { file: FileItem }) {
  const Icon = fileIcon(file.file_type);
  return (
    <div className="group flex items-start gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-sm">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
        <Icon size={18} className="text-violet-400" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{file.name}</span>
          <div className="flex items-center gap-1 shrink-0">
            {file.file_size && (
              <span className="text-xs text-muted-foreground">{file.file_size}</span>
            )}
            {file.file_url && (
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Download"
              >
                <Download size={13} />
              </a>
            )}
          </div>
        </div>
        {file.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{file.description}</p>
        )}
        {file.category && (
          <Badge variant="secondary" className="text-xs py-0 px-2">
            {file.category}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchFiles = async () => {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!error && data) setFiles(data);
      setLoading(false);
    };

    fetchFiles();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Files</h1>
          <p className="text-sm text-muted-foreground mt-1">Downloads & resources</p>
        </div>
        {isAdmin && (
          <Link to="/admin/files">
            <Button size="sm" className="gap-1.5">
              <Plus size={14} /> Add file
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><FolderOpen /></EmptyMedia>
            <EmptyTitle>No files yet</EmptyTitle>
            <EmptyDescription>Downloads and resources will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
