import type { AudioMode, RemoteCamera, StudioLayout } from "../types/media";
import { createMixedAudioStream } from "./mergeStreams";

interface CanvasCompositionOptions {
  layout: StudioLayout;
  screenStream: MediaStream | null;
  localCameraStream: MediaStream | null;
  microphoneStream: MediaStream | null;
  remoteCameraStreams: RemoteCamera[];
  audioMode: AudioMode;
  width?: number;
  height?: number;
}

export interface CanvasComposition {
  stream: MediaStream;
  canvas: HTMLCanvasElement;
  stop: () => void;
}

interface VideoSource {
  id: string;
  label: string;
  stream: MediaStream;
  video: HTMLVideoElement;
}

function hasLiveVideo(stream: MediaStream | null): stream is MediaStream {
  return Boolean(stream?.getVideoTracks().some((track) => track.readyState === "live"));
}

async function createVideoElement(stream: MediaStream): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  await video.play().catch(() => undefined);
  return video;
}

function drawCover(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const sourceWidth = video.videoWidth || width;
  const sourceHeight = video.videoHeight || height;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  let offsetX = x;
  let offsetY = y;

  if (sourceRatio > targetRatio) {
    drawHeight = height;
    drawWidth = height * sourceRatio;
    offsetX = x - (drawWidth - width) / 2;
  } else {
    drawWidth = width;
    drawHeight = width / sourceRatio;
    offsetY = y - (drawHeight - height) / 2;
  }

  context.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
}

