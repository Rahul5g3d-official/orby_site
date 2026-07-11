export type RecordingStatus = "idle" | "recording" | "paused" | "stopped" | "error";

export interface StoredRecording {
  id: string;
  name: string;
  createdAt: string;
  durationMs: number;
  size: number;
  blob: Blob;
}

export interface RecorderResult {
  blob: Blob;
  url: string;
  durationMs: number;
}
