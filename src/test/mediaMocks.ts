import { vi } from "vitest";

let nextTrackId = 0;
let nextStreamId = 0;

export class MockMediaStreamTrack extends EventTarget {
  readonly id = `track-${nextTrackId++}`;
  readonly label: string;
  readonly kind: "audio" | "video";
  enabled = true;
  muted = false;
  readyState: MediaStreamTrackState = "live";

  constructor(kind: "audio" | "video", label = `${kind} track`) {
    super();
    this.kind = kind;
    this.label = label;
  }

  readonly clone = vi.fn(() => {
    const clonedTrack = new MockMediaStreamTrack(this.kind, `${this.label} clone`);
    clonedTrack.enabled = this.enabled;
    return clonedTrack.asMediaStreamTrack();
  });

  readonly stop = vi.fn(() => {
    if (this.readyState === "ended") return;
    this.readyState = "ended";
    this.dispatchEvent(new Event("ended"));
  });

  asMediaStreamTrack(): MediaStreamTrack {
    return this as unknown as MediaStreamTrack;
  }
}

export class MockMediaStream extends EventTarget {
  readonly id = `stream-${nextStreamId++}`;
  active = true;
  private readonly tracks: MediaStreamTrack[];

  constructor(tracks: MediaStreamTrack[] = []) {
    super();
    this.tracks = [...tracks];
  }

  getTracks(): MediaStreamTrack[] {
    return [...this.tracks];
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this.tracks.filter((track) => track.kind === "audio");
  }

  getVideoTracks(): MediaStreamTrack[] {
    return this.tracks.filter((track) => track.kind === "video");
  }

  addTrack(track: MediaStreamTrack): void {
    if (!this.tracks.includes(track)) this.tracks.push(track);
  }

  removeTrack(track: MediaStreamTrack): void {
    const index = this.tracks.indexOf(track);
    if (index >= 0) this.tracks.splice(index, 1);
  }

  asMediaStream(): MediaStream {
    return this as unknown as MediaStream;
  }
}

export function createMockStream(...tracks: MockMediaStreamTrack[]): MediaStream {
  return new MockMediaStream(tracks.map((track) => track.asMediaStreamTrack())).asMediaStream();
}

export function installMediaStreamMock(): void {
  Object.defineProperty(globalThis, "MediaStream", {
    configurable: true,
    writable: true,
    value: MockMediaStream,
  });
}
