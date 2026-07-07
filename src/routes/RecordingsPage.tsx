import { useCallback, useEffect, useState } from "react";
import { RecordingCard } from "../components/recordings/RecordingCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ToastNotification } from "../components/ui/ToastNotification";
import { buildRecordingFilename, downloadBlob } from "../services/recorderService";
import { deleteRecording, getRecordings } from "../services/storageService";
import type { StoredRecording } from "../types/recording";

export function RecordingsPage() {
  const [recordings, setRecordings] = useState<StoredRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const loadRecordings = useCallback(async () => {
    setIsLoading(true);
    try {
      setRecordings(await getRecordings());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecordings();
  }, [loadRecordings]);

  const handleDownload = (recording: StoredRecording) => {
    downloadBlob(recording.blob, recording.name || buildRecordingFilename(new Date(recording.createdAt)));
  };

  const handleDelete = async (id: string) => {
    await deleteRecording(id);
    setToast("Recording deleted.");
    await loadRecordings();
  };

  return (
    <main className="mx-auto max-w-[1180px] px-3 py-6 sm:px-6 sm:py-8">
      <ToastNotification type="success" message={toast} />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-studio-text sm:text-3xl">Recordings</h1>
          <p className="mt-2 text-studio-muted">Local browser recordings saved in IndexedDB.</p>
        </div>
        <Button className="w-full sm:w-auto" variant="secondary" onClick={() => void loadRecordings()}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <EmptyState title="Loading recordings" />
      ) : recordings.length === 0 ? (
        <EmptyState
          title="No recordings yet"
          description="Finished recordings from the studio will appear here for download or deletion."
        />
      ) : (
        <div className="grid gap-3">
          {recordings.map((recording) => (
            <RecordingCard
              key={recording.id}
              recording={recording}
              onDownload={handleDownload}
              onDelete={(id) => void handleDelete(id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
