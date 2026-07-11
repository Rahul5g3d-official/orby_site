import { useCallback, useEffect, useRef, useState } from "react";
import { createMediaRecorder } from "../services/recorderService";
import type { RecorderResult, RecordingStatus } from "../types/recording";

function detachRecorderHandlers(recorder: MediaRecorder): void {
  recorder.ondataavailable = null;
  recorder.onerror = null;
  recorder.onstop = null;
}

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
  const recorderErrorRef = useRef<string | null>(null);
  const resultRef = useRef<RecorderResult | null>(null);
  const stopPromiseRef = useRef<Promise<RecorderResult | null> | null>(null);
  const stopResolverRef = useRef<
    ((result: RecorderResult | null) => void) | null
  >(null);
  const mountedRef = useRef(true);

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

  const settleStop = useCallback((nextResult: RecorderResult | null) => {
    const resolve = stopResolverRef.current;
    stopResolverRef.current = null;
    stopPromiseRef.current = null;
    resolve?.(nextResult);
  }, []);

  const revokeCurrentResult = useCallback(() => {
    if (resultRef.current?.url) {
      URL.revokeObjectURL(resultRef.current.url);
    }
    resultRef.current = null;
  }, []);

  const reportRecorderFailure = useCallback(
    (message: string) => {
      recorderErrorRef.current = message;
      clearTimer();

      if (mountedRef.current) {
        setError(message);
        setStatus("error");
      }
    },
    [clearTimer],
  );

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setInterval(() => {
      if (mountedRef.current) {
        setDurationMs(calculateDuration());
      }
    }, 250);
  }, [calculateDuration, clearTimer]);

  const startRecording = useCallback(
    (stream: MediaStream) => {
      const currentRecorder = recorderRef.current;
      if (
        stopPromiseRef.current ||
        (currentRecorder && currentRecorder.state !== "inactive")
      ) {
        if (mountedRef.current) {
          setError("A recording is already in progress.");
        }
        return false;
      }

      if (
        !stream.active ||
        !stream.getVideoTracks().some((track) => track.readyState === "live")
      ) {
        if (mountedRef.current) {
          setError("The composed media stream is not active.");
          setStatus("error");
        }
        return false;
      }

      if (currentRecorder) {
        detachRecorderHandlers(currentRecorder);
      }

      clearTimer();
      revokeCurrentResult();
      chunksRef.current = [];
      recorderErrorRef.current = null;
      recorderRef.current = null;
      startedAtRef.current = 0;
      pausedAtRef.current = null;
      pausedDurationRef.current = 0;

      let recorder: MediaRecorder | null = null;

      try {
        const nextRecorder = createMediaRecorder(stream);
        recorder = nextRecorder;
        recorderRef.current = nextRecorder;
        startedAtRef.current = Date.now();

        if (mountedRef.current) {
          setDurationMs(0);
          setResult(null);
          setError(null);
        }

        nextRecorder.ondataavailable = (event) => {
          if (recorderRef.current === nextRecorder && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        nextRecorder.onerror = (event) => {
          if (recorderRef.current !== nextRecorder) return;

          const mediaError = (event as Event & { error?: DOMException }).error;
          const message =
            mediaError?.message || "Recording failed while writing media data.";
          reportRecorderFailure(message);

          // Resolve an in-flight stop immediately. The later stop event is still
          // allowed to clean up, but must never publish data after an error.
          settleStop(null);

          if (nextRecorder.state !== "inactive") {
            try {
              nextRecorder.stop();
            } catch {
              // The recorder may already be transitioning to inactive as part of
              // the error algorithm.
            }
          }
        };

        nextRecorder.onstop = () => {
          if (recorderRef.current !== nextRecorder) return;

          clearTimer();
          recorderRef.current = null;
          detachRecorderHandlers(nextRecorder);

          const finalDuration = calculateDuration();
          const recordingError = recorderErrorRef.current;

          if (recordingError) {
            chunksRef.current = [];
            if (mountedRef.current) {
              setDurationMs(finalDuration);
              setResult(null);
              setError(recordingError);
              setStatus("error");
            }
            settleStop(null);
            return;
          }

          try {
            const mimeType = nextRecorder.mimeType || "video/webm";
            const blob = new Blob(chunksRef.current, { type: mimeType });
            chunksRef.current = [];

            if (blob.size === 0) {
              reportRecorderFailure(
                "Recording produced an empty media file. Please try again.",
              );
              settleStop(null);
              return;
            }

            if (!mountedRef.current) {
              settleStop(null);
              return;
            }

            const nextResult: RecorderResult = {
              blob,
              url: URL.createObjectURL(blob),
              durationMs: finalDuration,
            };
            resultRef.current = nextResult;
            setDurationMs(finalDuration);
            setResult(nextResult);
            setStatus("stopped");
            settleStop(nextResult);
          } catch (caughtError) {
            const message =
              caughtError instanceof Error
                ? caughtError.message
                : "Unable to finalize the recording.";
            reportRecorderFailure(message);
            settleStop(null);
          }
        };

        nextRecorder.start(1000);
        if (mountedRef.current) {
          setStatus("recording");
        }
        startTimer();
        return true;
      } catch (caughtError) {
        clearTimer();
        if (recorder) {
          detachRecorderHandlers(recorder);
          if (recorder.state !== "inactive") {
            try {
              recorder.stop();
            } catch {
              // Ignore cleanup errors; the original start error is actionable.
            }
          }
        }
        recorderRef.current = null;
        chunksRef.current = [];
        startedAtRef.current = 0;
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to start recording.";
        reportRecorderFailure(message);
        settleStop(null);
        return false;
      }
    },
    [
      calculateDuration,
      clearTimer,
      reportRecorderFailure,
      revokeCurrentResult,
      settleStop,
      startTimer,
    ],
  );

  const pauseRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    pausedAtRef.current = Date.now();
    if (mountedRef.current) {
      setDurationMs(calculateDuration());
      setStatus("paused");
    }
  }, [calculateDuration]);

  const resumeRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    if (pausedAtRef.current) {
      pausedDurationRef.current += Date.now() - pausedAtRef.current;
    }
    pausedAtRef.current = null;
    recorder.resume();
    if (mountedRef.current) {
      setStatus("recording");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (stopPromiseRef.current) {
      return stopPromiseRef.current;
    }

    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return Promise.resolve(resultRef.current);
    }

    if (mountedRef.current) {
      setDurationMs(calculateDuration());
    }

    const stopPromise = new Promise<RecorderResult | null>((resolve) => {
      stopResolverRef.current = resolve;
    });
    stopPromiseRef.current = stopPromise;

    try {
      recorder.stop();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to stop recording safely.";
      reportRecorderFailure(message);
      settleStop(null);
    }

    return stopPromise;
  }, [calculateDuration, reportRecorderFailure, settleStop]);

  const resetRecording = useCallback(() => {
    clearTimer();

    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder) {
      detachRecorderHandlers(recorder);
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // Reset intentionally discards any recorder output.
        }
      }
    }

    settleStop(null);
    revokeCurrentResult();
    chunksRef.current = [];
    recorderErrorRef.current = null;
    startedAtRef.current = 0;
    pausedAtRef.current = null;
    pausedDurationRef.current = 0;

    if (mountedRef.current) {
      setDurationMs(0);
      setResult(null);
      setError(null);
      setStatus("idle");
    }
  }, [clearTimer, revokeCurrentResult, settleStop]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearTimer();

      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder) {
        detachRecorderHandlers(recorder);
        if (recorder.state !== "inactive") {
          try {
            recorder.stop();
          } catch {
            // Unmount cleanup must not surface asynchronous recorder failures.
          }
        }
      }

      settleStop(null);
      revokeCurrentResult();
      chunksRef.current = [];
      recorderErrorRef.current = null;
    };
  }, [clearTimer, revokeCurrentResult, settleStop]);

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
