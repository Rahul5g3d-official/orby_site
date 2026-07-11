import type { MediaDeviceOption } from "../types/media";

export function supportsRecordingApis(): boolean {
  return Boolean(
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof navigator.mediaDevices?.getDisplayMedia === "function" &&
    typeof window.MediaRecorder === "function" &&
    typeof window.MediaStream === "function" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function",
  );
}

export async function listMediaDevices(): Promise<MediaDeviceOption[]> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter(
      (device) => device.kind === "audioinput" || device.kind === "videoinput",
    )
    .map((device, index) => ({
      deviceId: device.deviceId,
      kind: device.kind,
      label:
        device.label ||
        `${device.kind === "videoinput" ? "Camera" : "Microphone"} ${index + 1}`,
    }));
}

export async function requestCamera(
  deviceId?: string,
  facingMode?: VideoFacingModeEnum,
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: facingMode || "user" },
    audio: false,
  });
}

export async function requestMicrophone(
  deviceId?: string,
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: deviceId
      ? {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      : {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
    video: false,
  });
}

export async function requestScreen(): Promise<MediaStream> {
  type DisplayAudioConstraints = MediaTrackConstraints & {
    suppressLocalAudioPlayback?: boolean;
  };
  type ExtendedDisplayMediaOptions = Omit<
    DisplayMediaStreamOptions,
    "audio"
  > & {
    audio?: boolean | DisplayAudioConstraints;
    surfaceSwitching?: "include" | "exclude";
    systemAudio?: "include" | "exclude";
  };

  const options: ExtendedDisplayMediaOptions = {
    video: {
      displaySurface: "browser",
      frameRate: { ideal: 30, max: 60 },
    },
    audio: {
      autoGainControl: false,
      echoCancellation: false,
      noiseSuppression: false,
      suppressLocalAudioPlayback: false,
    },
    surfaceSwitching: "include",
    systemAudio: "include",
  };

  return navigator.mediaDevices.getDisplayMedia(options);
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function getMediaErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError")
      return "Permission was denied. Enable access and try again.";
    if (error.name === "NotFoundError")
      return "No matching media device was found.";
    if (error.name === "NotReadableError")
      return "The media device is already in use by another app.";
    if (error.name === "AbortError")
      return "The browser cancelled the media request.";
  }

  if (error instanceof Error) return error.message;
  return fallback;
}
