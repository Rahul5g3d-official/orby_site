import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useMicrophoneTest,
  type MicrophoneTestResult,
  type UseMicrophoneTestResult,
} from "../../hooks/useMicrophoneTest";
import { MicrophoneVoiceTest } from "./MicrophoneVoiceTest";

vi.mock("../../hooks/useMicrophoneTest", () => ({
  useMicrophoneTest: vi.fn(),
}));

const mockedUseMicrophoneTest = vi.mocked(useMicrophoneTest);

describe("MicrophoneVoiceTest", () => {
  const sample: MicrophoneTestResult = {
    blob: new Blob(["voice sample"], { type: "audio/webm" }),
    url: "blob:ready-voice-sample",
    durationMs: 1_250,
    mimeType: "audio/webm",
    audioMode: "broadcast",
  };

  beforeEach(() => {
    const state: UseMicrophoneTestResult = {
      status: "ready",
      result: sample,
      error: null,
      durationMs: sample.durationMs,
      maxDurationMs: 8_000,
      isMicrophoneReady: true,
      startTest: vi.fn(async () => true),
      stopTest: vi.fn(async () => sample),
      resetTest: vi.fn(),
    };
    mockedUseMicrophoneTest.mockReturnValue(state);
  });

  it("reports playback of the processed sample to its caller", () => {
    const onPlayback = vi.fn();
    render(
      <MicrophoneVoiceTest
        microphoneStream={null}
        audioMode="broadcast"
        onPlayback={onPlayback}
      />,
    );

    const playback = screen.getByLabelText("Broadcast microphone test playback");
    expect(screen.getByText("Sample ready · 1.3s")).toBeInTheDocument();

    fireEvent.play(playback);

    expect(onPlayback).toHaveBeenCalledOnce();
    expect(onPlayback).toHaveBeenCalledWith(sample);
  });
});
