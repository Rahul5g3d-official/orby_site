import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMediaErrorMessage,
  requestMicrophone,
  stopStream,
} from "../services/mediaService";

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor {
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: AudioContextConstructor })
      .webkitAudioContext
  );
}

export function useMicrophone() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [level, setLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const cleanupEndedListenerRef = useRef<(() => void) | null>(null);
  const requestIdRef = useRef(0);

  const stopMeter = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setLevel(0);
  }, []);

  const stopMicrophone = useCallback(() => {
    requestIdRef.current += 1;
    cleanupEndedListenerRef.current?.();
    cleanupEndedListenerRef.current = null;
    stopMeter();
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setIsLoading(false);
  }, [stopMeter]);

  const startMeter = useCallback((nextStream: MediaStream) => {
    const AudioContextClass = getAudioContextConstructor();
    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    const source = context.createMediaStreamSource(nextStream);
    const data = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    audioContextRef.current = context;
    void context.resume();

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / data.length;
      setLevel(Math.min(1, average / 128));
      animationRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, []);

  const startMicrophone = useCallback(
    async (deviceId?: string) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsLoading(true);
      setError(null);

      cleanupEndedListenerRef.current?.();
      cleanupEndedListenerRef.current = null;
      stopMeter();
      stopStream(streamRef.current);
      streamRef.current = null;
      setStream(null);

      try {
        const nextStream = await requestMicrophone(deviceId);
        if (requestId !== requestIdRef.current) {
          stopStream(nextStream);
          return null;
        }

        const audioTrack = nextStream.getAudioTracks()[0];
        if (!audioTrack || audioTrack.readyState !== "live") {
          stopStream(nextStream);
          throw new Error(
            "The selected microphone did not provide a live audio track.",
          );
        }

        const handleEnded = () => {
          if (streamRef.current !== nextStream) return;
          cleanupEndedListenerRef.current?.();
          cleanupEndedListenerRef.current = null;
          stopMeter();
          streamRef.current = null;
          setStream(null);
        };
        audioTrack.addEventListener("ended", handleEnded);

        streamRef.current = nextStream;
        cleanupEndedListenerRef.current = () =>
          audioTrack.removeEventListener("ended", handleEnded);
        setStream(nextStream);
        startMeter(nextStream);
        return nextStream;
      } catch (caughtError) {
        const message = getMediaErrorMessage(
          caughtError,
          "Unable to start microphone.",
        );
        setError(message);
        return null;
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [startMeter, stopMeter],
  );

  useEffect(() => stopMicrophone, [stopMicrophone]);

  return {
    stream,
    level,
    isLoading,
    error,
    startMicrophone,
    stopMicrophone,
  };
}
