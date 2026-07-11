import { ArrowRight, Download, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../utils/cn";

const heroLinkClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border px-5 text-base font-medium leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg sm:w-auto";

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
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                to="/studio"
                className={cn(
                  heroLinkClass,
                  "border-transparent bg-studio-accent text-white hover:bg-[#4F46E5]",
                )}
              >
                <ArrowRight className="h-5 w-5 shrink-0" />
                <span>Start Recording</span>
              </Link>
              <Link
                to="/recordings"
                className={cn(
                  heroLinkClass,
                  "border-studio-border bg-studio-card text-studio-text hover:bg-[#1D2940]",
                )}
              >
                <Download className="h-5 w-5 shrink-0" />
                <span>View Recordings</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
