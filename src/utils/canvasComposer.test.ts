import { describe, expect, it, vi } from "vitest";
import { createMockStream, MockMediaStreamTrack } from "../test/mediaMocks";
import { createCanvasComposition } from "./canvasComposer";

describe("createCanvasComposition screen-only mode", () => {
  it("preserves a cloned display video track and cloned tab-audio track", async () => {
    const displayVideo = new MockMediaStreamTrack("video", "Shared tab");
    const displayAudio = new MockMediaStreamTrack("audio", "Shared tab audio");
    const screenStream = createMockStream(displayVideo, displayAudio);

    const composition = await createCanvasComposition({
      layout: "screen-only",
      screenStream,
      localCameraStream: null,
      microphoneStream: null,
      audioMode: "broadcast",
    });

    expect(composition.mode).toBe("direct");
    expect(composition.canvas).toBeNull();
    expect(composition.stream.getVideoTracks()).toEqual([
      displayVideo.clone.mock.results[0].value,
    ]);
    expect(composition.stream.getAudioTracks()).toEqual([
      displayAudio.clone.mock.results[0].value,
    ]);
    expect(displayVideo.clone).toHaveBeenCalledOnce();
    expect(displayAudio.clone).toHaveBeenCalledOnce();

    composition.stop();

    expect(
      composition.stream
        .getTracks()
        .every((track) => track.readyState === "ended"),
    ).toBe(true);
    expect(displayVideo.readyState).toBe("live");
    expect(displayAudio.readyState).toBe("live");
  });

  it("rejects recording before a live display video track is selected", async () => {
    await expect(
      createCanvasComposition({
        layout: "screen-only",
        screenStream: null,
        localCameraStream: null,
        microphoneStream: null,
        audioMode: "natural",
      }),
    ).rejects.toThrow(
      "Choose a browser tab, window, or screen before recording.",
    );
  });
});

describe("createCanvasComposition camera-only mode", () => {
  it("uses a direct cloned webcam track with optional microphone audio", async () => {
    const cameraVideo = new MockMediaStreamTrack("video", "Front camera");
    const microphoneAudio = new MockMediaStreamTrack("audio", "Microphone");
    const cameraStream = createMockStream(cameraVideo);
    const microphoneStream = createMockStream(microphoneAudio);
    const captureStream = vi.mocked(HTMLCanvasElement.prototype.captureStream);

    const composition = await createCanvasComposition({
      layout: "camera-only",
      screenStream: null,
      localCameraStream: cameraStream,
      microphoneStream,
      audioMode: "natural",
    });

    expect(composition.mode).toBe("direct");
    expect(composition.canvas).toBeNull();
    expect(composition.stream.getVideoTracks()).toEqual([
      cameraVideo.clone.mock.results[0].value,
    ]);
    expect(composition.stream.getAudioTracks()).toEqual([
      microphoneAudio.clone.mock.results[0].value,
    ]);
    expect(cameraVideo.clone).toHaveBeenCalledOnce();
    expect(microphoneAudio.clone).toHaveBeenCalledOnce();
    expect(captureStream).not.toHaveBeenCalled();

    composition.stop();

    expect(
      composition.stream
        .getTracks()
        .every((track) => track.readyState === "ended"),
    ).toBe(true);
    expect(cameraVideo.readyState).toBe("live");
    expect(microphoneAudio.readyState).toBe("live");
  });

  it("rejects recording before a live webcam track is enabled", async () => {
    await expect(
      createCanvasComposition({
        layout: "camera-only",
        screenStream: null,
        localCameraStream: null,
        microphoneStream: null,
        audioMode: "natural",
      }),
    ).rejects.toThrow(/webcam/i);
  });
});
