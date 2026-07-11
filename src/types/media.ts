export type StudioLayout =
  | "screen-only"
  | "camera-only"
  | "screen-bubble"
  | "screen-side"
  | "grid"
  | "pip";

export type AudioMode =
  "natural" | "voice-boost" | "noise-reduced" | "broadcast" | "warm";

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
  kind: MediaDeviceKind;
  label: string;
}
