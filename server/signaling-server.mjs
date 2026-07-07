import { WebSocketServer } from "ws";

const port = Number(process.env.SIGNALING_PORT || 8787);
const wss = new WebSocketServer({ port });
const rooms = new Map();
const signalTypes = new Set(["join", "offer", "answer", "ice-candidate", "leave"]);
const roleTypes = new Set(["studio", "phone"]);
const roomIdPattern = /^[A-Z2-9]{6,16}$/;
const peerIdPattern = /^(studio|phone)-[a-z2-9]{10}$/;

function send(socket, message) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function isValidSignalMessage(message) {
  return Boolean(
    message.type &&
      signalTypes.has(message.type) &&
      message.roomId &&
      roomIdPattern.test(message.roomId) &&
      message.from &&
      peerIdPattern.test(message.from) &&
      (!message.role || roleTypes.has(message.role)) &&
      (!message.to || peerIdPattern.test(message.to)),
  );
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  return rooms.get(roomId);
}

function broadcast(roomId, message, exceptPeerId) {
  const room = rooms.get(roomId);
  if (!room) return;

  for (const [peerId, socket] of room.entries()) {
    if (peerId !== exceptPeerId && (!message.to || message.to === peerId)) {
      send(socket, message);
    }
  }
}

wss.on("connection", (socket) => {
  socket.peerId = "";
  socket.roomId = "";

  socket.on("message", (raw) => {
    let message;

    try {
      message = JSON.parse(raw.toString());
    } catch {
      send(socket, { type: "error", payload: { message: "Invalid JSON" } });
      return;
    }

    if (!isValidSignalMessage(message)) {
      send(socket, {
        type: "error",
        payload: { message: "Invalid signaling message" },
      });
      return;
    }

    if (message.type === "join") {
      if (socket.peerId && socket.peerId !== message.from) {
        send(socket, {
          type: "error",
          payload: { message: "Peer identity cannot change after joining" },
        });
        return;
      }

      socket.peerId = message.from;
      socket.roomId = message.roomId;
      const room = getRoom(message.roomId);
      room.set(message.from, socket);
      send(socket, {
        type: "joined",
        roomId: message.roomId,
        from: "server",
        payload: {
          peers: [...room.keys()].filter((peerId) => peerId !== message.from),
        },
      });
      broadcast(
        message.roomId,
        {
          ...message,
          type: "peer-joined",
        },
        message.from,
      );
      return;
    }

    broadcast(message.roomId, message, message.from);
  });

  socket.on("close", () => {
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
  });
});

console.log(`MultiCam signaling server listening on ws://0.0.0.0:${port}`);
