import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMediaErrorMessage,
  requestScreen,
  stopStream,
} from "../services/mediaService";

export type DisplaySurface = "browser" | "window" | "monitor" | "unknown";

export function useScreenCapture() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [displaySurface, setDisplaySurface] = useState<DisplaySurface | null>(
    null,
  );
  const [hasDisplayAudio, setHasDisplayAudio] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cleanupListenersRef = useRef<(() => void) | null>(null);

  const stopScreen = useCallback(() => {
    cleanupListenersRef.current?.();
    cleanupListenersRef.current = null;
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setDisplaySurface(null);
    setHasDisplayAudio(false);
  }, []);

  const startScreen = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextStream = await requestScreen();
      const videoTrack = nextStream.getVideoTracks()[0];

      if (!videoTrack || videoTrack.readyState !== "live") {
        stopStream(nextStream);
        throw new Error(
          "The selected source did not provide a live video track.",
        );
      }

      const settings = videoTrack.getSettings() as MediaTrackSettings & {
        displaySurface?: DisplaySurface;
      };
      const updateAudioStatus = () => {
        setHasDisplayAudio(
          nextStream
            .getAudioTracks()
            .some((track) => track.readyState === "live" && !track.muted),
        );
      };
      const handleVideoEnded = () => {
        if (streamRef.current === nextStream) stopScreen();
      };
      const audioTracks = nextStream.getAudioTracks();

      videoTrack.addEventListener("ended", handleVideoEnded);
      audioTracks.forEach((track) => {
        track.addEventListener("ended", updateAudioStatus);
        track.addEventListener("mute", updateAudioStatus);
        track.addEventListener("unmute", updateAudioStatus);
      });

      cleanupListenersRef.current?.();
      stopStream(streamRef.current);
      streamRef.current = nextStream;
      cleanupListenersRef.current = () => {
        videoTrack.removeEventListener("ended", handleVideoEnded);
        audioTracks.forEach((track) => {
          track.removeEventListener("ended", updateAudioStatus);
          track.removeEventListener("mute", updateAudioStatus);
          track.removeEventListener("unmute", updateAudioStatus);
        });
      };
      setStream(nextStream);
      setDisplaySurface(settings.displaySurface || "unknown");
      updateAudioStatus();
      return nextStream;
    } catch (caughtError) {
      const message = getMediaErrorMessage(
        caughtError,
        "Screen sharing was cancelled or unavailable.",
      );
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [stopScreen]);

  useEffect(() => stopScreen, [stopScreen]);

  return {
    stream,
    displaySurface,
    hasDisplayAudio,
    isLoading,
    error,
    startScreen,
    stopScreen,
  };
}
