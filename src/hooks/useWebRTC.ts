import { useCallback, useEffect, useRef, useState } from "react";
import { SignalingClient, type SignalingStatus } from "../services/signalingService";
import { createPeerConnection } from "../services/webrtcService";
import type { IceCandidatePayload, SessionDescriptionPayload, SignalMessage } from "../types/webrtc";
import { generatePeerId } from "../utils/generateRoomId";

function isPayloadMessage<TPayload>(message: SignalMessage): message is SignalMessage<TPayload> & { payload: TPayload } {
  return message.payload !== undefined;
}

export function usePhonePublisher(roomId: string, localStream: MediaStream | null, enabled = true) {
  const [status, setStatus] = useState<SignalingStatus>("idle");
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const peerIdRef = useRef(generatePeerId("phone"));
  const clientRef = useRef<SignalingClient | null>(null);
  const connectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    const client = new SignalingClient({
      roomId,
      peerId: peerIdRef.current,
      role: "phone",
    });
    clientRef.current = client;

    const unsubscribeStatus = client.onStatus(setStatus);
    const unsubscribeMessage = client.onMessage((message) => {
      if (message.from === peerIdRef.current) return;

      if (message.type === "answer" && isPayloadMessage<SessionDescriptionPayload>(message)) {
        void connectionRef.current
          ?.setRemoteDescription(new RTCSessionDescription(message.payload.description))
          .catch((caughtError) => {
            setError(caughtError instanceof Error ? caughtError.message : "Unable to accept studio answer.");
          });
      }

      if (message.type === "ice-candidate" && isPayloadMessage<IceCandidatePayload>(message)) {
        void connectionRef.current
          ?.addIceCandidate(new RTCIceCandidate(message.payload.candidate))
          .catch(() => undefined);
      }
    });

    void client.connect().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to connect signaling server.");
    });

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      connectionRef.current?.close();
      client.disconnect();
    };
  }, [enabled, roomId]);

  const stopSharing = useCallback(() => {
    connectionRef.current?.close();
    connectionRef.current = null;
    setIsSharing(false);
  }, []);

  const startSharing = useCallback(async () => {
    if (!enabled) {
      setError("This room link is not valid.");
      return false;
    }

    if (!localStream) {
      setError("Start the phone camera before sharing.");
      return false;
    }

    const client = clientRef.current;
    if (!client) {
      setError("Signaling is not connected.");
      return false;
    }

    stopSharing();

    try {
      const connection = createPeerConnection();
      connectionRef.current = connection;
      localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));

      connection.onicecandidate = (event) => {
        if (event.candidate) {
          client.send<IceCandidatePayload>("ice-candidate", {
            candidate: event.candidate.toJSON(),
          });
        }
      };

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      client.send<SessionDescriptionPayload>("offer", { description: offer });
      setIsSharing(true);
      setError(null);
      return true;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to share phone camera.");
      setIsSharing(false);
      return false;
    }
  }, [enabled, localStream, stopSharing]);

  return {
    status,
    isSharing,
    error,
    startSharing,
    stopSharing,
  };
}
