import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { WebSocket, WebSocketServer } from "ws";
import type { Plugin } from "vite";

interface SignalMessage {
  type?: string;
  roomId?: string;
  from?: string;
  to?: string;
  role?: string;
  payload?: unknown;
}

const SIGNAL_TYPES = new Set([
  "join",
  "offer",
  "answer",
  "ice-candidate",
  "leave",
]);
const ROLE_TYPES = new Set(["studio", "phone"]);
const ROOM_ID_PATTERN = /^[A-Z2-9]{6,16}$/;
const PEER_ID_PATTERN = /^(studio|phone)-[a-z2-9]{10}$/;

type PeerSocket = WebSocket & {
  peerId?: string;
  roomId?: string;
};

function isValidSignalMessage(message: SignalMessage): message is Required<Pick<SignalMessage, "type" | "roomId" | "from">> & SignalMessage {
  return Boolean(
    message.type &&
      SIGNAL_TYPES.has(message.type) &&
      message.roomId &&
      ROOM_ID_PATTERN.test(message.roomId) &&
      message.from &&
      PEER_ID_PATTERN.test(message.from) &&
      (!message.role || ROLE_TYPES.has(message.role)) &&
      (!message.to || PEER_ID_PATTERN.test(message.to)),
  );
}

function createMulticamSignalingPlugin(): Plugin {
  const wss = new WebSocketServer({ noServer: true });
  const rooms = new Map<string, Map<string, PeerSocket>>();

  function send(socket: WebSocket, message: SignalMessage): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  function getRoom(roomId: string): Map<string, PeerSocket> {
    const existing = rooms.get(roomId);
    if (existing) return existing;

    const room = new Map<string, PeerSocket>();
    rooms.set(roomId, room);
    return room;
  }

  function broadcast(roomId: string, message: SignalMessage, exceptPeerId?: string): void {
    const room = rooms.get(roomId);
    if (!room) return;

    for (const [peerId, socket] of room.entries()) {
      if (peerId !== exceptPeerId && (!message.to || message.to === peerId)) {
        send(socket, message);
      }
    }
  }

  function removePeer(socket: PeerSocket): void {
    if (!socket.roomId || !socket.peerId) return;

    const room = rooms.get(socket.roomId);
    if (!room) return;

    room.delete(socket.peerId);
    broadcast(socket.roomId, {
      type: "peer-left",
      roomId: socket.roomId,
      from: socket.peerId,
    });

    if (room.size === 0) {
      rooms.delete(socket.roomId);
    }
  }

  wss.on("connection", (socket) => {
    const peerSocket = socket as PeerSocket;

    peerSocket.on("message", (raw) => {
      let message: SignalMessage;

      try {
        message = JSON.parse(raw.toString()) as SignalMessage;
      } catch {
        send(peerSocket, { type: "error", payload: { message: "Invalid JSON" } });
        return;
      }

      if (!isValidSignalMessage(message)) {
        send(peerSocket, {
          type: "error",
          payload: { message: "Invalid signaling message" },
        });
        return;
      }

      if (message.type === "join") {
        if (peerSocket.peerId && peerSocket.peerId !== message.from) {
          send(peerSocket, {
            type: "error",
            payload: { message: "Peer identity cannot change after joining" },
          });
          return;
        }

        peerSocket.peerId = message.from;
        peerSocket.roomId = message.roomId;
        const room = getRoom(message.roomId);
        room.set(message.from, peerSocket);
        send(peerSocket, {
          type: "joined",
          roomId: message.roomId,
          from: "server",
          payload: {
            peers: [...room.keys()].filter((peerId) => peerId !== message.from),
          },
        });
        broadcast(message.roomId, { ...message, type: "peer-joined" }, message.from);
        return;
      }

      broadcast(message.roomId, message, message.from);
    });

    peerSocket.on("close", () => removePeer(peerSocket));
  });

  return {
    name: "multicam-signaling",
    configureServer(server) {
      server.httpServer?.on("upgrade", (request, socket, head) => {
        const pathname = new URL(request.url || "/", "https://localhost").pathname;
        if (pathname !== "/signaling") return;

        wss.handleUpgrade(request, socket, head, (client) => {
          wss.emit("connection", client, request);
        });
      });

      server.httpServer?.once("close", () => {
        wss.close();
        rooms.clear();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    createMulticamSignalingPlugin(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
});
