import { ArrowRight, Camera, Download, Grid2X2, Mic2, MonitorUp, Smartphone, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

const features = [
  {
    icon: MonitorUp,
    title: "Screen, tab, or window capture",
    description: "Use the browser picker to capture a presentation, app, tab, or full display with optional tab audio.",
  },
  {
    icon: Camera,
    title: "Selectable cameras",
    description: "Choose the webcam you want, preview it live, and blend it into the final canvas layout.",
  },
  {
    icon: Mic2,
    title: "Microphone metering",
    description: "Pick a microphone, monitor levels, and mix mic audio into the composed recording.",
  },
  {
    icon: Smartphone,
    title: "Phone as camera",
    description: "Scan a room QR code to publish a phone camera stream into the studio over WebRTC.",
  },
  {
    icon: Grid2X2,
    title: "Studio layouts",
    description: "Record screen-only, camera-only, picture-in-picture, side camera, and multi-camera grid layouts.",
  },
  {
    icon: Download,
    title: "Local WebM output",
    description: "Recordings stay in the browser, save to local IndexedDB, and download as .webm files.",
  },
];

const steps = [
  "Choose screen, camera, and microphone sources.",
  "Invite phones with the generated room QR code.",
  "Select a layout and record the composed canvas output.",
];

export function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-studio-border">
        <img
          src="/assets/studio-hero.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.38] sm:opacity-[0.42]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-studio-bg via-studio-bg/90 to-studio-bg/52" />
        <div className="relative mx-auto grid min-h-[calc(100svh-7rem)] max-w-[1480px] content-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <div className="max-w-2xl pb-4">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-studio-cyan/30 bg-studio-cyan/10 px-3 py-1 text-sm text-cyan-100">
              <Video className="h-4 w-4" />
              Browser-based multi-camera recording
            </div>
            <h1 className="text-4xl font-bold leading-tight text-studio-text sm:text-5xl lg:text-[3.75rem]">
              MultiCam Web Recorder
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-studio-muted sm:text-lg">
              A professional recording studio for screen capture, webcam overlays, microphone audio, and phone cameras,
              composed into one downloadable video directly in the browser.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link to="/studio" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto" size="lg" icon={<ArrowRight className="h-5 w-5 shrink-0" />}>
                  Start Recording
                </Button>
              </Link>
              <Link to="/recordings" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto" size="lg" variant="secondary" icon={<Download className="h-5 w-5 shrink-0" />}>
                  View Recordings
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden items-center justify-center lg:flex">
            <div className="w-full max-w-xl rounded-lg border border-studio-border bg-studio-panel/76 p-4 shadow-studio backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-studio-danger" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-studio-success" />
                </div>
                <span className="rounded-full bg-studio-danger/15 px-3 py-1 text-xs text-red-100">REC 00:12</span>
              </div>
              <div className="grid aspect-video grid-cols-[1.5fr_0.8fr] gap-3">
                <div className="rounded-lg border border-studio-border bg-black/75 p-3">
                  <div className="h-full rounded-md bg-slate-800/80" />
                </div>
                <div className="grid gap-3">
                  <div className="rounded-lg border border-studio-border bg-slate-900" />
                  <div className="rounded-lg border border-studio-border bg-slate-900" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 sm:py-14">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-semibold text-studio-text">Built for browser-native recording</h2>
          <p className="mt-3 text-studio-muted">
            The MVP uses WebRTC, MediaRecorder, Canvas capture, AudioContext mixing, and IndexedDB without uploading your recordings.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-lg border border-studio-border bg-studio-card p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-studio-accent/15 text-studio-cyan">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-studio-text">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-studio-muted">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-studio-border bg-studio-panel/45">
        <div className="mx-auto grid max-w-[1480px] gap-8 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-semibold text-studio-text">How it works</h2>
            <p className="mt-3 text-studio-muted">
              Use Chrome or Edge for the broadest support. Multiple cameras depend on device performance, tab audio depends on browser support, and phone cameras require both devices to reach the signaling server.
            </p>
          </div>
          <div className="grid gap-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-lg border border-studio-border bg-studio-card p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-studio-accent text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="text-sm text-studio-text">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
