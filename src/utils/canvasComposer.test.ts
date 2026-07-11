import { describe, expect, it } from "vitest";
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
    expect(composition.stream.getVideoTracks()).toEqual([displayVideo.clone.mock.results[0].value]);
    expect(composition.stream.getAudioTracks()).toEqual([displayAudio.clone.mock.results[0].value]);
    expect(displayVideo.clone).toHaveBeenCalledOnce();
    expect(displayAudio.clone).toHaveBeenCalledOnce();

    composition.stop();

    expect(composition.stream.getTracks().every((track) => track.readyState === "ended")).toBe(true);
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
    ).rejects.toThrow("Choose a browser tab, window, or screen before recording.");
  });
});
