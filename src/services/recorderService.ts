const MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=h264,opus",
  "video/webm",
];

export function getSupportedRecorderMimeType(): string {
  return MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
}

export function createMediaRecorder(stream: MediaStream): MediaRecorder {
  const mimeType = getSupportedRecorderMimeType();
  return new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
}

export function buildRecordingFilename(createdAt = new Date()): string {
  const date = createdAt.toISOString().slice(0, 10);
  return `screen-recording-${date}.webm`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
