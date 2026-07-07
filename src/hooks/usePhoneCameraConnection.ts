import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SignalingClient, type SignalingStatus } from "../services/signalingService";
import { createPeerConnection } from "../services/webrtcService";
import type { RemoteCamera } from "../types/media";
import type { IceCandidatePayload, SessionDescriptionPayload, SignalMessage } from "../types/webrtc";
import { generatePeerId, generateRoomId } from "../utils/generateRoomId";

function isPayloadMessage<TPayload>(message: SignalMessage): message is SignalMessage<TPayload> & { payload: TPayload } {
  return message.payload !== undefined;
}

export function usePhoneCameraConnection() {
  const [roomId] = useState(() => generateRoomId());
  const [remoteCameras, setRemoteCameras] = useState<RemoteCamera[]>([]);
  const [status, setStatus] = useState<SignalingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const peerIdRef = useRef(generatePeerId("studio"));
  const clientRef = useRef<SignalingClient | null>(null);
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());

  const joinUrl = useMemo(() => {
    return `${window.location.origin}/phone-camera/${roomId}`;
  }, [roomId]);

  const removePeer = useCallback((peerId: string) => {
    peerConnectionsRef.current.get(peerId)?.close();
    peerConnectionsRef.current.delete(peerId);
    setRemoteCameras((current) => current.filter((camera) => camera.peerId !== peerId));
  }, []);

  const getOrCreateConnection = useCallback(
    (peerId: string, client: SignalingClient) => {
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing) return existing;

      const connection = createPeerConnection();
      const remoteStream = new MediaStream();

      connection.onicecandidate = (event) => {
        if (event.candidate) {
          client.send<IceCandidatePayload>(
            "ice-candidate",
            { candidate: event.candidate.toJSON() },
            peerId,
          );
        }
      };

      connection.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          if (!remoteStream.getTracks().some((existingTrack) => existingTrack.id === track.id)) {
            remoteStream.addTrack(track);
          }
        });

        setRemoteCameras((current) => {
          const label = `Phone ${peerId.slice(-4).toUpperCase()}`;
          const nextCamera: RemoteCamera = {
            peerId,
            label,
            stream: event.streams[0] || remoteStream,
            status: "connected",
          };
          const index = current.findIndex((camera) => camera.peerId === peerId);
          if (index === -1) return [...current, nextCamera];
          return current.map((camera) => (camera.peerId === peerId ? nextCamera : camera));
        });
      };

      connection.onconnectionstatechange = () => {
        if (["closed", "disconnected", "failed"].includes(connection.connectionState)) {
          setRemoteCameras((current) =>
            current.map((camera) =>
              camera.peerId === peerId ? { ...camera, status: "disconnected" } : camera,
            ),
          );
        }
      };

      peerConnectionsRef.current.set(peerId, connection);
      setRemoteCameras((current) => {
        if (current.some((camera) => camera.peerId === peerId)) return current;
        return [
          ...current,
          {
            peerId,
            label: `Phone ${peerId.slice(-4).toUpperCase()}`,
            stream: remoteStream,
            status: "connecting",
          },
        ];
      });

      return connection;
    },
    [],
  );

  useEffect(() => {
    const peerConnections = peerConnectionsRef.current;
    const client = new SignalingClient({
      roomId,
      peerId: peerIdRef.current,
      role: "studio",
    });
    clientRef.current = client;

    const unsubscribeStatus = client.onStatus(setStatus);
    const unsubscribeMessage = client.onMessage((message) => {
      if (message.from === peerIdRef.current) return;

      if (message.type === "peer-left" || message.type === "leave") {
        removePeer(message.from);
        return;
      }

      if (message.type === "offer" && isPayloadMessage<SessionDescriptionPayload>(message)) {
        const connection = getOrCreateConnection(message.from, client);
        void connection
          .setRemoteDescription(new RTCSessionDescription(message.payload.description))
          .then(() => connection.createAnswer())
          .then((answer) => connection.setLocalDescription(answer).then(() => answer))
          .then((answer) => {
            client.send<SessionDescriptionPayload>("answer", { description: answer }, message.from);
          })
          .catch((caughtError) => {
            setError(caughtError instanceof Error ? caughtError.message : "Unable to answer phone camera.");
          });
      }

      if (message.type === "ice-candidate" && isPayloadMessage<IceCandidatePayload>(message)) {
        const connection = peerConnectionsRef.current.get(message.from);
        if (connection) {
          void connection.addIceCandidate(new RTCIceCandidate(message.payload.candidate)).catch(() => undefined);
        }
      }
    });

    void client.connect().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to connect signaling server.");
    });

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      client.disconnect();
      peerConnections.forEach((connection) => connection.close());
      peerConnections.clear();
    };
  }, [getOrCreateConnection, removePeer, roomId]);

  return {
    roomId,
    joinUrl,
    remoteCameras,
    status,
    error,
  };
}
