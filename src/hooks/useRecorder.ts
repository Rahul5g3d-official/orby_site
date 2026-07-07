import { useCallback, useEffect, useRef, useState } from "react";
import { createMediaRecorder } from "../services/recorderService";
import type { RecorderResult, RecordingStatus } from "../types/recording";

export function useRecorder() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecorderResult | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);
  const pausedDurationRef = useRef(0);
  const stopResolverRef = useRef<((result: RecorderResult | null) => void) | null>(null);

  const calculateDuration = useCallback(() => {
    if (!startedAtRef.current) return 0;
    const end = pausedAtRef.current ?? Date.now();
    return Math.max(0, end - startedAtRef.current - pausedDurationRef.current);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setInterval(() => {
      setDurationMs(calculateDuration());
    }, 250);
  }, [calculateDuration, clearTimer]);

  const startRecording = useCallback(
    (stream: MediaStream) => {
      if (!stream.active) {
        setError("The composed media stream is not active.");
        setStatus("error");
        return false;
      }

      try {
        const recorder = createMediaRecorder(stream);
        chunksRef.current = [];
        recorderRef.current = recorder;
        startedAtRef.current = Date.now();
        pausedAtRef.current = null;
        pausedDurationRef.current = 0;
        setDurationMs(0);
        setResult(null);
        setError(null);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onerror = () => {
          setError("Recording failed while writing media data.");
          setStatus("error");
        };

        recorder.onstop = () => {
          clearTimer();
          const finalDuration = calculateDuration();
          const mimeType = recorder.mimeType || "video/webm";
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const nextResult = {
            blob,
            url: URL.createObjectURL(blob),
            durationMs: finalDuration,
          };
          setDurationMs(finalDuration);
          setResult(nextResult);
          setStatus("stopped");
          stopResolverRef.current?.(nextResult);
          stopResolverRef.current = null;
        };

        recorder.start(1000);
        setStatus("recording");
        startTimer();
        return true;
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to start recording.");
        setStatus("error");
        return false;
      }
    },
    [calculateDuration, clearTimer, startTimer],
  );

  const pauseRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    pausedAtRef.current = Date.now();
    setDurationMs(calculateDuration());
    setStatus("paused");
  }, [calculateDuration]);

  const resumeRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    if (pausedAtRef.current) {
      pausedDurationRef.current += Date.now() - pausedAtRef.current;
    }
    pausedAtRef.current = null;
    recorder.resume();
    setStatus("recording");
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return Promise.resolve(result);
    }

    setDurationMs(calculateDuration());
    return new Promise<RecorderResult | null>((resolve) => {
      stopResolverRef.current = resolve;
      recorder.stop();
    });
  }, [calculateDuration, result]);

  const resetRecording = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    clearTimer();
    chunksRef.current = [];
    recorderRef.current = null;
    startedAtRef.current = 0;
    pausedAtRef.current = null;
    pausedDurationRef.current = 0;
    setDurationMs(0);
    setResult(null);
    setError(null);
    setStatus("idle");
  }, [clearTimer, result]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [clearTimer, result]);

  return {
    status,
    durationMs,
    error,
    result,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
}
