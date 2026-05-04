// API client for backend communication

import type { DownloadRequest, DownloadResponse } from "./settings";

// Use relative URL in production, localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === "production" ? "/api" : "http://localhost:3000/api");

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        error.message || "Request failed",
        response.status,
        error.code
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Network error", 0);
  }
}

// Start a download
export async function startDownload(
  request: DownloadRequest
): Promise<DownloadResponse> {
  return fetchAPI<DownloadResponse>("/download", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Get download status
export async function getDownloadStatus(
  id: string
): Promise<DownloadResponse> {
  return fetchAPI<DownloadResponse>(`/download/${id}`);
}

// Cancel a download
export async function cancelDownload(id: string): Promise<void> {
  return fetchAPI<void>(`/download/${id}`, {
    method: "DELETE",
  });
}

// Get download file URL
export function getDownloadFileUrl(id: string): string {
  return `${API_BASE_URL}/download/${id}/file`;
}

// WebSocket connection for real-time progress updates
export function connectDownloadWebSocket(
  id: string,
  onProgress: (data: DownloadResponse) => void,
  onError?: (error: Error) => void
): () => void {
  const wsUrl = API_BASE_URL.replace("http", "ws");
  const ws = new WebSocket(`${wsUrl}/download/${id}/ws`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onProgress(data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  ws.onerror = (event) => {
    onError?.(new Error("WebSocket error"));
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed");
  };

  // Return cleanup function
  return () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };
}
