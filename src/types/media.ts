export type StudioLayout =
  | "screen-only"
  | "camera-only"
  | "screen-bubble"
  | "screen-side"
  | "grid"
  | "pip"
  | "custom";

export type AudioMode = "natural" | "voice-boost" | "noise-reduced" | "broadcast" | "warm";

export interface LayoutOption {
  id: StudioLayout;
  name: string;
  description: string;
}

export interface AudioModeOption {
  id: AudioMode;
  name: string;
  description: string;
}

export interface MediaDeviceOption {
  deviceId: string;
  groupId: string;
  kind: MediaDeviceKind;
  label: string;
}

export interface RemoteCamera {
  peerId: string;
  label: string;
  stream: MediaStream;
  status: "connecting" | "connected" | "disconnected";
}

export interface MediaError {
  source: "camera" | "microphone" | "screen" | "recorder" | "webrtc" | "storage";
  message: string;
}
