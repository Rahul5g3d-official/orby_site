import { Camera, LayoutDashboard, Library, Video } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

const links = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/studio", label: "Studio", icon: Camera },
  { to: "/recordings", label: "Recordings", icon: Library },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-studio-border bg-studio-bg/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1480px] items-center justify-between gap-3 px-3 py-2 sm:px-6">
        <NavLink
          to="/"
          aria-label="Screen Recorder home"
          className="flex min-w-0 items-center gap-3 text-studio-text"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-studio-accent">
            <Video className="h-5 w-5" />
          </span>
          <span className="truncate text-sm font-semibold sm:text-base">
            framesync
          </span>
        </NavLink>
        <nav
          aria-label="Primary navigation"
          className="flex shrink-0 items-center gap-1 overflow-x-auto"
        >
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                aria-label={link.label}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-studio-muted transition hover:bg-white/5 hover:text-studio-text",
                    isActive && "bg-white/[0.08] text-studio-text",
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
