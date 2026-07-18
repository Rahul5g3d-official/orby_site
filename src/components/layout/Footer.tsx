import { Link } from "react-router-dom";

const footerLinks = [
  { to: "/privacy", label: "Privacy & Local Data" },
  { to: "/open-source", label: "Open Source" },
];

export function Footer() {
  return (
    <footer className="border-t border-studio-border bg-studio-panel/45">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-studio-text">
            © {new Date().getFullYear()} Orby. All rights reserved.
          </p>

          <p className="max-w-xl text-[11px] leading-5 text-studio-muted">
            Your recordings and media stay on your device. Orby does not
            upload, store, or access your recording data.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-studio-muted"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="transition-colors hover:text-studio-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
