const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const ROOM_ID_PATTERN = /^[A-Z2-9]{6,16}$/;

export function isLocalHost(hostname = window.location.hostname): boolean {
  return LOCAL_HOSTS.has(hostname);
}

export function isInsecureNetworkOrigin(): boolean {
  return !window.isSecureContext && !isLocalHost();
}

export function normalizeRoomId(roomId: string | undefined): string {
  return (roomId || "").trim().toUpperCase();
}

export function isValidRoomId(roomId: string): boolean {
  return ROOM_ID_PATTERN.test(roomId);
}

export function getSecureContextMessage(): string {
  return "Use HTTPS for network testing. Browsers block camera, microphone, screen capture, and phone camera access on insecure LAN URLs.";
}
