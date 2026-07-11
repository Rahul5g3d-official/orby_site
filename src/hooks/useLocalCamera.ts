import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMediaErrorMessage,
  requestCamera,
  stopStream,
} from "../services/mediaService";

export function useLocalCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cleanupEndedListenerRef = useRef<(() => void) | null>(null);
  const requestIdRef = useRef(0);

  const stopCamera = useCallback(() => {
    requestIdRef.current += 1;
    cleanupEndedListenerRef.current?.();
    cleanupEndedListenerRef.current = null;
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setIsLoading(false);
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);

    cleanupEndedListenerRef.current?.();
    cleanupEndedListenerRef.current = null;
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);

    try {
      const nextStream = await requestCamera(deviceId);
      if (requestId !== requestIdRef.current) {
        stopStream(nextStream);
        return null;
      }

      const videoTrack = nextStream.getVideoTracks()[0];
      if (!videoTrack || videoTrack.readyState !== "live") {
        stopStream(nextStream);
        throw new Error(
          "The selected webcam did not provide a live video track.",
        );
      }

      const handleEnded = () => {
        if (streamRef.current !== nextStream) return;
        cleanupEndedListenerRef.current?.();
        cleanupEndedListenerRef.current = null;
        streamRef.current = null;
        setStream(null);
      };
      videoTrack.addEventListener("ended", handleEnded);

      streamRef.current = nextStream;
      cleanupEndedListenerRef.current = () =>
        videoTrack.removeEventListener("ended", handleEnded);
      setStream(nextStream);
      return nextStream;
    } catch (caughtError) {
      const message = getMediaErrorMessage(
        caughtError,
        "Unable to start camera.",
      );
      setError(message);
      return null;
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  return {
    stream,
    isLoading,
    error,
    startCamera,
    stopCamera,
  };
}
