import { Video } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = [
  { to: "/", label: "Home" },
  { to: "/studio", label: "Studio" },
  { to: "/recordings", label: "Recordings" },
];

export function Footer() {
  return (
    <footer className="border-t border-studio-border bg-studio-panel/45">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-studio-accent/15 text-studio-cyan">
            <Video className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-studio-text">Screen Recorder</p>
            <p className="mt-1 text-xs text-studio-muted">Your recordings stay private in your browser.</p>
          </div>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-studio-muted">
          {footerLinks.map((link) => (
            <Link key={link.to} to={link.to} className="transition hover:text-studio-text">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
