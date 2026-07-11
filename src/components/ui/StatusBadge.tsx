import { cn } from "../../utils/cn";

interface StatusBadgeProps {
  status: "idle" | "connected" | "recording" | "paused" | "error" | "ready";
  children: string;
}

const classes = {
  idle: "bg-white/[0.08] text-studio-muted border-white/10",
  connected: "bg-studio-success/15 text-green-300 border-studio-success/30",
  recording: "bg-studio-danger/15 text-red-200 border-studio-danger/35",
  paused: "bg-amber-400/15 text-amber-200 border-amber-400/30",
  error: "bg-studio-danger/15 text-red-200 border-studio-danger/35",
  ready: "bg-studio-accent/15 text-indigo-200 border-studio-accent/35",
};

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", classes[status])}>
      {children}
    </span>
  );
}
