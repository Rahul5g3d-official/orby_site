import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioMode } from "../types/media";
import {
  createMixedAudioStream,
  type MixedAudioStream,
} from "../utils/mergeStreams";

const DEFAULT_MAX_DURATION_MS = 8_000;
const MIN_MAX_DURATION_MS = 1_000;

const AUDIO_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "video/webm;codecs=opus",
  "video/webm",
];

export type MicrophoneTestStatus =
  "idle" | "preparing" | "recording" | "stopping" | "ready" | "error";

export interface MicrophoneTestResult {
  blob: Blob;
  url: string;
  durationMs: number;
  mimeType: string;
  audioMode: AudioMode;
}

export interface UseMicrophoneTestOptions {
  microphoneStream: MediaStream | null;
  audioMode: AudioMode;
  maxDurationMs?: number;
}

export interface UseMicrophoneTestResult {
  status: MicrophoneTestStatus;
  result: MicrophoneTestResult | null;
  error: string | null;
  durationMs: number;
  maxDurationMs: number;
  isMicrophoneReady: boolean;
  startTest: () => Promise<boolean>;
  stopTest: () => Promise<MicrophoneTestResult | null>;
  resetTest: () => void;
}

function getSupportedAudioMimeType(): string {
  if (
    typeof MediaRecorder === "undefined" ||
    typeof MediaRecorder.isTypeSupported !== "function"
  ) {
    return "";
  }

  return (
    AUDIO_MIME_TYPES.find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType),
    ) ?? ""
  );
}

function getLiveAudioTrack(
  stream: MediaStream | null,
): MediaStreamTrack | null {
  return (
    stream
      ?.getAudioTracks()
      .find((track) => track.readyState === "live" && track.enabled) ?? null
  );
}

/**
 * Records a short, local-only microphone sample through the same voice processing
 * graph used by the final studio recording. Cleanup only stops the temporary
 * processed stream; the supplied microphone stream remains owned by its caller.
 */