function drawContain(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const sourceWidth = video.videoWidth || width;
  const sourceHeight = video.videoHeight || height;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;

  if (sourceRatio > targetRatio) {
    drawHeight = width / sourceRatio;
  } else {
    drawWidth = height * sourceRatio;
  }

  context.drawImage(video, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function drawRoundedVideo(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.save();
  roundedRect(context, x, y, width, height, radius);
  context.clip();
  drawCover(context, video, x, y, width, height);
  context.restore();
  context.strokeStyle = "rgba(248, 250, 252, 0.48)";
  context.lineWidth = 3;
  roundedRect(context, x, y, width, height, radius);
  context.stroke();
}

function drawEmptyState(context: CanvasRenderingContext2D, width: number, height: number, label: string): void {
  context.fillStyle = "#0B1020";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#161F32";
  context.fillRect(width * 0.18, height * 0.28, width * 0.64, height * 0.44);
  context.fillStyle = "#94A3B8";
  context.font = "42px Inter, sans-serif";
  context.textAlign = "center";
  context.fillText(label, width / 2, height / 2);
}

function drawLabel(context: CanvasRenderingContext2D, label: string, x: number, y: number): void {
  context.save();
  context.font = "24px Inter, sans-serif";
  const metrics = context.measureText(label);
  const padding = 14;
  context.fillStyle = "rgba(11, 16, 32, 0.72)";
  roundedRect(context, x, y - 34, metrics.width + padding * 2, 42, 12);
  context.fill();
  context.fillStyle = "#F8FAFC";
  context.fillText(label, x + padding, y - 5);
  context.restore();
}

function drawGrid(context: CanvasRenderingContext2D, sources: VideoSource[], width: number, height: number): void {
  if (sources.length === 0) {
    drawEmptyState(context, width, height, "Add a screen or camera");
    return;
  }

  const columns = Math.ceil(Math.sqrt(sources.length));
  const rows = Math.ceil(sources.length / columns);
  const gap = 18;
  const cellWidth = (width - gap * (columns + 1)) / columns;
  const cellHeight = (height - gap * (rows + 1)) / rows;

  sources.forEach((source, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = gap + column * (cellWidth + gap);
    const y = gap + row * (cellHeight + gap);
    drawRoundedVideo(context, source.video, x, y, cellWidth, cellHeight, 24);
    drawLabel(context, source.label, x + 18, y + cellHeight - 18);
  });
}

export async function createCanvasComposition(options: CanvasCompositionOptions): Promise<CanvasComposition> {
  const width = options.width ?? 1920;
  const height = options.height ?? 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas rendering context is unavailable.");
  }

  const screen = hasLiveVideo(options.screenStream)
    ? {
        id: "screen",
        label: "Screen",
        stream: options.screenStream,
        video: await createVideoElement(options.screenStream),
      }
    : null;

  const cameras: VideoSource[] = [];

  if (hasLiveVideo(options.localCameraStream)) {
    cameras.push({
      id: "local-camera",
      label: "Webcam",
      stream: options.localCameraStream,
      video: await createVideoElement(options.localCameraStream),
    });
  }

  for (const remote of options.remoteCameraStreams) {
    if (hasLiveVideo(remote.stream)) {
      cameras.push({
        id: remote.peerId,
        label: remote.label,
        stream: remote.stream,
        video: await createVideoElement(remote.stream),
      });
    }
  }

  const mixedAudio = await createMixedAudioStream(
    [
      { stream: options.screenStream, role: "system" },
      { stream: options.microphoneStream, role: "voice" },
      ...options.remoteCameraStreams.map((camera) => ({ stream: camera.stream, role: "voice" as const })),
    ],
    options.audioMode,
  );

  let animationFrame = 0;

  const render = () => {
    context.fillStyle = "#0B1020";
    context.fillRect(0, 0, width, height);

    const primaryCamera = cameras[0];

    if (options.layout === "screen-only") {
      if (screen) drawContain(context, screen.video, 0, 0, width, height);
      else drawEmptyState(context, width, height, "Select a screen source");
    }

    if (options.layout === "camera-only") {
      if (primaryCamera) drawCover(context, primaryCamera.video, 0, 0, width, height);
      else drawEmptyState(context, width, height, "Select a camera");
    }

    if (options.layout === "screen-bubble" || options.layout === "pip") {
      if (screen) drawContain(context, screen.video, 0, 0, width, height);
      else drawEmptyState(context, width, height, "Select a screen source");

      if (primaryCamera) {
        const bubbleWidth = options.layout === "pip" ? width * 0.28 : width * 0.22;
        const bubbleHeight = bubbleWidth * 0.62;
        drawRoundedVideo(
          context,
          primaryCamera.video,
          width - bubbleWidth - 54,
          height - bubbleHeight - 54,
          bubbleWidth,
          bubbleHeight,
          30,
        );
      }
    }

    if (options.layout === "screen-side") {
      const sideWidth = width * 0.28;
      if (screen) drawContain(context, screen.video, 0, 0, width - sideWidth, height);
      else drawEmptyState(context, width - sideWidth, height, "Select a screen");

      const cameraHeight = (height - 72) / Math.max(1, Math.min(cameras.length, 3));
      cameras.slice(0, 3).forEach((camera, index) => {
        const y = 24 + index * (cameraHeight + 12);
        drawRoundedVideo(context, camera.video, width - sideWidth + 24, y, sideWidth - 48, cameraHeight, 24);
        drawLabel(context, camera.label, width - sideWidth + 42, y + cameraHeight - 18);
      });
    }

    if (options.layout === "grid") {
      drawGrid(context, [screen, ...cameras].filter((source): source is VideoSource => Boolean(source)), width, height);
    }

    if (options.layout === "custom") {
      if (screen) drawContain(context, screen.video, 0, 0, width, height);
      else drawEmptyState(context, width, height, "Custom layout placeholder");

      cameras.slice(0, 2).forEach((camera, index) => {
        const cardWidth = width * 0.22;
        const cardHeight = cardWidth * 0.62;
        drawRoundedVideo(context, camera.video, 48, 48 + index * (cardHeight + 24), cardWidth, cardHeight, 24);
        drawLabel(context, camera.label, 70, 48 + index * (cardHeight + 24) + cardHeight - 18);
      });

      context.fillStyle = "rgba(99, 102, 241, 0.7)";
      context.font = "28px Inter, sans-serif";
      context.fillText("Custom layout placeholder", 64, height - 64);
    }

    animationFrame = requestAnimationFrame(render);
  };

  render();

  const stream = canvas.captureStream(30);
  mixedAudio.stream?.getAudioTracks().forEach((track) => stream.addTrack(track));

  return {
    stream,
    canvas,
    stop: () => {
      cancelAnimationFrame(animationFrame);
      stream.getTracks().forEach((track) => track.stop());
      mixedAudio.stop();
      [screen, ...cameras].forEach((source) => {
        if (!source) return;
        source.video.pause();
        source.video.srcObject = null;
      });
    },
  };
}
