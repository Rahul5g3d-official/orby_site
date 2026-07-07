import { useCallback, useEffect, useRef, useState } from "react";
import { getMediaErrorMessage, requestMicrophone, stopStream } from "../services/mediaService";

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor {
  return window.AudioContext || (window as unknown as { webkitAudioContext: AudioContextConstructor }).webkitAudioContext;
}

export function useMicrophone() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [level, setLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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
    stopMeter();
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
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
      setIsLoading(true);
      setError(null);
      stopMicrophone();

      try {
        const nextStream = await requestMicrophone(deviceId);
        streamRef.current = nextStream;
        setStream(nextStream);
        startMeter(nextStream);
        return nextStream;
      } catch (caughtError) {
        const message = getMediaErrorMessage(caughtError, "Unable to start microphone.");
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [startMeter, stopMicrophone],
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
