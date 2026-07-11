import { Download, Save, Trash2 } from "lucide-react";
import type { RecorderResult } from "../../types/recording";
import { formatFileSize, formatTimer } from "../../utils/formatTime";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";

interface RecordingReviewProps {
  result: RecorderResult;
  hasPlayed: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onPreviewPlayed: () => void;
  onSave: () => void;
  onDownload: () => void;
  onDiscard: () => void;
}

export function RecordingReview({
  result,
  hasPlayed,
  isSaved,
  isSaving,
  onPreviewPlayed,
  onSave,
  onDownload,
  onDiscard,
}: RecordingReviewProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-studio-border bg-studio-card shadow-studio">
      <div className="flex flex-col gap-3 border-b border-studio-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-studio-text">
            Review recording
          </h2>
          <p className="mt-1 text-sm text-studio-muted">
            Play this file first. Save and Download unlock after playback
            starts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={hasPlayed ? "ready" : "paused"}>
            {hasPlayed ? "previewed" : "play first"}
          </StatusBadge>
          {isSaved ? <StatusBadge status="connected">saved</StatusBadge> : null}
        </div>
      </div>
      <video
        src={result.url}
        controls
        preload="metadata"
        className="aspect-video w-full bg-black"
        onPlay={onPreviewPlayed}
      />
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-studio-muted">
          {formatTimer(result.durationMs)} · {formatFileSize(result.blob.size)}
        </p>
        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
          <Button
            className="w-full"
            variant="secondary"
            icon={<Save className="h-4 w-4 shrink-0" />}
            disabled={!hasPlayed || isSaved}
            isLoading={isSaving}
            onClick={onSave}
          >
            Save locally
          </Button>
          <Button
            className="w-full"
            variant="success"
            icon={<Download className="h-4 w-4 shrink-0" />}
            disabled={!hasPlayed}
            onClick={onDownload}
          >
            Download
          </Button>
          <Button
            className="w-full"
            variant="ghost"
            icon={<Trash2 className="h-4 w-4 shrink-0" />}
            onClick={onDiscard}
          >
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}
