import {
  AlertTriangle,
  Camera,
  Info,
  Mic2,
  MonitorUp,
  RefreshCw,
  Smartphone,
  StopCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { AudioLevelMeter } from "../components/studio/AudioLevelMeter";
import { CameraPreview } from "../components/studio/CameraPreview";
import { ConnectedDeviceCard } from "../components/studio/ConnectedDeviceCard";
import { DeviceSelector } from "../components/studio/DeviceSelector";
import { LayoutSelector } from "../components/studio/LayoutSelector";
import { QRCodePanel } from "../components/studio/QRCodePanel";
import { RecordingControls } from "../components/studio/RecordingControls";
import { RecordingReview } from "../components/studio/RecordingReview";
import { ScreenPreview } from "../components/studio/ScreenPreview";
import { Timer } from "../components/studio/Timer";
import { VoiceModeSelector } from "../components/studio/VoiceModeSelector";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ToastNotification } from "../components/ui/ToastNotification";
import { useLocalCamera } from "../hooks/useLocalCamera";
import { useMediaDevices } from "../hooks/useMediaDevices";
import { useMicrophone } from "../hooks/useMicrophone";
import { usePhoneCameraConnection } from "../hooks/usePhoneCameraConnection";
import { useRecorder } from "../hooks/useRecorder";
import { useScreenCapture } from "../hooks/useScreenCapture";
import { supportsRecordingApis } from "../services/mediaService";
import { buildRecordingFilename, downloadBlob } from "../services/recorderService";
import { saveRecording } from "../services/storageService";
import type { AudioMode, AudioModeOption, LayoutOption, StudioLayout } from "../types/media";
import { createCanvasComposition, type CanvasComposition } from "../utils/canvasComposer";
import { cn } from "../utils/cn";
import { getSecureContextMessage, isInsecureNetworkOrigin as checkInsecureNetworkOrigin } from "../utils/security";

const layoutOptions: LayoutOption[] = [
  {
    id: "screen-only",
    name: "Screen only",
    description: "Full canvas screen capture.",
  },
  {
    id: "camera-only",
    name: "Face camera only",
    description: "Full canvas camera capture.",
  },
  {
    id: "screen-bubble",
    name: "Screen + face bubble",
    description: "Screen capture with rounded camera overlay.",
  },
  {
    id: "screen-side",
    name: "Screen + side camera",
    description: "Screen on the left with cameras stacked on the right.",
  },
  {
    id: "grid",
    name: "Multi-camera grid",
    description: "Screen, webcam, and phones arranged in a responsive grid.",
  },
  {
    id: "pip",
    name: "Picture-in-picture",
    description: "Screen capture with a larger corner camera window.",
  },
  {
    id: "custom",
    name: "Custom placeholder",
    description: "Extensible layout slot for future drag-and-drop composition.",
  },
];

const audioModeOptions: AudioModeOption[] = [
  {
    id: "voice-boost",
    name: "Voice boost",
    description: "Clearer speech with presence EQ and light compression.",
  },
  {
    id: "noise-reduced",
    name: "Noise reduced",
    description: "Cuts low rumble and high hiss for rough environments.",
  },
  {
    id: "broadcast",
    name: "Broadcast",
    description: "Tighter, louder presenter voice for demos and lessons.",
  },
  {
    id: "warm",
    name: "Warm",
    description: "Adds low-mid body while keeping speech controlled.",
  },
  {
    id: "natural",
    name: "Natural",
    description: "Minimal processing for good microphones and quiet rooms.",
  },
];

interface StageVideoProps {
  stream: MediaStream | null;
  className?: string;
  fit?: "cover" | "contain";
}

function StageVideo({ stream, className, fit = "cover" }: StageVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      className={cn("h-full w-full bg-black", fit === "contain" ? "object-contain" : "object-cover", className)}
    />
  );
}

