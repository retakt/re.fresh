// Settings types and utilities for backend integration

export type VideoQuality = "max" | "2160" | "1440" | "1080" | "720" | "480" | "360" | "240" | "144";
export type VideoCodec = "h264" | "av1" | "vp9";
export type AudioFormat = "best" | "mp3" | "opus" | "ogg" | "wav";
export type FileContainer = "auto" | "mp4" | "webm" | "mkv";
export type DownloadMode = "auto" | "audio" | "mute";

export interface DownloadSettings {
  videoQuality: VideoQuality;
  videoCodec: VideoCodec;
  audioFormat: AudioFormat;
  fileContainer: FileContainer;
  filenamePattern: string;
  audioQuality: string;
  embedThumbnail: boolean;
  embedMetadata: boolean;
  embedSubtitles: boolean;
  downloadSubtitles: boolean;
  subtitleLang: string;
}

export interface DownloadRequest {
  url: string;
  mode: DownloadMode;
  settings: DownloadSettings;
}

export interface DownloadResponse {
  id: string;
  status: "pending" | "downloading" | "completed" | "error";
  progress: number;
  title?: string;
  thumbnail?: string;
  error?: string;
  downloadUrl?: string;
}

// Convert frontend settings to yt-dlp command arguments
export function settingsToYtDlpArgs(settings: DownloadSettings, mode: DownloadMode): string[] {
  const args: string[] = [];

  // Video quality
  if (mode !== "audio") {
    if (settings.videoQuality === "max") {
      args.push("-f", "bestvideo+bestaudio/best");
    } else {
      const height = settings.videoQuality;
      args.push("-f", `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`);
    }
  }

  // Audio only mode
  if (mode === "audio") {
    args.push("-x"); // Extract audio
    if (settings.audioFormat !== "best") {
      args.push("--audio-format", settings.audioFormat);
    }
    args.push("--audio-quality", settings.audioQuality + "K");
  }

  // Mute mode (video without audio)
  if (mode === "mute") {
    args.push("-f", "bestvideo");
  }

  // Video codec preference
  if (mode === "auto") {
    switch (settings.videoCodec) {
      case "h264":
        args.push("--format-sort", "vcodec:h264,acodec:aac");
        break;
      case "av1":
        args.push("--format-sort", "vcodec:av01,acodec:opus");
        break;
      case "vp9":
        args.push("--format-sort", "vcodec:vp9,acodec:opus");
        break;
    }
  }

  // Container format
  if (settings.fileContainer !== "auto") {
    args.push("--merge-output-format", settings.fileContainer);
  }

  // Filename pattern
  if (settings.filenamePattern) {
    args.push("-o", settings.filenamePattern + ".%(ext)s");
  }

  // Embed thumbnail
  if (settings.embedThumbnail) {
    args.push("--embed-thumbnail");
  }

  // Embed metadata
  if (settings.embedMetadata) {
    args.push("--embed-metadata");
  }

  // Subtitles
  if (settings.downloadSubtitles) {
    args.push("--write-subs");
    if (settings.subtitleLang) {
      args.push("--sub-langs", settings.subtitleLang);
    }
  }

  if (settings.embedSubtitles) {
    args.push("--embed-subs");
  }

  return args;
}

// Get settings from localStorage
export function getStoredSettings(): DownloadSettings {
  const SETTINGS_KEY = "yt-downloader-settings";
  const defaultSettings: DownloadSettings = {
    videoQuality: "1080",
    videoCodec: "h264",
    audioFormat: "mp3",
    fileContainer: "auto",
    filenamePattern: "%(title)s",
    audioQuality: "192",
    embedThumbnail: true,
    embedMetadata: true,
    embedSubtitles: false,
    downloadSubtitles: false,
    subtitleLang: "en",
  };

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}
