// YouTube URL utilities

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    
    // For youtu.be short links
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split('/')[0].split('?')[0];
    }
    
    // For youtube.com watch URLs
    if (u.hostname.includes("youtube.com")) {
      const videoId = u.searchParams.get("v");
      if (videoId) return videoId;
      
      // For /embed/ URLs
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/")[2].split('?')[0];
      }
      
      // For /v/ URLs
      if (u.pathname.startsWith("/v/")) {
        return u.pathname.split("/")[2].split('?')[0];
      }
      
      // For /shorts/ URLs
      if (u.pathname.startsWith("/shorts/")) {
        return u.pathname.split("/")[2].split('?')[0];
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract playlist ID from YouTube URL
 */
export function extractYouTubePlaylistId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("list");
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Normalize YouTube URL to standard format
 * Converts any YouTube URL to: https://www.youtube.com/watch?v=VIDEO_ID
 * Strips all extra parameters except video ID (and optionally playlist for future use)
 */
export function normalizeYouTubeUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  
  // For now, only return video URL (strip playlist, start_radio, pp, etc.)
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  
  // Handle playlist-only URLs (for future implementation)
  const playlistId = extractYouTubePlaylistId(url);
  if (playlistId && !videoId) {
    return `https://www.youtube.com/playlist?list=${playlistId}`;
  }
  
  return null;
}

/**
 * Validate if URL is from YouTube
 */
export function isValidYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      u.hostname === "youtube.com" ||
      u.hostname === "www.youtube.com" ||
      u.hostname === "youtu.be" ||
      u.hostname === "m.youtube.com" ||
      u.hostname === "music.youtube.com"
    );
  } catch {
    return false;
  }
}

/**
 * Get video type from URL
 */
export function getYouTubeUrlType(url: string): "video" | "playlist" | "channel" | "unknown" {
  try {
    const u = new URL(url.trim());
    
    if (u.searchParams.has("v")) return "video";
    if (u.searchParams.has("list")) return "playlist";
    if (u.pathname.includes("/channel/") || u.pathname.includes("/@")) return "channel";
    if (u.hostname === "youtu.be") return "video";
    if (u.pathname.startsWith("/shorts/")) return "video";
    if (u.pathname.startsWith("/embed/")) return "video";
    
    return "unknown";
  } catch {
    return "unknown";
  }
}
