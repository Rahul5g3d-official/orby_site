import { AlertCircle, CheckCircle2, Headphones, Mic2, RotateCcw, Square } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useMicrophoneTest, type MicrophoneTestResult } from "../../hooks/useMicrophoneTest";
import type { AudioMode } from "../../types/media";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";

const MODE_LABELS: Record<AudioMode, string> = {
  natural: "Natural",
  "voice-boost": "Voice boost",
  "noise-reduced": "Noise reduced",
  broadcast: "Broadcast",
  warm: "Warm",
};

export interface MicrophoneVoiceTestProps {
  microphoneStream: MediaStream | null;
  audioMode: AudioMode;
  maxDurationMs?: number;
  disabled?: boolean;
  className?: string;
  onResult?: (result: MicrophoneTestResult | null) => void;
  onPlayback?: (result: MicrophoneTestResult) => void;
}

function formatSeconds(durationMs: number): string {
  return `${(durationMs / 1_000).toFixed(1)}s`;
}

/** A compact recorder/playback surface intended for a voice-mode settings panel. */
export function MicrophoneVoiceTest({
  microphoneStream,
  audioMode,
  maxDurationMs,
  disabled = false,
  className,
  onResult,
  onPlayback,
}: MicrophoneVoiceTestProps) {
  const test = useMicrophoneTest({ microphoneStream, audioMode, maxDurationMs });
  const titleId = useId();
  const onResultRef = useRef(onResult);
  const onPlaybackRef = useRef(onPlayback);
  const reportedResultRef = useRef<MicrophoneTestResult | null>(null);
  const isBusy = test.status === "preparing" || test.status === "stopping";
  const isRecording = test.status === "recording";
  const durationLabel = `${formatSeconds(test.durationMs)} / ${formatSeconds(test.maxDurationMs)}`;
  const progress = Math.min(100, (test.durationMs / test.maxDurationMs) * 100);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onPlaybackRef.current = onPlayback;
  }, [onPlayback]);

  useEffect(() => {
    if (test.result === reportedResultRef.current) return;
    reportedResultRef.current = test.result;
    onResultRef.current?.(test.result);
  }, [test.result]);

  return (
    <section
      className={cn("rounded-xl border border-studio-border bg-white/[0.025] p-4", className)}
      aria-labelledby={titleId}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-studio-cyan/10 text-studio-cyan">
          <Headphones className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={titleId} className="text-sm font-semibold text-studio-text">
              Test your microphone
            </h3>
            <span className="rounded-full border border-studio-cyan/20 bg-studio-cyan/10 px-2 py-0.5 text-[11px] font-medium text-studio-cyan">
              {MODE_LABELS[audioMode]}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-studio-muted">
            Record a short sample, then play back the exact voice processing used in your final recording.
          </p>
        </div>
      </div>

      {!test.isMicrophoneReady ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Choose and enable a microphone to record a test sample.</span>
        </div>
      ) : null}

      {isRecording || test.status === "stopping" ? (
        <div className="mt-4" aria-live="polite">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-2 font-medium text-studio-text">
              <span className={cn("h-2 w-2 rounded-full bg-red-400", isRecording && "animate-pulse")} />
              {isRecording ? "Recording test sample" : "Finishing sample"}
            </span>
            <span className="tabular-nums text-studio-muted">{durationLabel}</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Microphone test duration"
            aria-valuemin={0}
            aria-valuemax={test.maxDurationMs}
            aria-valuenow={test.durationMs}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-400 to-orange-300 transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {test.error ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs leading-5 text-red-100" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{test.error}</span>
        </div>
      ) : null}

      {test.result ? (
        <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-200">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Sample ready · {formatSeconds(test.result.durationMs)}
          </div>
          <audio
            key={test.result.url}
            src={test.result.url}
            controls
            preload="metadata"
            className="h-10 w-full"
            aria-label={`${MODE_LABELS[test.result.audioMode]} microphone test playback`}
            onPlay={() => onPlaybackRef.current?.(test.result as MicrophoneTestResult)}
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {isRecording ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={<Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />}
            onClick={() => void test.stopTest()}
          >
            Stop sample
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Mic2 className="h-4 w-4" aria-hidden="true" />}
            isLoading={isBusy}
            disabled={disabled || !test.isMicrophoneReady || isBusy}
            onClick={() => void test.startTest()}
          >
            {test.result ? "Record again" : "Record sample"}
          </Button>
        )}

        {test.result ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
            onClick={test.resetTest}
          >
            Discard
          </Button>
        ) : null}
      </div>
    </section>
  );
}
