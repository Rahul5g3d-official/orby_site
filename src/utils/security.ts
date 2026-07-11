const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function isLocalHost(hostname = window.location.hostname): boolean {
  return LOCAL_HOSTS.has(hostname);
}

export function isInsecureNetworkOrigin(): boolean {
  return !window.isSecureContext && !isLocalHost();
}

export function getSecureContextMessage(): string {
  return "Use HTTPS for network testing. Browsers block camera, microphone, and screen capture access on insecure network origins.";
}
