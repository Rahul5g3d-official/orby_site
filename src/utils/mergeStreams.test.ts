import { describe, expect, it } from "vitest";
import { createMockStream, MockMediaStreamTrack } from "../test/mediaMocks";
import { createMixedAudioStream } from "./mergeStreams";

describe("createMixedAudioStream", () => {
  it("directly clones one natural voice track without creating an audio graph", async () => {
    const microphoneTrack = new MockMediaStreamTrack("audio", "Microphone");
    const microphoneStream = createMockStream(microphoneTrack);

    const mixed = await createMixedAudioStream(
      [{ stream: microphoneStream, role: "voice" }],
      "natural",
    );

    const outputTrack = mixed.stream?.getAudioTracks()[0];
    expect(microphoneTrack.clone).toHaveBeenCalledOnce();
    expect(outputTrack).toBe(microphoneTrack.clone.mock.results[0].value);
    expect(outputTrack).not.toBe(microphoneTrack.asMediaStreamTrack());

    mixed.stop();

    expect(outputTrack?.readyState).toBe("ended");
    expect(microphoneTrack.readyState).toBe("live");
  });

  it("ignores ended audio tracks", async () => {
    const endedTrack = new MockMediaStreamTrack("audio");
    endedTrack.stop();

    const mixed = await createMixedAudioStream(
      [{ stream: createMockStream(endedTrack), role: "system" }],
      "broadcast",
    );

    expect(mixed.stream).toBeNull();
    expect(endedTrack.clone).not.toHaveBeenCalled();
    expect(() => mixed.stop()).not.toThrow();
  });
});
