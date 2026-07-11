import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockStream, MockMediaStreamTrack } from "../test/mediaMocks";
import type { AudioMode } from "../types/media";
import { createMixedAudioStream } from "../utils/mergeStreams";
import {
  useMicrophoneTest,
  type MicrophoneTestResult,
} from "./useMicrophoneTest";

vi.mock("../utils/mergeStreams", () => ({
  createMixedAudioStream: vi.fn(),
}));

class MockMediaRecorder {
  static readonly isTypeSupported = vi.fn(
    (mimeType: string) => mimeType === "audio/webm;codecs=opus",
  );

  state: RecordingState = "inactive";
  readonly mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onstop: ((event: Event) => void) | null = null;

  constructor(
    readonly stream: MediaStream,
    options?: MediaRecorderOptions,
  ) {
    this.mimeType = options?.mimeType ?? "";
  }

  start(): void {
    this.state = "recording";
  }

  stop(): void {
    this.state = "inactive";
    queueMicrotask(() => {
      const data = new Blob(["processed microphone sample"], {
        type: this.mimeType || "audio/webm",
      });
      this.ondataavailable?.({ data } as BlobEvent);
      this.onstop?.(new Event("stop"));
    });
  }
}

const mockedCreateMixedAudioStream = vi.mocked(createMixedAudioStream);

function createReadyMicrophone() {
  const sourceTrack = new MockMediaStreamTrack("audio", "Selected microphone");
  return {
    sourceTrack,
    stream: createMockStream(sourceTrack),
  };
}

function mockProcessedAudio() {
  const processedTrack = new MockMediaStreamTrack("audio", "Processed sample");
  const stop = vi.fn(() => processedTrack.stop());
  mockedCreateMixedAudioStream.mockResolvedValueOnce({
    stream: createMockStream(processedTrack),
    stop,
  });
  return { processedTrack, stop };
}

async function recordSample(result: {
  current: ReturnType<typeof useMicrophoneTest>;
}): Promise<MicrophoneTestResult | null> {
  let started = false;
  await act(async () => {
    started = await result.current.startTest();
  });
  expect(started).toBe(true);
  expect(result.current.status).toBe("recording");

  let sample: MicrophoneTestResult | null = null;
  await act(async () => {
    sample = await result.current.stopTest();
  });
  return sample;
}

describe("useMicrophoneTest", () => {
  let nextObjectUrl = 0;
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockedCreateMixedAudioStream.mockReset();
    MockMediaRecorder.isTypeSupported.mockClear();
    Object.defineProperty(globalThis, "MediaRecorder", {
      configurable: true,
      writable: true,
      value: MockMediaRecorder,
    });

    createObjectURL = vi.fn(() => `blob:microphone-test-${nextObjectUrl++}`);
    revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });
  });

  it("requires a live, enabled microphone before starting", async () => {
    const { result } = renderHook(() =>
      useMicrophoneTest({ microphoneStream: null, audioMode: "natural" }),
    );

    let started = true;
    await act(async () => {
      started = await result.current.startTest();
    });

    expect(started).toBe(false);
    expect(result.current.isMicrophoneReady).toBe(false);
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(
      "Choose and enable a microphone before recording a test sample.",
    );
    expect(mockedCreateMixedAudioStream).not.toHaveBeenCalled();
  });

  it("turns a non-empty processed recording into a ready sample without stopping the source mic", async () => {
    const microphone = createReadyMicrophone();
    const processed = mockProcessedAudio();
    const { result } = renderHook(() =>
      useMicrophoneTest({
        microphoneStream: microphone.stream,
        audioMode: "voice-boost",
        maxDurationMs: 1_000,
      }),
    );

    const sample = await recordSample(result);

    expect(mockedCreateMixedAudioStream).toHaveBeenCalledWith(
      [{ stream: microphone.stream, role: "voice" }],
      "voice-boost",
    );
    expect(sample).not.toBeNull();
    expect(result.current.status).toBe("ready");
    expect(result.current.result).toEqual(sample);
    expect(sample?.blob.size).toBeGreaterThan(0);
    expect(sample?.mimeType).toBe("audio/webm;codecs=opus");
    expect(sample?.audioMode).toBe("voice-boost");
    expect(createObjectURL).toHaveBeenCalledWith(sample?.blob);
    expect(processed.stop).toHaveBeenCalledOnce();
    expect(processed.processedTrack.readyState).toBe("ended");
    expect(microphone.sourceTrack.stop).not.toHaveBeenCalled();
    expect(microphone.sourceTrack.readyState).toBe("live");
  });

  it("reset discards the ready result and revokes its temporary URL", async () => {
    const microphone = createReadyMicrophone();
    mockProcessedAudio();
    const { result } = renderHook(() =>
      useMicrophoneTest({
        microphoneStream: microphone.stream,
        audioMode: "natural",
      }),
    );
    const sample = await recordSample(result);

    act(() => result.current.resetTest());

    expect(revokeObjectURL).toHaveBeenCalledWith(sample?.url);
    expect(result.current.result).toBeNull();
    expect(result.current.status).toBe("idle");
    expect(result.current.durationMs).toBe(0);
    expect(microphone.sourceTrack.stop).not.toHaveBeenCalled();
  });

  it("changing voice mode invalidates and revokes the previous processed sample", async () => {
    const microphone = createReadyMicrophone();
    mockProcessedAudio();
    const { result, rerender } = renderHook(
      ({ audioMode }: { audioMode: AudioMode }) =>
        useMicrophoneTest({ microphoneStream: microphone.stream, audioMode }),
      { initialProps: { audioMode: "broadcast" as AudioMode } },
    );
    const sample = await recordSample(result);

    rerender({ audioMode: "warm" });

    expect(revokeObjectURL).toHaveBeenCalledWith(sample?.url);
    expect(result.current.result).toBeNull();
    expect(result.current.status).toBe("idle");
    expect(microphone.sourceTrack.stop).not.toHaveBeenCalled();
  });
});
