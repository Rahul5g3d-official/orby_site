import { ArrowRight, Camera, Download, Grid2X2, Headphones, Mic2, MonitorUp, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../utils/cn";

const heroLinkClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border px-5 text-base font-medium leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg sm:w-auto";

const features = [
  {
    icon: MonitorUp,
    title: "Screen, tab, or window capture",
    description: "Capture a browser tab, app window, or full display, including tab audio when the browser provides it.",
  },
  {
    icon: Camera,
    title: "One selectable webcam",
    description: "Choose and preview one webcam at a time, switch inputs when needed, and place it in your layout.",
  },
  {
    icon: Mic2,
    title: "Microphone metering",
    description: "Pick a microphone, monitor levels, and mix mic audio into the composed recording.",
  },
  {
    icon: Headphones,
    title: "Voice mode testing",
    description: "Choose a voice mode, record a short microphone sample, and listen back before the real recording.",
  },
  {
    icon: Grid2X2,
    title: "Studio layouts",
    description: "Use screen-only, webcam-only, bubble, side-by-side, source grid, picture-in-picture, or custom layouts.",
  },
  {
    icon: Download,
    title: "Local WebM output",
    description: "Recordings stay in the browser, save to local IndexedDB, and download as .webm files.",
  },
];

const steps = [
  "Choose screen, camera, and microphone sources.",
  "Choose a voice mode and play back a short microphone test.",
  "Select a layout, record, review, and save your video locally.",
];

export function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-studio-border">
        <img
          src="/assets/screen-recorder-hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.38] sm:opacity-[0.42]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-studio-bg via-studio-bg/90 to-studio-bg/[0.52]" />
        <div className="relative mx-auto grid min-h-[calc(100svh-7rem)] max-w-[1480px] content-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <div className="max-w-2xl pb-4">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-studio-cyan/30 bg-studio-cyan/10 px-3 py-1 text-sm text-cyan-100">
              <Video className="h-4 w-4" />
              Private browser-based recording
            </div>
            <h1 className="text-4xl font-bold leading-tight text-studio-text sm:text-5xl lg:text-[3.75rem]">
              Screen Recorder
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-studio-muted sm:text-lg">
              Record a browser tab with its audio, add one webcam, test your microphone processing, and compose everything
              into one downloadable video directly in the browser.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                to="/studio"
                className={cn(heroLinkClass, "border-transparent bg-studio-accent text-white hover:bg-[#4F46E5]")}
              >
                <ArrowRight className="h-5 w-5 shrink-0" />
                <span>Start Recording</span>
              </Link>
              <Link
                to="/recordings"
                className={cn(heroLinkClass, "border-studio-border bg-studio-card text-studio-text hover:bg-[#1D2940]")}
              >
                <Download className="h-5 w-5 shrink-0" />
                <span>View Recordings</span>
              </Link>
            </div>
          </div>
          <div className="hidden items-center justify-center lg:flex">
            <div className="w-full max-w-xl rounded-lg border border-studio-border bg-studio-panel/[0.76] p-4 shadow-studio backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-studio-danger" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-studio-success" />
                </div>
                <span className="rounded-full bg-studio-danger/15 px-3 py-1 text-xs text-red-100">REC 00:12</span>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-lg border border-studio-border bg-black/75 p-3">
                <div className="h-full rounded-md bg-slate-800/80" />
                <div className="absolute bottom-6 right-6 aspect-video w-[30%] overflow-hidden rounded-lg border border-white/25 bg-slate-950 shadow-studio">
                  <div className="h-full bg-gradient-to-br from-studio-accent/35 to-studio-cyan/20" />
                </div>
                <div className="absolute bottom-5 left-6 flex items-end gap-1" aria-hidden="true">
                  {[35, 62, 48, 76, 54, 84, 42, 68].map((height, index) => (
                    <span
                      key={`${height}-${index}`}
                      className="w-1 rounded-full bg-studio-cyan"
                      style={{ height: `${Math.round(height / 4)}px` }}
                    />
                  ))}
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
            MediaRecorder, Canvas capture, AudioContext mixing, and IndexedDB keep the complete workflow in your browser
            without uploading your recordings.
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
              Use Chrome or Edge for the broadest support. For meeting audio, choose the browser tab in the share picker
              and enable that tab&apos;s audio before you start recording.
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
