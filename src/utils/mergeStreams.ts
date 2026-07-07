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
  destination: MediaStreamAudioDestinationNode,
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
  lowShelf.frequency.value = mode === "warm" || mode === "broadcast" ? 180 : 140;
  lowShelf.gain.value = mode === "warm" ? 3 : mode === "broadcast" ? 2 : 0;

  const presence = context.createBiquadFilter();
  presence.type = "peaking";
  presence.frequency.value = mode === "warm" ? 2800 : 3400;
  presence.Q.value = 0.9;
  presence.gain.value =
    mode === "voice-boost" ? 5 : mode === "broadcast" ? 3.5 : mode === "noise-reduced" ? 2 : -0.5;

  const lowPass = context.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = mode === "noise-reduced" ? 8500 : 12500;
  lowPass.Q.value = 0.4;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = mode === "broadcast" ? -32 : mode === "voice-boost" ? -28 : -24;
  compressor.knee.value = 18;
  compressor.ratio.value = mode === "broadcast" ? 5 : 3;
  compressor.attack.value = 0.006;
  compressor.release.value = mode === "broadcast" ? 0.18 : 0.25;

  const gain = context.createGain();
  gain.gain.value = mode === "voice-boost" ? 1.18 : mode === "broadcast" ? 1.12 : 1.04;

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
  const audioSources = sources.filter((source): source is AudioMixSource & { stream: MediaStream } =>
    Boolean(source.stream?.getAudioTracks().some((track) => track.readyState === "live")),
  );

  if (audioSources.length === 0) {
    return { stream: null, stop: () => undefined };
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const context = new AudioContextClass();
  await context.resume();
  const destination = context.createMediaStreamDestination();
  const nodes: AudioNode[] = [];
  const streamSources = audioSources.map((audioSource) => {
    const source = context.createMediaStreamSource(audioSource.stream);

    if (audioSource.role === "voice") {
      nodes.push(...connectVoiceMode(context, source, destination, audioMode));
    } else {
      source.connect(destination);
    }

    return source;
  });

  return {
    stream: destination.stream,
    stop: () => {
      streamSources.forEach((source) => source.disconnect());
      nodes.forEach((node) => node.disconnect());
      destination.stream.getTracks().forEach((track) => track.stop());
      void context.close();
    },
  };
}
