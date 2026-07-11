import type { AudioMode, StudioLayout } from "../types/media";
import { createMixedAudioStream, type MixedAudioStream } from "./mergeStreams";

interface CanvasCompositionOptions {
  layout: StudioLayout;
  screenStream: MediaStream | null;
  localCameraStream: MediaStream | null;
  microphoneStream: MediaStream | null;
  audioMode: AudioMode;
  width?: number;
  height?: number;
}

export interface CanvasComposition {
  stream: MediaStream;
  canvas: HTMLCanvasElement | null;
  mode: "direct" | "composed";
  stop: () => void;
}

interface VideoSource {
  label: string;
  video: HTMLVideoElement;
}

function getLiveVideoTrack(
  stream: MediaStream | null,
): MediaStreamTrack | null {
  return (
    stream?.getVideoTracks().find((track) => track.readyState === "live") ||
    null
  );
}

function createOutputWithAudio(
  videoTrack: MediaStreamTrack,
  mixedAudio: MixedAudioStream,
): CanvasComposition {
  const outputVideoTrack = videoTrack.clone();
  const stream = new MediaStream([outputVideoTrack]);
  mixedAudio.stream
    ?.getAudioTracks()
    .forEach((track) => stream.addTrack(track));

  return {
    stream,
    canvas: null,
    mode: "direct",
    stop: () => {
      stream.getTracks().forEach((track) => track.stop());
      mixedAudio.stop();
    },
  };
}

async function createVideoElement(
  stream: MediaStream,
): Promise<HTMLVideoElement> {
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
    drawWidth = height * sourceRatio;
    offsetX = x - (drawWidth - width) / 2;
  } else {
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

  if (sourceRatio > targetRatio) drawHeight = width / sourceRatio;
  else drawWidth = height * sourceRatio;

  context.drawImage(
    video,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
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

function drawEmptyState(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  label: string,
): void {
  context.fillStyle = "#0B1020";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#161F32";
  context.fillRect(width * 0.18, height * 0.28, width * 0.64, height * 0.44);
  context.fillStyle = "#94A3B8";
  context.font = "42px Inter, sans-serif";
  context.textAlign = "center";
  context.fillText(label, width / 2, height / 2);
}

function drawLabel(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
): void {
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

function drawGrid(
  context: CanvasRenderingContext2D,
  sources: VideoSource[],
  width: number,
  height: number,
): void {
  if (sources.length === 0) {
    drawEmptyState(context, width, height, "Add a screen or webcam");
    return;
  }

  const columns = sources.length === 1 ? 1 : 2;
  const gap = 18;
  const cellWidth = (width - gap * (columns + 1)) / columns;
  const cellHeight = height - gap * 2;

  sources.forEach((source, index) => {
    const x = gap + index * (cellWidth + gap);
    drawRoundedVideo(context, source.video, x, gap, cellWidth, cellHeight, 24);
    drawLabel(context, source.label, x + 18, gap + cellHeight - 18);
  });
}

function stopVideo(video: HTMLVideoElement | null): void {
  if (!video) return;
  video.pause();
  video.srcObject = null;
}

export async function createCanvasComposition(
  options: CanvasCompositionOptions,
): Promise<CanvasComposition> {
  const screenTrack = getLiveVideoTrack(options.screenStream);
  const cameraTrack = getLiveVideoTrack(options.localCameraStream);
  let mixedAudio: MixedAudioStream | null = null;
  let screen: VideoSource | null = null;
  let camera: VideoSource | null = null;

  try {
    mixedAudio = await createMixedAudioStream(
      [
        { stream: options.screenStream, role: "system" },
        { stream: options.microphoneStream, role: "voice" },
      ],
      options.audioMode,
    );

    if (options.layout === "screen-only") {
      if (!screenTrack)
        throw new Error(
          "Choose a browser tab, window, or screen before recording.",
        );
      return createOutputWithAudio(screenTrack, mixedAudio);
    }

    if (!screenTrack && !cameraTrack)
      throw new Error(
        "Choose a screen or enable your webcam before recording.",
      );

    const width = options.width ?? 1920;
    const height = options.height ?? 1080;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering context is unavailable.");

    if (screenTrack && options.screenStream) {
      screen = {
        label: "Screen",
        video: await createVideoElement(options.screenStream),
      };
    }

    if (cameraTrack && options.localCameraStream) {
      camera = {
        label: "Webcam",
        video: await createVideoElement(options.localCameraStream),
      };
    }

    let animationFrame = 0;
    let stopped = false;
    const render = () => {
      if (stopped) return;
      context.fillStyle = "#0B1020";
      context.fillRect(0, 0, width, height);

      try {
        if (options.layout === "camera-only") {
          if (camera) drawCover(context, camera.video, 0, 0, width, height);
          else drawEmptyState(context, width, height, "Select a webcam");
        }

        if (options.layout === "screen-bubble" || options.layout === "pip") {
          if (screen) drawContain(context, screen.video, 0, 0, width, height);
          else drawEmptyState(context, width, height, "Select a screen source");

          if (camera) {
            const bubbleWidth =
              options.layout === "pip" ? width * 0.28 : width * 0.22;
            const bubbleHeight = bubbleWidth * 0.62;
            drawRoundedVideo(
              context,
              camera.video,
              width - bubbleWidth - 54,
              height - bubbleHeight - 54,
              bubbleWidth,
              bubbleHeight,
              30,
            );
          }
        }

        if (options.layout === "screen-side") {
          const sideWidth = width * 0.3;
          if (screen)
            drawContain(context, screen.video, 0, 0, width - sideWidth, height);
          else
            drawEmptyState(
              context,
              width - sideWidth,
              height,
              "Select a screen",
            );

          if (camera) {
            drawRoundedVideo(
              context,
              camera.video,
              width - sideWidth + 24,
              24,
              sideWidth - 48,
              height - 48,
              24,
            );
            drawLabel(
              context,
              camera.label,
              width - sideWidth + 42,
              height - 42,
            );
          }
        }

        if (options.layout === "grid") {
          drawGrid(
            context,
            [screen, camera].filter((source): source is VideoSource =>
              Boolean(source),
            ),
            width,
            height,
          );
        }
      } catch {
        // A source can briefly have no decoded frame while switching or resuming.
      }

      animationFrame = requestAnimationFrame(render);
    };
    render();

    const stream = canvas.captureStream(30);
    mixedAudio.stream
      ?.getAudioTracks()
      .forEach((track) => stream.addTrack(track));

    return {
      stream,
      canvas,
      mode: "composed",
      stop: () => {
        if (stopped) return;
        stopped = true;
        cancelAnimationFrame(animationFrame);
        stream.getTracks().forEach((track) => track.stop());
        mixedAudio?.stop();
        stopVideo(screen?.video || null);
        stopVideo(camera?.video || null);
      },
    };
  } catch (error) {
    mixedAudio?.stop();
    stopVideo(screen?.video || null);
    stopVideo(camera?.video || null);
    throw error;
  }
}
