import { useCallback, useEffect, useRef, useState } from "react";
import { getMediaErrorMessage, requestCamera, stopStream } from "../services/mediaService";

export function useLocalCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
  }, []);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      setIsLoading(true);
      setError(null);
      stopCamera();

      try {
        const nextStream = await requestCamera(deviceId);
        streamRef.current = nextStream;
        setStream(nextStream);
        return nextStream;
      } catch (caughtError) {
        const message = getMediaErrorMessage(caughtError, "Unable to start camera.");
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [stopCamera],
  );

  useEffect(() => stopCamera, [stopCamera]);

  return {
    stream,
    isLoading,
    error,
    startCamera,
    stopCamera,
  };
}
