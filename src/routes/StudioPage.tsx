import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Info,
  Lock,
  Mic2,
  MicOff,
  MonitorUp,
  RefreshCw,
  SlidersHorizontal,
  StopCircle,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useBlocker } from "react-router-dom";
import { AudioLevelMeter } from "../components/studio/AudioLevelMeter";
import { CameraPreview } from "../components/studio/CameraPreview";
import { DeviceSelector } from "../components/studio/DeviceSelector";
import { LayoutSelector } from "../components/studio/LayoutSelector";
import { MicrophoneVoiceTest } from "../components/studio/MicrophoneVoiceTest";
import { RecordingControls } from "../components/studio/RecordingControls";
import { RecordingReview } from "../components/studio/RecordingReview";
import { ScreenPreview } from "../components/studio/ScreenPreview";
import { StudioSetupSheet } from "../components/studio/StudioSetupSheet";
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
import type { MicrophoneTestResult } from "../hooks/useMicrophoneTest";
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
    description: "Direct tab capture for reliable meeting recordings, including when this page is in the background.",
  },
  {
    id: "camera-only",
    name: "Face camera only",
    description: "Record the one selected webcam as a full-frame video.",
  },
  {
    id: "screen-bubble",
    name: "Screen + face bubble",
    description: "Screen capture with the selected webcam in a rounded corner overlay.",
  },
  {
    id: "screen-side",
    name: "Screen + side camera",
    description: "Screen on the left and the one selected webcam on the right.",
  },
  {
    id: "grid",
    name: "Two-source grid",
    description: "Arrange the shared screen and one webcam in a balanced two-panel grid.",
  },
  {
    id: "pip",
    name: "Picture-in-picture",
    description: "Screen capture with a larger corner webcam window.",
  },
  {
    id: "custom",
    name: "Custom top-left",
    description: "Place the one selected webcam at the top-left of the shared screen.",
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

type SetupSection = "sources" | "layout" | "voice";

const setupSections: ReadonlyArray<{ id: SetupSection; label: string }> = [
  { id: "sources", label: "Sources" },
  { id: "layout", label: "Layout" },
  { id: "voice", label: "Voice" },
];

interface StageVideoProps {
  stream: MediaStream | null;
  className?: string;
  fit?: "cover" | "contain";
}

function StageVideo({ stream, className, fit = "cover" }: StageVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
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
}

function LiveStage({ layout, screenStream, cameraStream }: LiveStageProps) {
  const sources = [
    screenStream ? { id: "screen", label: "Screen", stream: screenStream, fit: "contain" as const } : null,
    cameraStream ? { id: "webcam", label: "Webcam", stream: cameraStream, fit: "cover" as const } : null,
  ].filter(
    (source): source is { id: string; label: string; stream: MediaStream; fit: "cover" | "contain" } =>
      Boolean(source),
  );

  if (layout === "grid") {
    return (
      <div className="grid h-full w-full grid-cols-1 gap-2 p-2 sm:grid-cols-2 sm:gap-3 sm:p-3">
        {sources.length === 0 ? (
          <EmptyState title="No sources selected" className="col-span-full h-full" />
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className="relative min-h-36 overflow-hidden rounded-xl border border-studio-border bg-black sm:min-h-40"
            >
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
    return cameraStream ? (
      <StageVideo stream={cameraStream} />
    ) : (
      <EmptyState
        title="Select a webcam source"
        description="Only one webcam is used in the recording."
        className="m-4 h-[calc(100%-2rem)]"
      />
    );
  }

  if (layout === "screen-side") {
    return (
      <div className="grid h-full grid-cols-1 gap-2 p-2 sm:grid-cols-[minmax(0,1fr)_32%] sm:gap-3 sm:p-3">
        <div className="min-h-0 overflow-hidden rounded-xl border border-studio-border bg-black">
          {screenStream ? (
            <StageVideo stream={screenStream} fit="contain" />
          ) : (
            <EmptyState title="Select a screen source" className="h-full" />
          )}
        </div>
        <div className="min-h-28 overflow-hidden rounded-xl border border-studio-border bg-black">
          {cameraStream ? <StageVideo stream={cameraStream} /> : <EmptyState title="Enable webcam" className="h-full" />}
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
      {(layout === "screen-bubble" || layout === "pip" || layout === "custom") && cameraStream ? (
        <div
          className={cn(
            "absolute aspect-video overflow-hidden rounded-xl border border-white/30 bg-black shadow-studio",
            layout === "pip"
              ? "bottom-3 right-3 w-[42%] min-w-32 max-w-sm sm:bottom-6 sm:right-6 sm:w-[32%]"
              : "bottom-3 right-3 w-[34%] min-w-28 max-w-60 sm:bottom-6 sm:right-6 sm:w-[24%]",
            layout === "custom" && "left-3 right-auto top-3 sm:left-6 sm:top-6",
          )}
        >
          <StageVideo stream={cameraStream} />
        </div>
      ) : null}
    </div>
  );
}

function hasLiveVideo(stream: MediaStream | null): boolean {
  return Boolean(stream?.getVideoTracks().some((track) => track.readyState === "live"));
}

export function StudioPage() {
  const supported = supportsRecordingApis();
  const insecureNetworkOrigin = checkInsecureNetworkOrigin();
  const devices = useMediaDevices();
  const screen = useScreenCapture();
  const camera = useLocalCamera();
  const microphone = useMicrophone();
  const recorder = useRecorder();
  const stopRecording = recorder.stopRecording;
  const compositionRef = useRef<CanvasComposition | null>(null);
  const screenWasLiveDuringRecordingRef = useRef(false);
  const screenAudioWasLiveDuringRecordingRef = useRef(false);
  const cameraWasLiveDuringRecordingRef = useRef(false);
  const microphoneWasLiveDuringRecordingRef = useRef(false);
  const stopInFlightRef = useRef(false);

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [activeSetupSection, setActiveSetupSection] = useState<SetupSection>("sources");
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");
  const [layout, setLayout] = useState<StudioLayout>("screen-only");
  const [audioMode, setAudioMode] = useState<AudioMode>("voice-boost");
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [allowSilentScreen, setAllowSilentScreen] = useState(false);
  const [micTestResult, setMicTestResult] = useState<MicrophoneTestResult | null>(null);
  const [hasPlayedMicTest, setHasPlayedMicTest] = useState(false);
  const [hasPlayedPreview, setHasPlayedPreview] = useState(false);
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false);
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const [toast, setToast] = useState<{ type: "info" | "success" | "error"; message: string } | null>(null);
  const [dismissedErrors, setDismissedErrors] = useState<string[]>([]);
  const startInFlightRef = useRef(false);
  const isRecordingActive = recorder.status === "recording" || recorder.status === "paused";
  const navigationBlocker = useBlocker(isRecordingActive || isPreparingRecording);

  useEffect(() => {
    if (devices.isLoading) return;
    const selectedStillExists = devices.cameras.some((device) => device.deviceId === selectedCameraId);
    if (!selectedStillExists) setSelectedCameraId(devices.cameras[0]?.deviceId || "");
  }, [devices.cameras, devices.isLoading, selectedCameraId]);

  useEffect(() => {
    if (devices.isLoading) return;
    const selectedStillExists = devices.microphones.some((device) => device.deviceId === selectedMicrophoneId);
    if (!selectedStillExists) setSelectedMicrophoneId(devices.microphones[0]?.deviceId || "");
  }, [devices.isLoading, devices.microphones, selectedMicrophoneId]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (navigationBlocker.state !== "blocked") return;
    setToast({ type: "error", message: "Wait for setup to finish or stop the recording before leaving the studio." });
    navigationBlocker.reset();
  }, [navigationBlocker]);

  useEffect(() => {
    if (!isRecordingActive && !isPreparingRecording) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isPreparingRecording, isRecordingActive]);

  useEffect(() => {
    return () => {
      compositionRef.current?.stop();
      compositionRef.current = null;
    };
  }, []);

  const hasScreen = hasLiveVideo(screen.stream);
  const hasCamera = hasLiveVideo(camera.stream);
  const hasMicrophone = Boolean(
    microphone.stream?.getAudioTracks().some((track) => track.readyState === "live"),
  );
  const activeSourceCount = [hasScreen, hasCamera].filter(Boolean).length;
  const sourcesLocked = isRecordingActive || isPreparingRecording;
  const hasCompletedMicTest = Boolean(
    hasMicrophone && micTestResult?.audioMode === audioMode && hasPlayedMicTest,
  );
  const layoutSourcesReady =
    layout === "screen-only"
      ? hasScreen
      : layout === "camera-only"
        ? hasCamera
        : activeSourceCount > 0;
  const screenAudioApproved = !hasScreen || screen.hasDisplayAudio || allowSilentScreen;

  let readinessMessage = "Ready to record.";
  if (!supported) readinessMessage = "This browser is missing one or more required recording APIs.";
  else if (!layoutSourcesReady) {
    readinessMessage =
      layout === "screen-only"
        ? "Choose the browser tab, window, or screen to record."
        : layout === "camera-only"
          ? "Enable the one webcam you want to record."
          : "Choose a screen or enable your webcam before recording.";
  } else if (!screenAudioApproved) {
    readinessMessage = "Tab audio is missing. Reselect a browser tab and enable Share tab audio.";
  }

  const canStartRecording =
    supported &&
    layoutSourcesReady &&
    screenAudioApproved &&
    !isPreparingRecording &&
    !isRecordingActive &&
    recorder.status !== "recording";
  const setupIssueCount = [!layoutSourcesReady, !screenAudioApproved, !supported].filter(Boolean).length;
  const mediaErrors = [screen.error, camera.error, microphone.error, recorder.error, devices.error].filter(
    (message): message is string => Boolean(message),
  );
  const combinedError = mediaErrors[0] || null;
  const visibleCombinedError = mediaErrors.find((message) => !dismissedErrors.includes(message)) || null;

  useEffect(() => {
    if (!combinedError && dismissedErrors.length > 0) setDismissedErrors([]);
  }, [combinedError, dismissedErrors.length]);

  const refreshAfterPermission = async () => {
    await devices.refreshDevices();
  };

  const handleSelectScreen = async () => {
    const nextStream = await screen.startScreen();
    if (!nextStream) return;
    setAllowSilentScreen(false);
    const hasAudio = nextStream.getAudioTracks().some((track) => track.readyState === "live");
    setToast({
      type: hasAudio ? "success" : "error",
      message: hasAudio
        ? "Shared audio is included. Tab sound will be recorded."
        : "No shared audio was provided. Choose Chrome Tab and enable Share tab audio.",
    });
  };

  const handleEnableCamera = async () => {
    await camera.startCamera(selectedCameraId || undefined);
    await refreshAfterPermission();
  };

  const handleEnableMicrophone = async () => {
    setMicTestResult(null);
    setHasPlayedMicTest(false);
    await microphone.startMicrophone(selectedMicrophoneId || undefined);
    await refreshAfterPermission();
  };

  const handleStopMicrophone = () => {
    microphone.stopMicrophone();
    setMicTestResult(null);
    setHasPlayedMicTest(false);
  };

  const handleAudioModeChange = (mode: AudioMode) => {
    setAudioMode(mode);
    setMicTestResult(null);
    setHasPlayedMicTest(false);
  };

  const handleStartRecording = async () => {
    if (startInFlightRef.current) return;
    if (!canStartRecording) {
      setToast({ type: "error", message: readinessMessage });
      setActiveSetupSection("sources");
      setIsSetupOpen(true);
      return;
    }

    startInFlightRef.current = true;
    setIsPreparingRecording(true);
    if (recorder.result) recorder.resetRecording();
    setHasPlayedPreview(false);
    setIsSavedToLibrary(false);

    try {
      const composition = await createCanvasComposition({
        screenStream: screen.stream,
        localCameraStream: camera.stream,
        microphoneStream: microphone.stream,
        layout,
        audioMode,
      });
      compositionRef.current = composition;
      const started = recorder.startRecording(composition.stream);
      if (!started) {
        composition.stop();
        compositionRef.current = null;
        return;
      }

      setToast({
        type: "success",
        message:
          composition.mode === "direct"
            ? "Direct tab recording started. The shared tab can stay in the foreground."
            : "Recording started with your selected layout.",
      });
    } catch (caughtError) {
      compositionRef.current?.stop();
      compositionRef.current = null;
      setToast({
        type: "error",
        message: caughtError instanceof Error ? caughtError.message : "Unable to prepare the recording.",
      });
    } finally {
      startInFlightRef.current = false;
      setIsPreparingRecording(false);
    }
  };

  const handleStopRecording = useCallback(
    async (endReason: "sharing" | "audio" | "camera" | "microphone" | null = null) => {
      if (stopInFlightRef.current) return;
      stopInFlightRef.current = true;

      try {
        const result = await stopRecording();
        if (!result) return;
        setHasPlayedPreview(false);
        setIsSavedToLibrary(false);
        setToast({
          type: "info",
          message:
            endReason === "sharing"
              ? "Screen sharing ended, so the recording was stopped safely. Review it below."
              : endReason === "audio"
                ? "Shared audio ended, so recording stopped before it could continue silently."
                : endReason === "camera"
                  ? "The webcam disconnected, so the recording was stopped safely."
                  : endReason === "microphone"
                    ? "The microphone disconnected, so the recording was stopped safely."
                : "Recording ready. Play the preview before saving or downloading.",
        });
      } finally {
        compositionRef.current?.stop();
        compositionRef.current = null;
        stopInFlightRef.current = false;
      }
    },
    [stopRecording],
  );

  useEffect(() => {
    if (isRecordingActive) {
      if (screen.stream) {
        screenWasLiveDuringRecordingRef.current = true;
      } else if (screenWasLiveDuringRecordingRef.current && !stopInFlightRef.current) {
        screenWasLiveDuringRecordingRef.current = false;
        void handleStopRecording("sharing");
      }
      return;
    }

    screenWasLiveDuringRecordingRef.current = false;
  }, [handleStopRecording, isRecordingActive, screen.stream]);

  useEffect(() => {
    if (isRecordingActive && hasScreen && !allowSilentScreen) {
      if (screen.hasDisplayAudio) {
        screenAudioWasLiveDuringRecordingRef.current = true;
      } else if (screenAudioWasLiveDuringRecordingRef.current && !stopInFlightRef.current) {
        screenAudioWasLiveDuringRecordingRef.current = false;
        void handleStopRecording("audio");
      }
      return;
    }

    if (!isRecordingActive) screenAudioWasLiveDuringRecordingRef.current = false;
  }, [allowSilentScreen, handleStopRecording, hasScreen, isRecordingActive, screen.hasDisplayAudio]);

  useEffect(() => {
    if (isRecordingActive) {
      if (camera.stream) {
        cameraWasLiveDuringRecordingRef.current = true;
      } else if (cameraWasLiveDuringRecordingRef.current && !stopInFlightRef.current) {
        cameraWasLiveDuringRecordingRef.current = false;
        void handleStopRecording("camera");
      }
      return;
    }

    cameraWasLiveDuringRecordingRef.current = false;
  }, [camera.stream, handleStopRecording, isRecordingActive]);

  useEffect(() => {
    if (isRecordingActive) {
      if (microphone.stream) {
        microphoneWasLiveDuringRecordingRef.current = true;
      } else if (microphoneWasLiveDuringRecordingRef.current && !stopInFlightRef.current) {
        microphoneWasLiveDuringRecordingRef.current = false;
        void handleStopRecording("microphone");
      }
      return;
    }

    microphoneWasLiveDuringRecordingRef.current = false;
  }, [handleStopRecording, isRecordingActive, microphone.stream]);

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

  const recorderBadgeStatus =
    recorder.status === "recording"
      ? "recording"
      : recorder.status === "paused"
        ? "paused"
        : recorder.status === "error"
          ? "error"
          : recorder.result
            ? "ready"
            : "idle";

  const surfaceLabel =
    screen.displaySurface === "browser"
      ? "Browser tab"
      : screen.displaySurface === "window"
        ? "Window"
        : screen.displaySurface === "monitor"
          ? "Full display"
          : "Shared source";

  const handleSetupTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentSection: SetupSection) => {
    const currentIndex = setupSections.findIndex((section) => section.id === currentSection);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % setupSections.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + setupSections.length) % setupSections.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = setupSections.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextSection = setupSections[nextIndex].id;
    setActiveSetupSection(nextSection);
    window.requestAnimationFrame(() => document.getElementById(`setup-tab-${nextSection}`)?.focus());
  };

  return (
    <main className="min-h-[calc(100svh-4rem)]">
      <ToastNotification
        type={toast ? toast.type : visibleCombinedError ? "error" : undefined}
        message={toast?.message || visibleCombinedError}
        onDismiss={() => {
          if (toast) setToast(null);
          else if (visibleCombinedError) setDismissedErrors((current) => [...current, visibleCombinedError]);
        }}
      />

      <div className="mx-auto grid w-full max-w-[1320px] gap-4 px-3 py-4 sm:px-6 sm:py-6">
        <section className="flex flex-col gap-4 rounded-2xl border border-studio-border bg-gradient-to-br from-studio-panel to-studio-card p-4 shadow-studio sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-cyan">Private browser studio</p>
            <h1 className="mt-2 text-2xl font-semibold text-studio-text sm:text-3xl">Record your tab, camera, and voice</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-studio-muted sm:text-base">
              One webcam, captured tab audio, and every recording control in a focused local workflow.
            </p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            icon={<SlidersHorizontal className="h-5 w-5" />}
            aria-haspopup="dialog"
            aria-expanded={isSetupOpen}
            aria-controls="studio-setup-sheet"
            onClick={() => {
              setActiveSetupSection("sources");
              setIsSetupOpen(true);
            }}
            className="w-full shrink-0 sm:w-auto"
          >
            Studio setup
            <span
              className={cn(
                "ml-1 rounded-full px-2 py-0.5 text-xs",
                setupIssueCount === 0 ? "bg-studio-success/15 text-green-200" : "bg-amber-400/15 text-amber-100",
              )}
            >
              {setupIssueCount === 0 ? "Ready" : `${setupIssueCount} ${setupIssueCount === 1 ? "issue" : "issues"}`}
            </span>
          </Button>
        </section>

        <Card className="overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-3 border-b border-studio-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-studio-text">Live stage</h2>
              <p className="mt-1 text-sm text-studio-muted">
                {layoutOptions.find((option) => option.id === layout)?.name} · {activeSourceCount} visual {activeSourceCount === 1 ? "source" : "sources"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Timer durationMs={recorder.durationMs} />
              <StatusBadge status={recorderBadgeStatus}>{recorder.status}</StatusBadge>
            </div>
          </div>
          <div className="aspect-video max-h-[calc(100svh-15rem)] min-h-56 bg-black sm:min-h-72">
            <LiveStage layout={layout} screenStream={screen.stream} cameraStream={camera.stream} />
          </div>
        </Card>

        <Card className="rounded-2xl p-4 sm:p-5">
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
          <div
            className={cn(
              "mx-auto mt-4 flex max-w-3xl items-start gap-2 rounded-xl border p-3 text-sm leading-6",
              canStartRecording
                ? "border-studio-success/25 bg-studio-success/[0.08] text-green-100"
                : "border-studio-border bg-white/[0.03] text-studio-muted",
            )}
          >
            {canStartRecording ? (
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />
            ) : (
              <Info className="mt-1 h-4 w-4 shrink-0" />
            )}
            <span>
              {isRecordingActive
                ? "Recording is in progress. Setup controls are locked."
                : isPreparingRecording
                  ? "Preparing the selected sources and audio mix…"
                  : readinessMessage}
            </span>
          </div>
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

        <section aria-label="Source previews" className="grid gap-4 lg:grid-cols-2">
          <ScreenPreview stream={screen.stream} />
          <CameraPreview stream={camera.stream} label="Webcam preview" />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-2xl p-4 sm:p-5">
            <h2 className="text-base font-semibold text-studio-text">Current setup</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-xl border border-studio-border bg-white/[0.03] p-3">
                <p className="text-xs text-studio-muted">Shared source</p>
                <p className="mt-1 text-sm font-medium text-studio-text">{hasScreen ? surfaceLabel : "Not selected"}</p>
              </div>
              <div className="rounded-xl border border-studio-border bg-white/[0.03] p-3">
                <p className="text-xs text-studio-muted">Tab audio</p>
                <p className={cn("mt-1 text-sm font-medium", screen.hasDisplayAudio ? "text-green-200" : "text-studio-text")}>
                  {screen.hasDisplayAudio ? "Included" : "Not included"}
                </p>
              </div>
              <div className="rounded-xl border border-studio-border bg-white/[0.03] p-3">
                <p className="text-xs text-studio-muted">Microphone check</p>
                <p className={cn("mt-1 text-sm font-medium", hasCompletedMicTest ? "text-green-200" : "text-studio-text")}>
                  {!hasMicrophone ? "Mic off" : hasCompletedMicTest ? "Completed" : "Not run (optional)"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-studio-text">
              <Info className="h-4 w-4 text-studio-cyan" />
              Browser notes
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-studio-muted">
              <li>Use desktop Chrome or Edge for the broadest capture and tab-audio support.</li>
              <li>For Google Meet, choose Chrome Tab and enable Share tab audio.</li>
              <li>Use headphones when adding your microphone to prevent echo.</li>
              <li>Screen only records the shared track directly for reliable background capture.</li>
            </ul>
            {layout !== "screen-only" ? (
              <div className="mt-4 flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/[0.08] p-3 text-sm leading-6 text-amber-100">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                Layouts with a webcam are composed by this page. Keep the studio visible while recording, or choose Screen only for a Meet tab in the foreground.
              </div>
            ) : null}
            {insecureNetworkOrigin ? (
              <div className="mt-4 flex gap-3 rounded-xl border border-studio-danger/35 bg-studio-danger/10 p-3 text-sm leading-6 text-red-100">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                {getSecureContextMessage()}
              </div>
            ) : null}
          </Card>
        </section>
      </div>

      <StudioSetupSheet isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} locked={sourcesLocked}>
        <div
          role="tablist"
          aria-label="Studio setup sections"
          className="grid grid-cols-3 gap-2 rounded-xl border border-studio-border bg-white/[0.03] p-1"
        >
          {setupSections.map((section) => {
            const isActive = section.id === activeSetupSection;

            return (
              <button
                key={section.id}
                id={`setup-tab-${section.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`setup-panel-${section.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveSetupSection(section.id)}
                onKeyDown={(event) => handleSetupTabKeyDown(event, section.id)}
                className={cn(
                  "rounded-lg px-2 py-2 text-center text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-cyan",
                  isActive
                    ? "bg-studio-accent text-white shadow-sm"
                    : "text-studio-muted hover:bg-white/[0.06] hover:text-studio-text",
                )}
              >
                {section.label}
              </button>
            );
          })}
        </div>

        <section
          id="setup-panel-sources"
          role="tabpanel"
          aria-labelledby="setup-tab-sources"
          hidden={activeSetupSection !== "sources"}
          className="rounded-2xl border border-studio-border bg-studio-card/75 p-4"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-studio-cyan">01 · Sources</p>
              <h3 className="mt-1 text-base font-semibold text-studio-text">Choose what to record</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={sourcesLocked}
              onClick={() => void devices.refreshDevices()}
              aria-label="Refresh camera and microphone devices"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-xl border border-studio-cyan/25 bg-studio-cyan/[0.07] p-3 text-sm leading-6 text-cyan-50">
            <strong>Google Meet:</strong> choose <strong>Chrome Tab</strong>, select the Meet tab, and turn on <strong>Share tab audio</strong>.
          </div>

          <div className="mt-5 grid gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-studio-text">Tab, window, or screen</span>
                {screen.stream ? <StatusBadge status="connected">{surfaceLabel}</StatusBadge> : null}
              </div>
              <Button
                variant="secondary"
                icon={<MonitorUp className="h-4 w-4" />}
                isLoading={screen.isLoading}
                disabled={sourcesLocked}
                onClick={() => void handleSelectScreen()}
                className="w-full"
              >
                {screen.stream ? "Change shared source" : "Choose shared source"}
              </Button>
              {screen.stream ? (
                <Button
                  variant="ghost"
                  icon={<StopCircle className="h-4 w-4" />}
                  disabled={sourcesLocked}
                  onClick={screen.stopScreen}
                  className="mt-2 w-full"
                >
                  Stop sharing
                </Button>
              ) : null}

              {screen.stream ? (
                screen.hasDisplayAudio ? (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-studio-success/30 bg-studio-success/10 p-3 text-xs leading-5 text-green-100">
                    <Volume2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span><strong>Tab audio included.</strong> Shared sound will be mixed into the recording.</span>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-amber-400/35 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
                    <div className="flex items-start gap-2">
                      <VolumeX className="mt-0.5 h-4 w-4 shrink-0" />
                      <span><strong>No shared audio.</strong> Reselect a browser tab and enable Share tab audio.</span>
                    </div>
                    {!allowSilentScreen ? (
                      <button
                        type="button"
                        disabled={sourcesLocked}
                        className="mt-2 font-semibold text-amber-50 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-50"
                        onClick={() => setAllowSilentScreen(true)}
                      >
                        Continue without tab audio
                      </button>
                    ) : (
                      <p className="mt-2 font-medium">Silent shared-source recording approved.</p>
                    )}
                  </div>
                )
              ) : null}
            </div>

            <div className="grid gap-3 border-t border-studio-border pt-5">
              <DeviceSelector
                label="One webcam"
                devices={devices.cameras}
                value={selectedCameraId}
                placeholder={devices.isLoading ? "Loading webcams" : "Default webcam"}
                disabled={sourcesLocked}
                onChange={(deviceId) => {
                  setSelectedCameraId(deviceId);
                  if (camera.stream) void camera.startCamera(deviceId || undefined);
                }}
              />
              <Button
                variant="secondary"
                icon={camera.stream ? <VideoOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                isLoading={camera.isLoading}
                disabled={sourcesLocked}
                onClick={() => {
                  if (camera.stream) camera.stopCamera();
                  else void handleEnableCamera();
                }}
                className="w-full"
              >
                {camera.stream ? "Turn off webcam" : "Enable webcam"}
              </Button>
            </div>

            <div className="grid gap-3 border-t border-studio-border pt-5">
              <DeviceSelector
                label="Microphone"
                devices={devices.microphones}
                value={selectedMicrophoneId}
                placeholder={devices.isLoading ? "Loading microphones" : "Default microphone"}
                disabled={sourcesLocked}
                onChange={(deviceId) => {
                  setSelectedMicrophoneId(deviceId);
                  setMicTestResult(null);
                  setHasPlayedMicTest(false);
                  if (microphone.stream) void microphone.startMicrophone(deviceId || undefined);
                }}
              />
              <Button
                variant="secondary"
                icon={microphone.stream ? <MicOff className="h-4 w-4" /> : <Mic2 className="h-4 w-4" />}
                isLoading={microphone.isLoading}
                disabled={sourcesLocked}
                onClick={() => {
                  if (microphone.stream) handleStopMicrophone();
                  else void handleEnableMicrophone();
                }}
                className="w-full"
              >
                {microphone.stream ? "Turn off microphone" : "Enable microphone"}
              </Button>
            </div>
          </div>
        </section>

        <section
          id="setup-panel-layout"
          role="tabpanel"
          aria-labelledby="setup-tab-layout"
          hidden={activeSetupSection !== "layout"}
          className="rounded-2xl border border-studio-border bg-studio-card/75 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-studio-cyan">02 · Layout</p>
          <h3 className="mb-4 mt-1 text-base font-semibold text-studio-text">Choose the composition</h3>
          <LayoutSelector layouts={layoutOptions} value={layout} onChange={setLayout} disabled={sourcesLocked} />
        </section>

        <section
          id="setup-panel-voice"
          role="tabpanel"
          aria-labelledby="setup-tab-voice"
          hidden={activeSetupSection !== "voice"}
          className="rounded-2xl border border-studio-border bg-studio-card/75 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-studio-cyan">03 · Voice</p>
          <h3 className="mt-1 text-base font-semibold text-studio-text">Choose and test your sound</h3>
          <p className="mt-1 text-xs leading-5 text-studio-muted">
            Voice modes affect only your microphone; the check below is optional and captured tab audio stays natural.
          </p>
          <div className="mt-4 grid gap-5">
            <AudioLevelMeter level={microphone.level} />
            <VoiceModeSelector
              options={audioModeOptions}
              value={audioMode}
              onChange={handleAudioModeChange}
              disabled={sourcesLocked}
            />
            <MicrophoneVoiceTest
              microphoneStream={microphone.stream}
              audioMode={audioMode}
              disabled={sourcesLocked}
              onResult={(result) => {
                setMicTestResult(result);
                setHasPlayedMicTest(false);
              }}
              onPlayback={(result) => {
                if (result.audioMode === audioMode) setHasPlayedMicTest(true);
              }}
            />
            {hasCompletedMicTest ? (
              <div className="flex items-start gap-2 rounded-xl border border-studio-success/30 bg-studio-success/10 p-3 text-xs leading-5 text-green-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                This voice mode has been recorded and played back. It is ready for the final recording.
              </div>
            ) : null}
          </div>
        </section>

        {sourcesLocked ? (
          <div className="flex items-start gap-2 rounded-xl border border-studio-border bg-white/[0.03] p-3 text-xs leading-5 text-studio-muted">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            Source, layout, and voice controls remain locked until the current recording stops.
          </div>
        ) : null}
      </StudioSetupSheet>
    </main>
  );
}
