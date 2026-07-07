import type { SignalMessage, SignalRole, SignalType } from "../types/webrtc";

type MessageHandler = (message: SignalMessage) => void;
type StatusHandler = (status: SignalingStatus) => void;

export type SignalingStatus = "idle" | "connecting" | "connected" | "error" | "closed";

interface SignalingClientOptions {
  roomId: string;
  peerId: string;
  role: SignalRole;
  url?: string;
}

export function inferSignalingUrl(): string {
  if (import.meta.env.VITE_SIGNALING_URL) {
    return import.meta.env.VITE_SIGNALING_URL;
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/signaling`;
}

function buildConnectionError(url: string): Error {
  return new Error(
    [
      `Unable to connect to signaling server at ${url}.`,
      "Open the exact HTTPS Network URL printed by Vite on both devices, accept the local certificate warning, keep both devices on the same Wi-Fi, and make sure the port is not blocked by firewall or another dev server.",
    ].join(" "),
  );
}

export class SignalingClient {
  private socket: WebSocket | null = null;
  private readonly messageHandlers = new Set<MessageHandler>();
  private readonly statusHandlers = new Set<StatusHandler>();
  private status: SignalingStatus = "idle";
  private readonly url: string;
  private readonly roomId: string;
  private readonly peerId: string;
  private readonly role: SignalRole;

  constructor(options: SignalingClientOptions) {
    this.roomId = options.roomId;
    this.peerId = options.peerId;
    this.role = options.role;
    this.url = options.url || inferSignalingUrl();
  }

  connect(): Promise<void> {
    this.setStatus("connecting");

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.url);
      this.socket = socket;

      socket.onopen = () => {
        this.setStatus("connected");
        this.send("join", { role: this.role });
        resolve();
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as SignalMessage;
          this.messageHandlers.forEach((handler) => handler(message));
        } catch {
          this.messageHandlers.forEach((handler) =>
            handler({
              type: "error",
              roomId: this.roomId,
              from: "client",
              payload: { message: "Invalid signaling message received." },
            }),
          );
        }
      };

      socket.onerror = () => {
        this.setStatus("error");
        reject(buildConnectionError(this.url));
      };

      socket.onclose = () => {
        if (this.status !== "error") {
          this.setStatus("closed");
        }
      };
    });
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.status);
    return () => this.statusHandlers.delete(handler);
  }

  send<TPayload>(type: SignalType, payload?: TPayload, to?: string): void {
    const message: SignalMessage<TPayload> = {
      type,
      roomId: this.roomId,
      from: this.peerId,
      to,
      role: this.role,
      payload,
    };

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    this.send("leave");
    this.socket?.close();
    this.socket = null;
    this.setStatus("closed");
  }

  private setStatus(status: SignalingStatus): void {
    this.status = status;
    this.statusHandlers.forEach((handler) => handler(status));
  }
}
