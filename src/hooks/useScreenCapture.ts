import { useCallback, useEffect, useRef, useState } from "react";
import { getMediaErrorMessage, requestScreen, stopStream } from "../services/mediaService";

export function useScreenCapture() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopScreen = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
  }, []);

  const startScreen = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    stopScreen();

    try {
      const nextStream = await requestScreen();
      nextStream.getVideoTracks()[0]?.addEventListener("ended", stopScreen);
      streamRef.current = nextStream;
      setStream(nextStream);
      return nextStream;
    } catch (caughtError) {
      const message = getMediaErrorMessage(caughtError, "Screen sharing was cancelled or unavailable.");
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [stopScreen]);

  useEffect(() => stopScreen, [stopScreen]);

  return {
    stream,
    isLoading,
    error,
    startScreen,
    stopScreen,
  };
}
