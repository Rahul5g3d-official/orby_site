import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockStream } from "../test/mediaMocks";
import {
  buildRecordingFilename,
  createMediaRecorder,
  getSupportedRecorderMimeType,
} from "./recorderService";

class MockMediaRecorder {
  static readonly isTypeSupported = vi.fn(
    (mimeType: string) => mimeType.length < 0,
  );

  readonly stream: MediaStream;
  readonly options: MediaRecorderOptions | undefined;

  constructor(stream: MediaStream, options?: MediaRecorderOptions) {
    this.stream = stream;
    this.options = options;
  }
}

describe("recorderService", () => {
  beforeEach(() => {
    MockMediaRecorder.isTypeSupported.mockReset();
    MockMediaRecorder.isTypeSupported.mockReturnValue(false);
    Object.defineProperty(globalThis, "MediaRecorder", {
      configurable: true,
      writable: true,
      value: MockMediaRecorder,
    });
  });

  it("chooses the first supported WebM MIME type in quality order", () => {
    MockMediaRecorder.isTypeSupported.mockImplementation(
      (mimeType) => mimeType === "video/webm;codecs=vp8,opus",
    );

    expect(getSupportedRecorderMimeType()).toBe("video/webm;codecs=vp8,opus");
    expect(
      MockMediaRecorder.isTypeSupported.mock.calls.map(
        ([mimeType]) => mimeType,
      ),
    ).toEqual(["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus"]);
  });

  it("falls back to an option-less recorder when no declared MIME type is supported", () => {
    const stream = createMockStream();

    expect(getSupportedRecorderMimeType()).toBe("");
    const recorder = createMediaRecorder(
      stream,
    ) as unknown as MockMediaRecorder;

    expect(recorder).toBeInstanceOf(MockMediaRecorder);
    expect(recorder.stream).toBe(stream);
    expect(recorder.options).toBeUndefined();
  });

  it("passes the selected MIME type to MediaRecorder", () => {
    MockMediaRecorder.isTypeSupported.mockImplementation(
      (mimeType) => mimeType === "video/webm",
    );

    const recorder = createMediaRecorder(
      createMockStream(),
    ) as unknown as MockMediaRecorder;

    expect(recorder.options).toEqual({ mimeType: "video/webm" });
  });

  it("builds a stable UTC-dated WebM filename", () => {
    const createdAt = new Date("2026-07-11T23:59:59.000Z");

    expect(buildRecordingFilename(createdAt)).toBe(
      "screen-recording-2026-07-11.webm",
    );
  });
});
