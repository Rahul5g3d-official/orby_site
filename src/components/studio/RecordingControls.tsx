import { Pause, Play, RotateCcw, Square } from "lucide-react";
import type { RecordingStatus } from "../../types/recording";
import { Button } from "../ui/Button";

interface RecordingControlsProps {
  status: RecordingStatus;
  canStart: boolean;
  hasRecording: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function RecordingControls({
  status,
  canStart,
  hasRecording,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
}: RecordingControlsProps) {
  const isRecording = status === "recording";
  const isPaused = status === "paused";

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
      <Button
        className="w-full sm:w-auto"
        icon={<Play className="h-4 w-4 shrink-0" />}
        disabled={!canStart || isRecording || isPaused}
        onClick={onStart}
      >
        Start
      </Button>
      <Button
        className="w-full sm:w-auto"
        variant="secondary"
        icon={<Pause className="h-4 w-4 shrink-0" />}
        disabled={!isRecording}
        onClick={onPause}
      >
        Pause
      </Button>
      <Button
        className="w-full sm:w-auto"
        variant="secondary"
        icon={<Play className="h-4 w-4 shrink-0" />}
        disabled={!isPaused}
        onClick={onResume}
      >
        Resume
      </Button>
      <Button
        className="w-full sm:w-auto"
        variant="danger"
        icon={<Square className="h-4 w-4 shrink-0" />}
        disabled={!isRecording && !isPaused}
        onClick={onStop}
      >
        Stop
      </Button>
      <Button
        className="col-span-2 w-full sm:col-span-1 sm:w-auto"
        variant="ghost"
        icon={<RotateCcw className="h-4 w-4 shrink-0" />}
        disabled={!hasRecording}
        onClick={onReset}
      >
        Reset
      </Button>
    </div>
  );
}
