import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockStream } from "../test/mediaMocks";
import { getMediaErrorMessage, requestScreen, supportsRecordingApis } from "./mediaService";

describe("mediaService", () => {
  const getUserMedia = vi.fn();
  const getDisplayMedia = vi.fn();

  beforeEach(() => {
    getUserMedia.mockReset();
    getDisplayMedia.mockReset();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia, getDisplayMedia },
    });
    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      writable: true,
      value: class MockMediaRecorder {},
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "captureStream", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  it("detects full recording support and reports a missing required API", () => {
    expect(supportsRecordingApis()).toBe(true);

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });

    expect(supportsRecordingApis()).toBe(false);
  });

  it("requests a browser surface with tab audio and source switching enabled", async () => {
    const displayStream = createMockStream();
    getDisplayMedia.mockResolvedValue(displayStream);

    await expect(requestScreen()).resolves.toBe(displayStream);
    expect(getDisplayMedia).toHaveBeenCalledWith({
      video: {
        displaySurface: "browser",
        frameRate: { ideal: 30, max: 60 },
      },
      audio: {
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false,
        suppressLocalAudioPlayback: false,
      },
      surfaceSwitching: "include",
      systemAudio: "include",
    });
  });

  it.each([
    ["NotAllowedError", "Permission was denied. Enable access and try again."],
    ["NotFoundError", "No matching media device was found."],
    ["NotReadableError", "The media device is already in use by another app."],
    ["AbortError", "The browser cancelled the media request."],
  ])("maps %s browser failures to a useful message", (name, expectedMessage) => {
    expect(getMediaErrorMessage(new DOMException("browser details", name), "Fallback")).toBe(expectedMessage);
  });

  it("preserves regular Error messages and otherwise uses the supplied fallback", () => {
    expect(getMediaErrorMessage(new Error("Device disconnected"), "Fallback")).toBe("Device disconnected");
    expect(getMediaErrorMessage({ reason: "unknown" }, "Fallback")).toBe("Fallback");
  });
});