interface LiveStageProps {
  layout: StudioLayout;
  screenStream: MediaStream | null;
  cameraStream: MediaStream | null;
  remoteCameras: ReturnType<typeof usePhoneCameraConnection>["remoteCameras"];
}

function LiveStage({ layout, screenStream, cameraStream, remoteCameras }: LiveStageProps) {
  const cameras = [
    cameraStream ? { id: "webcam", label: "Webcam", stream: cameraStream } : null,
    ...remoteCameras.map((camera) => ({
      id: camera.peerId,
      label: camera.label,
      stream: camera.stream,
    })),
  ].filter((camera): camera is { id: string; label: string; stream: MediaStream } => Boolean(camera));

  const sources = [
    screenStream ? { id: "screen", label: "Screen", stream: screenStream, fit: "contain" as const } : null,
    ...cameras.map((camera) => ({ ...camera, fit: "cover" as const })),
  ].filter((source): source is { id: string; label: string; stream: MediaStream; fit: "cover" | "contain" } =>
    Boolean(source),
  );

  if (layout === "grid") {
    return (
          <div className="grid h-full w-full grid-cols-1 gap-2 p-2 sm:grid-cols-2 sm:gap-3 sm:p-3">
        {sources.length === 0 ? (
          <EmptyState title="No sources selected" className="col-span-full h-full" />
        ) : (
          sources.map((source) => (
            <div key={source.id} className="relative min-h-36 overflow-hidden rounded-lg border border-studio-border bg-black sm:min-h-40">
              <StageVideo stream={source.stream} fit={source.fit} />
              <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white">
                {source.label}
              </span>
            </div>
          ))
        )}
      </div>
    );
  }

  if (layout === "camera-only") {
    return cameras[0] ? (
      <StageVideo stream={cameras[0].stream} />
    ) : (
      <EmptyState title="Select a camera source" className="m-4 h-[calc(100%-2rem)]" />
    );
  }

  if (layout === "screen-side") {
    return (
      <div className="grid h-full grid-cols-1 gap-2 p-2 sm:gap-3 sm:p-3 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-lg border border-studio-border bg-black">
          {screenStream ? <StageVideo stream={screenStream} fit="contain" /> : <EmptyState title="Select a screen source" className="h-full" />}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-1">
          {cameras.slice(0, 3).map((camera) => (
            <div key={camera.id} className="relative min-h-28 overflow-hidden rounded-lg border border-studio-border bg-black sm:min-h-32">
              <StageVideo stream={camera.stream} />
              <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white">
                {camera.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {screenStream ? (
        <StageVideo stream={screenStream} fit="contain" />
      ) : (
        <EmptyState title="Select a screen source" className="m-4 h-[calc(100%-2rem)]" />
      )}
      {(layout === "screen-bubble" || layout === "pip" || layout === "custom") && cameras[0] ? (
        <div
          className={cn(
            "absolute overflow-hidden rounded-lg border border-white/30 bg-black shadow-studio",
            layout === "pip"
              ? "bottom-3 right-3 w-[42%] min-w-28 max-w-52 sm:bottom-6 sm:right-6 sm:w-[32%] sm:min-w-48 sm:max-w-none"
              : "bottom-3 right-3 w-[34%] min-w-24 max-w-44 sm:bottom-6 sm:right-6 sm:w-[24%] sm:min-w-40 sm:max-w-none",
            layout === "custom" && "left-3 right-auto top-3 sm:left-6 sm:top-6",
          )}
        >
          <StageVideo stream={cameras[0].stream} />
        </div>
      ) : null}
    </div>
  );
}

export function StudioPage() {
  const supported = supportsRecordingApis();
  const insecureNetworkOrigin = checkInsecureNetworkOrigin();
  const devices = useMediaDevices();
  const screen = useScreenCapture();
  const camera = useLocalCamera();
  const microphone = useMicrophone();
  const recorder = useRecorder();
  const phoneConnection = usePhoneCameraConnection();
  const compositionRef = useRef<CanvasComposition | null>(null);

  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");
  const [layout, setLayout] = useState<StudioLayout>("screen-bubble");
  const [audioMode, setAudioMode] = useState<AudioMode>("voice-boost");
  const [hasPlayedPreview, setHasPlayedPreview] = useState(false);
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false);
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const [toast, setToast] = useState<{ type: "info" | "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!selectedCameraId && devices.cameras[0]) {
      setSelectedCameraId(devices.cameras[0].deviceId);
    }
  }, [devices.cameras, selectedCameraId]);

  useEffect(() => {
    if (!selectedMicrophoneId && devices.microphones[0]) {
      setSelectedMicrophoneId(devices.microphones[0].deviceId);
    }
  }, [devices.microphones, selectedMicrophoneId]);

  useEffect(() => {
    return () => {
      compositionRef.current?.stop();
      compositionRef.current = null;
    };
  }, []);

  const activeSourceCount = useMemo(() => {
    return [screen.stream, camera.stream, ...phoneConnection.remoteCameras.map((remote) => remote.stream)].filter(Boolean).length;
  }, [camera.stream, phoneConnection.remoteCameras, screen.stream]);

  const combinedError =
    screen.error ||
    camera.error ||
    microphone.error ||
    recorder.error ||
    phoneConnection.error ||
    devices.error ||
    null;

  const canStartRecording = supported && activeSourceCount > 0 && recorder.status !== "recording" && recorder.status !== "paused";

  const refreshAfterPermission = async () => {
    await devices.refreshDevices();
  };

  const handleEnableCamera = async () => {
    await camera.startCamera(selectedCameraId || undefined);
    await refreshAfterPermission();
  };

  const handleEnableMicrophone = async () => {
    await microphone.startMicrophone(selectedMicrophoneId || undefined);
    await refreshAfterPermission();
  };

  const handleStartRecording = async () => {
    if (!supported) {
      setToast({ type: "error", message: "This browser does not support the required recording APIs." });
      return;
    }

    if (activeSourceCount === 0) {
      setToast({ type: "error", message: "Select at least one screen or camera source before recording." });
      return;
    }

    if (recorder.result) {
      recorder.resetRecording();
    }
    setHasPlayedPreview(false);
    setIsSavedToLibrary(false);

    try {
      const composition = await createCanvasComposition({
        screenStream: screen.stream,
        localCameraStream: camera.stream,
        microphoneStream: microphone.stream,
        remoteCameraStreams: phoneConnection.remoteCameras.filter((remote) => remote.status === "connected"),
        layout,
        audioMode,
      });
      compositionRef.current = composition;
      const started = recorder.startRecording(composition.stream);
      if (!started) {
        composition.stop();
        compositionRef.current = null;
      }
    } catch (caughtError) {
      setToast({
        type: "error",
        message: caughtError instanceof Error ? caughtError.message : "Unable to create composed recording.",
      });
    }
  };

  const handleStopRecording = async () => {
    const result = await recorder.stopRecording();
    compositionRef.current?.stop();
    compositionRef.current = null;

    if (!result) return;

    setHasPlayedPreview(false);
    setIsSavedToLibrary(false);
    setToast({ type: "info", message: "Recording ready. Play the preview before saving or downloading." });
  };

  const handleSaveRecording = async () => {
    if (!recorder.result || !hasPlayedPreview || isSavedToLibrary) return;

    setIsSavingRecording(true);
    const createdAt = new Date();
    const name = buildRecordingFilename(createdAt);
    try {
      await saveRecording({
        id: crypto.randomUUID(),
        name,
        createdAt: createdAt.toISOString(),
        durationMs: recorder.result.durationMs,
        size: recorder.result.blob.size,
        type: recorder.result.blob.type,
        blob: recorder.result.blob,
      });
      setIsSavedToLibrary(true);
      setToast({ type: "success", message: "Recording saved locally." });
    } catch (caughtError) {
      setToast({
        type: "error",
        message: caughtError instanceof Error ? caughtError.message : "Unable to save recording locally.",
      });
    } finally {
      setIsSavingRecording(false);
    }
  };

  const handleDownload = () => {
    if (!recorder.result || !hasPlayedPreview) return;
    downloadBlob(recorder.result.blob, buildRecordingFilename());
  };

  const handleResetRecording = () => {
    recorder.resetRecording();
    setHasPlayedPreview(false);
    setIsSavedToLibrary(false);
  };

  const handleCopyJoinUrl = () => {
    void navigator.clipboard
      .writeText(phoneConnection.joinUrl)
      .then(() => {
        setToast({ type: "success", message: "Phone camera link copied." });
      })
      .catch(() => {
        setToast({ type: "error", message: "Unable to copy. Select and copy the link manually." });
      });
  };

  const recorderBadgeStatus =
    recorder.status === "recording"
      ? "recording"
      : recorder.status === "paused"
        ? "paused"
        : recorder.status === "error"
          ? "error"
          : "idle";

  return (
    <main className="flex min-h-[calc(100svh-4rem)]">
      <Sidebar />
      <ToastNotification type={toast?.type} message={toast?.message || combinedError} />

      <div className="mx-auto grid w-full max-w-[1680px] gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <section className="order-3 grid content-start gap-4 lg:col-span-2 xl:order-1 xl:col-span-1">
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-studio-text">Sources</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void devices.refreshDevices()}
                aria-label="Refresh devices"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <Button
                  variant="secondary"
                  icon={<MonitorUp className="h-4 w-4" />}
                  isLoading={screen.isLoading}
                  onClick={() => void screen.startScreen()}
                  className="w-full"
                >
                  Select screen
                </Button>
                {screen.stream ? (
                  <Button
                    variant="ghost"
                    icon={<StopCircle className="h-4 w-4" />}
                    onClick={screen.stopScreen}
                    className="mt-2 w-full"
                  >
                    Stop screen
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3">
                <DeviceSelector
                label="Camera"
                devices={devices.cameras}
                value={selectedCameraId}
                placeholder={devices.isLoading ? "Loading cameras" : "Default camera"}
                onChange={(deviceId) => {
                  setSelectedCameraId(deviceId);
                  if (camera.stream) void camera.startCamera(deviceId || undefined);
                }}
                />
                <Button
                  variant="secondary"
                  icon={<Camera className="h-4 w-4 shrink-0" />}
                  isLoading={camera.isLoading}
                  onClick={() => void handleEnableCamera()}
                  className="w-full"
                >
                  Enable camera
                </Button>
              </div>

              <div className="grid gap-3">
                <DeviceSelector
                  label="Microphone"
                  devices={devices.microphones}
                  value={selectedMicrophoneId}
                  placeholder={devices.isLoading ? "Loading microphones" : "Default microphone"}
                  onChange={(deviceId) => {
                    setSelectedMicrophoneId(deviceId);
                    if (microphone.stream) void microphone.startMicrophone(deviceId || undefined);
                  }}
                />
                <Button
                  variant="secondary"
                  icon={<Mic2 className="h-4 w-4 shrink-0" />}
                  isLoading={microphone.isLoading}
                  onClick={() => void handleEnableMicrophone()}
                  className="w-full"
                >
                  Enable microphone
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-4 text-base font-semibold text-studio-text">Layout</h2>
            <LayoutSelector layouts={layoutOptions} value={layout} onChange={setLayout} />
          </Card>
        </section>

        <section className="order-1 grid min-w-0 content-start gap-4 xl:order-2">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-studio-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-studio-text">Studio</h1>
                <p className="mt-1 text-sm text-studio-muted">Final recording is composed from this source set using Canvas capture.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Timer durationMs={recorder.durationMs} />
                <StatusBadge status={recorderBadgeStatus}>{recorder.status}</StatusBadge>
              </div>
            </div>
            <div className="aspect-video max-h-[calc(100svh-15rem)] min-h-56 bg-black sm:min-h-72">
              <LiveStage
                layout={layout}
                screenStream={screen.stream}
                cameraStream={camera.stream}
                remoteCameras={phoneConnection.remoteCameras}
              />
            </div>
          </Card>

          <Card className="p-4">
            <RecordingControls
              status={recorder.status}
              canStart={canStartRecording}
              hasRecording={Boolean(recorder.result)}
              onStart={() => void handleStartRecording()}
              onPause={recorder.pauseRecording}
              onResume={recorder.resumeRecording}
              onStop={() => void handleStopRecording()}
              onReset={handleResetRecording}
            />
          </Card>

          {recorder.result ? (
            <RecordingReview
              result={recorder.result}
              hasPlayed={hasPlayedPreview}
              isSaved={isSavedToLibrary}
              isSaving={isSavingRecording}
              onPreviewPlayed={() => setHasPlayedPreview(true)}
              onSave={() => void handleSaveRecording()}
              onDownload={handleDownload}
              onDiscard={handleResetRecording}
            />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <ScreenPreview stream={screen.stream} />
            <CameraPreview stream={camera.stream} label="Webcam preview" />
          </div>
        </section>

        <section className="order-2 grid content-start gap-4 xl:order-3">
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-studio-text">Connected cameras</h2>
              <StatusBadge
                status={
                  phoneConnection.status === "connected"
                    ? "connected"
                    : phoneConnection.status === "error"
                      ? "error"
                      : "connecting"
                }
              >
                {phoneConnection.status}
              </StatusBadge>
            </div>
            <QRCodePanel roomId={phoneConnection.roomId} joinUrl={phoneConnection.joinUrl} onCopy={handleCopyJoinUrl} />
            <div className="mt-4 grid gap-3">
              {phoneConnection.remoteCameras.length === 0 ? (
                <EmptyState
                  title="No phones connected"
                  description="Scan the QR code on another device connected to the same network."
                />
              ) : (
                phoneConnection.remoteCameras.map((remote) => <ConnectedDeviceCard key={remote.peerId} camera={remote} />)
              )}
            </div>
          </Card>

          <Card className="grid gap-4 p-4">
            <AudioLevelMeter level={microphone.level} />
            <VoiceModeSelector options={audioModeOptions} value={audioMode} onChange={setAudioMode} />
            {insecureNetworkOrigin ? (
              <div className="flex gap-3 rounded-lg border border-studio-danger/35 bg-studio-danger/10 p-3 text-sm leading-6 text-red-100">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                {getSecureContextMessage()} Accept the local certificate warning on each test device.
              </div>
            ) : null}
            <div className="rounded-lg border border-studio-border bg-white/[0.03] p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-studio-text">
                <Info className="h-4 w-4 text-studio-cyan" />
                Browser notes
              </div>
              <ul className="space-y-2 text-sm leading-6 text-studio-muted">
                <li>Best results require Chrome or Edge.</li>
                <li>LAN use must be HTTPS because browsers block camera and microphone on insecure network origins.</li>
                <li>Tab audio depends on browser and selected source support.</li>
                <li>Multiple cameras depend on CPU, battery, and network quality.</li>
              </ul>
            </div>
            {!supported ? (
              <div className="flex gap-3 rounded-lg border border-studio-danger/35 bg-studio-danger/10 p-3 text-sm text-red-100">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                This browser is missing one or more recording APIs.
              </div>
            ) : null}
            <div className="flex gap-3 rounded-lg border border-studio-border bg-white/[0.03] p-3 text-sm text-studio-muted">
              <Smartphone className="h-5 w-5 shrink-0 text-studio-cyan" />
              For phone cameras, open this studio from the HTTPS network URL on both devices.
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
