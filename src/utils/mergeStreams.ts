import type { AudioMode } from "../types/media";

interface AudioMixSource {
  stream: MediaStream | null | undefined;
  role: "voice" | "system";
}

export interface MixedAudioStream {
  stream: MediaStream | null;
  stop: () => void;
}

function connectVoiceMode(
  context: AudioContext,
  source: MediaStreamAudioSourceNode,
  destination: AudioNode,
  mode: AudioMode,
): AudioNode[] {
  if (mode === "natural") {
    source.connect(destination);
    return [];
  }

  const highPass = context.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = mode === "noise-reduced" ? 120 : 80;
  highPass.Q.value = 0.7;

  const lowShelf = context.createBiquadFilter();
  lowShelf.type = "lowshelf";
  lowShelf.frequency.value =
    mode === "warm" || mode === "broadcast" ? 180 : 140;
  lowShelf.gain.value = mode === "warm" ? 3 : mode === "broadcast" ? 2 : 0;

  const presence = context.createBiquadFilter();
  presence.type = "peaking";
  presence.frequency.value = mode === "warm" ? 2800 : 3400;
  presence.Q.value = 0.9;
  presence.gain.value =
    mode === "voice-boost"
      ? 5
      : mode === "broadcast"
        ? 3.5
        : mode === "noise-reduced"
          ? 2
          : -0.5;

  const lowPass = context.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = mode === "noise-reduced" ? 8500 : 12500;
  lowPass.Q.value = 0.4;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value =
    mode === "broadcast" ? -32 : mode === "voice-boost" ? -28 : -24;
  compressor.knee.value = 18;
  compressor.ratio.value = mode === "broadcast" ? 5 : 3;
  compressor.attack.value = 0.006;
  compressor.release.value = mode === "broadcast" ? 0.18 : 0.25;

  const gain = context.createGain();
  gain.gain.value =
    mode === "voice-boost" ? 1.18 : mode === "broadcast" ? 1.12 : 1.04;

  source.connect(highPass);
  highPass.connect(lowShelf);
  lowShelf.connect(presence);
  presence.connect(lowPass);
  lowPass.connect(compressor);
  compressor.connect(gain);
  gain.connect(destination);

  return [highPass, lowShelf, presence, lowPass, compressor, gain];
}

export async function createMixedAudioStream(
  sources: AudioMixSource[],
  audioMode: AudioMode,
): Promise<MixedAudioStream> {
  const audioSources = sources.filter(
    (source): source is AudioMixSource & { stream: MediaStream } =>
      Boolean(
        source.stream
          ?.getAudioTracks()
          .some((track) => track.readyState === "live"),
      ),
  );

  if (audioSources.length === 0) {
    return { stream: null, stop: () => undefined };
  }

  if (
    audioSources.length === 1 &&
    (audioSources[0].role === "system" || audioMode === "natural")
  ) {
    const sourceTrack = audioSources[0].stream
      .getAudioTracks()
      .find((track) => track.readyState === "live");
    if (!sourceTrack) return { stream: null, stop: () => undefined };

    const clonedTrack = sourceTrack.clone();
    const stream = new MediaStream([clonedTrack]);
    return { stream, stop: () => clonedTrack.stop() };
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error(
      "Audio mixing is unavailable in this browser. Use current Chrome or Edge.",
    );
  }

  const context = new AudioContextClass();
  const destination = context.createMediaStreamDestination();
  const nodes: AudioNode[] = [];
  const streamSources: MediaStreamAudioSourceNode[] = [];
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    streamSources.forEach((source) => source.disconnect());
    nodes.forEach((node) => node.disconnect());
    destination.stream.getTracks().forEach((track) => track.stop());
    void context.close();
  };

  try {
    await context.resume();
    if (context.state !== "running") {
      throw new Error(
        "Audio mixing could not start. Click again or use current Chrome or Edge.",
      );
    }

    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;
    limiter.connect(destination);
    nodes.push(limiter);

    audioSources.forEach((audioSource) => {
      const source = context.createMediaStreamSource(audioSource.stream);
      streamSources.push(source);

      if (audioSource.role === "voice") {
        nodes.push(...connectVoiceMode(context, source, limiter, audioMode));
      } else {
        const gain = context.createGain();
        gain.gain.value = 0.9;
        source.connect(gain);
        gain.connect(limiter);
        nodes.push(gain);
      }
    });

    return { stream: destination.stream, stop };
  } catch (error) {
    stop();
    throw error;
  }
}
