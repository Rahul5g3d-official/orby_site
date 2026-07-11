import { Download, Trash2, Video } from "lucide-react";
import type { StoredRecording } from "../../types/recording";
import {
  formatDateTime,
  formatFileSize,
  formatTimer,
} from "../../utils/formatTime";
import { Button } from "../ui/Button";

interface RecordingCardProps {
  recording: StoredRecording;
  onDownload: (recording: StoredRecording) => void;
  onDelete: (id: string) => void;
}

export function RecordingCard({
  recording,
  onDownload,
  onDelete,
}: RecordingCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-studio-border bg-studio-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-studio-accent/15 text-studio-cyan">
          <Video className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium text-studio-text">{recording.name}</h3>
          <p className="mt-1 text-sm text-studio-muted">
            {formatDateTime(recording.createdAt)} ·{" "}
            {formatTimer(recording.durationMs)} ·{" "}
            {formatFileSize(recording.size)}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          className="w-full sm:w-auto"
          variant="secondary"
          size="sm"
          icon={<Download className="h-4 w-4 shrink-0" />}
          onClick={() => onDownload(recording)}
        >
          Download
        </Button>
        <Button
          className="w-full sm:w-auto"
          variant="ghost"
          size="sm"
          icon={<Trash2 className="h-4 w-4 shrink-0" />}
          onClick={() => onDelete(recording.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