export function useMicrophoneTest({
  microphoneStream,
  audioMode,
  maxDurationMs: requestedMaxDurationMs = DEFAULT_MAX_DURATION_MS,
}: UseMicrophoneTestOptions): UseMicrophoneTestResult {
  const maxDurationMs = Math.max(MIN_MAX_DURATION_MS, requestedMaxDurationMs);
  const [status, setStatus] = useState<MicrophoneTestStatus>("idle");
  const [result, setResult] = useState<MicrophoneTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);

  const mountedRef = useRef(true);
  const sessionRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const mixedAudioRef = useRef<MixedAudioStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const completionPromiseRef =
    useRef<Promise<MicrophoneTestResult | null> | null>(null);
  const completionResolverRef = useRef<
    ((value: MicrophoneTestResult | null) => void) | null
  >(null);
  const previousConfigurationRef = useRef({ microphoneStream, audioMode });

  const isMicrophoneReady = Boolean(getLiveAudioTrack(microphoneStream));

  const clearTimers = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoStopRef.current !== null) {
      window.clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  }, []);

  const releaseProcessedAudio = useCallback(() => {
    mixedAudioRef.current?.stop();
    mixedAudioRef.current = null;
  }, []);

  const revokeResultUrl = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
  }, []);

  const resolveCompletion = useCallback(
    (nextResult: MicrophoneTestResult | null) => {
      completionResolverRef.current?.(nextResult);
      completionResolverRef.current = null;
      completionPromiseRef.current = null;
    },
    [],
  );

  const discardActiveSession = useCallback(() => {
    sessionRef.current += 1;
    clearTimers();

    const recorder = recorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onerror = null;
      recorder.onstop = null;

      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // The recorder may already be stopping after its state was read.
        }
      }
    }

    recorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = 0;
    releaseProcessedAudio();
    resolveCompletion(null);
  }, [clearTimers, releaseProcessedAudio, resolveCompletion]);

  const resetTest = useCallback(() => {
    discardActiveSession();
    revokeResultUrl();

    if (mountedRef.current) {
      setDurationMs(0);
      setResult(null);
      setError(null);
      setStatus("idle");
    }
  }, [discardActiveSession, revokeResultUrl]);

  const stopTest = useCallback((): Promise<MicrophoneTestResult | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return completionPromiseRef.current ?? Promise.resolve(result);
    }

    clearTimers();
    if (mountedRef.current) {
      setDurationMs(
        Math.min(maxDurationMs, Math.max(0, Date.now() - startedAtRef.current)),
      );
      setStatus("stopping");
    }

    try {
      recorder.stop();
    } catch {
      discardActiveSession();
      if (mountedRef.current) {
        setError("Unable to finish the microphone test. Please try again.");
        setStatus("error");
      }
      return Promise.resolve(null);
    }

    return completionPromiseRef.current ?? Promise.resolve(null);
  }, [clearTimers, discardActiveSession, maxDurationMs, result]);

  const startTest = useCallback(async (): Promise<boolean> => {
    discardActiveSession();
    revokeResultUrl();

    if (mountedRef.current) {
      setResult(null);
      setDurationMs(0);
      setError(null);
      setStatus("preparing");
    }

    const sourceTrack = getLiveAudioTrack(microphoneStream);
    if (!sourceTrack) {
      if (mountedRef.current) {
        setError(
          "Choose and enable a microphone before recording a test sample.",
        );
        setStatus("error");
      }
      return false;
    }

    if (typeof MediaRecorder === "undefined") {
      if (mountedRef.current) {
        setError("Microphone testing is not supported by this browser.");
        setStatus("error");
      }
      return false;
    }

    const session = sessionRef.current;
    let mixedAudio: MixedAudioStream | null = null;

    try {
      mixedAudio = await createMixedAudioStream(
        [{ stream: microphoneStream, role: "voice" }],
        audioMode,
      );

      if (!mountedRef.current || session !== sessionRef.current) {
        mixedAudio.stop();
        return false;
      }

      const processedStream = mixedAudio.stream;
      if (
        !processedStream
          ?.getAudioTracks()
          .some((track) => track.readyState === "live")
      ) {
        mixedAudio.stop();
        throw new Error("The processed microphone stream is unavailable.");
      }

      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(
        processedStream,
        mimeType ? { mimeType } : undefined,
      );
      mixedAudioRef.current = mixedAudio;
      mixedAudio = null;
      recorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      completionPromiseRef.current = new Promise((resolve) => {
        completionResolverRef.current = resolve;
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        if (session !== sessionRef.current) return;

        discardActiveSession();

        if (mountedRef.current) {
          setError("The browser could not record the microphone test sample.");
          setStatus("error");
        }
      };

      recorder.onstop = () => {
        if (session !== sessionRef.current) return;

        clearTimers();
        const finalDurationMs = Math.min(
          maxDurationMs,
          Math.max(0, Date.now() - startedAtRef.current),
        );
        const finalMimeType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        chunksRef.current = [];
        recorderRef.current = null;
        startedAtRef.current = 0;
        releaseProcessedAudio();

        if (blob.size === 0) {
          resolveCompletion(null);
          if (mountedRef.current) {
            setError(
              "No microphone audio was captured. Check the selected input and try again.",
            );
            setStatus("error");
          }
          return;
        }

        revokeResultUrl();
        const url = URL.createObjectURL(blob);
        resultUrlRef.current = url;
        const nextResult: MicrophoneTestResult = {
          blob,
          url,
          durationMs: finalDurationMs,
          mimeType: finalMimeType,
          audioMode,
        };

        resolveCompletion(nextResult);
        if (mountedRef.current) {
          setDurationMs(finalDurationMs);
          setResult(nextResult);
          setError(null);
          setStatus("ready");
        }
      };

      recorder.start(250);
      if (mountedRef.current) {
        setStatus("recording");
      }

      intervalRef.current = window.setInterval(() => {
        if (!mountedRef.current) return;
        setDurationMs(
          Math.min(
            maxDurationMs,
            Math.max(0, Date.now() - startedAtRef.current),
          ),
        );
      }, 100);

      autoStopRef.current = window.setTimeout(() => {
        const activeRecorder = recorderRef.current;
        if (activeRecorder?.state === "recording") {
          void stopTest();
        }
      }, maxDurationMs);

      return true;
    } catch (caughtError) {
      mixedAudio?.stop();
      discardActiveSession();
      if (mountedRef.current) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to start the microphone test.",
        );
        setStatus("error");
      }
      return false;
    }
  }, [
    audioMode,
    clearTimers,
    discardActiveSession,
    maxDurationMs,
    microphoneStream,
    releaseProcessedAudio,
    resolveCompletion,
    revokeResultUrl,
    stopTest,
  ]);

  useEffect(() => {
    const previous = previousConfigurationRef.current;
    if (
      previous.microphoneStream !== microphoneStream ||
      previous.audioMode !== audioMode
    ) {
      previousConfigurationRef.current = { microphoneStream, audioMode };
      resetTest();
    }
  }, [audioMode, microphoneStream, resetTest]);

  useEffect(() => {
    const liveTrack = getLiveAudioTrack(microphoneStream);
    if (!liveTrack) return;

    const handleEnded = () => resetTest();
    liveTrack.addEventListener("ended", handleEnded);
    return () => liveTrack.removeEventListener("ended", handleEnded);
  }, [microphoneStream, resetTest]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      discardActiveSession();
      revokeResultUrl();
    };
  }, [discardActiveSession, revokeResultUrl]);

  return {
    status,
    result,
    error,
    durationMs,
    maxDurationMs,
    isMicrophoneReady,
    startTest,
    stopTest,
    resetTest,
  };
}
