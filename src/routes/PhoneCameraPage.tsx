import { AlertTriangle, Camera, RotateCcw, Send, StopCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CameraPreview } from "../components/studio/CameraPreview";
import { PermissionPrompt } from "../components/studio/PermissionPrompt";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ToastNotification } from "../components/ui/ToastNotification";
import { getMediaErrorMessage, requestPhoneCamera, stopStream } from "../services/mediaService";
import { usePhonePublisher } from "../hooks/useWebRTC";
import { getSecureContextMessage, isInsecureNetworkOrigin, isValidRoomId, normalizeRoomId } from "../utils/security";

export function PhoneCameraPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = normalizeRoomId(params.roomId);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<VideoFacingModeEnum>("environment");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasValidRoomId = isValidRoomId(roomId);
  const publisher = usePhonePublisher(roomId, stream, hasValidRoomId);
  const insecureNetworkOrigin = isInsecureNetworkOrigin();

  const stopCamera = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
  }, []);

  const startCamera = useCallback(
    async (nextFacingMode = facingMode) => {
      setIsLoading(true);
      setError(null);
      stopCamera();

      try {
        const nextStream = await requestPhoneCamera(nextFacingMode);
        streamRef.current = nextStream;
        setStream(nextStream);
      } catch (caughtError) {
        setError(getMediaErrorMessage(caughtError, "Unable to start phone camera."));
      } finally {
        setIsLoading(false);
      }
    },
    [facingMode, stopCamera],
  );

  const switchCamera = async () => {
    const nextFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacingMode);
    await startCamera(nextFacingMode);
  };

  useEffect(() => stopCamera, [stopCamera]);

  if (!hasValidRoomId) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-12">
        <PermissionPrompt
          title="Invalid room"
          description="Open the phone camera page from the studio QR code."
          action={null}
        />
      </main>
    );
  }

  const status = publisher.isSharing
    ? "connected"
    : publisher.status === "connected"
      ? "ready"
      : publisher.status === "error"
        ? "error"
        : "connecting";

  return (
    <main className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-3xl content-center gap-5 px-3 py-6 sm:px-6 sm:py-8">
      <ToastNotification type="error" message={error || publisher.error} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-studio-muted">Room {roomId}</p>
          <h1 className="mt-1 text-2xl font-semibold text-studio-text sm:text-3xl">Phone Camera</h1>
        </div>
        <StatusBadge status={status}>{publisher.isSharing ? "sharing" : publisher.status}</StatusBadge>
      </div>

      <CameraPreview stream={stream} label="Phone preview" muted={false} className="shadow-studio" />

      <div className="grid gap-3 rounded-lg border border-studio-border bg-studio-panel p-4">
        {insecureNetworkOrigin ? (
          <div className="flex gap-3 rounded-lg border border-studio-danger/35 bg-studio-danger/10 p-3 text-sm leading-6 text-red-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            {getSecureContextMessage()}
          </div>
        ) : null}
        <PermissionPrompt
          title="Camera and microphone access"
          description="Your phone sends a live WebRTC stream to the studio room. The recording still happens only on the studio device."
          action={
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <Button
                className="w-full sm:w-auto"
                icon={<Camera className="h-4 w-4 shrink-0" />}
                isLoading={isLoading}
                onClick={() => void startCamera()}
              >
                Start camera
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant="secondary"
                icon={<RotateCcw className="h-4 w-4 shrink-0" />}
                disabled={!stream}
                onClick={() => void switchCamera()}
              >
                Flip
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <Button
            className="w-full sm:w-auto"
            variant="success"
            icon={<Send className="h-4 w-4 shrink-0" />}
            disabled={!stream || publisher.isSharing || publisher.status !== "connected"}
            onClick={() => void publisher.startSharing()}
          >
            Start sharing camera
          </Button>
          <Button
            className="w-full sm:w-auto"
            variant="danger"
            icon={<StopCircle className="h-4 w-4 shrink-0" />}
            disabled={!publisher.isSharing}
            onClick={publisher.stopSharing}
          >
            Stop sharing
          </Button>
        </div>
      </div>
    </main>
  );
}
