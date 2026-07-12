const MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=h264,opus",
  "video/webm",
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4",
];

export function getSupportedRecorderMimeType(): string {
  return (
    MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || ""
  );
}

export function createMediaRecorder(stream: MediaStream): MediaRecorder {
  const mimeType = getSupportedRecorderMimeType();
  return new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
}

export function buildRecordingFilename(
  createdAt = new Date(),
  mimeType = "video/webm",
): string {
  const date = createdAt.toISOString().slice(0, 10);
  const extension = mimeType.includes("mp4") ? "mp4" : "webm";
  return `screen-recording-${date}.${extension}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
