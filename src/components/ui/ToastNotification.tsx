import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "../../utils/cn";

interface ToastNotificationProps {
  type?: "info" | "success" | "error";
  message: string | null;
  onDismiss?: () => void;
}

const iconMap = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

export function ToastNotification({ type = "info", message, onDismiss }: ToastNotificationProps) {
  if (!message) return null;

  const Icon = iconMap[type];

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={cn(
        "fixed inset-x-3 top-20 z-[70] flex items-start gap-3 rounded-lg border bg-studio-panel p-4 text-sm shadow-studio sm:left-auto sm:right-4 sm:max-w-sm",
        type === "error" && "border-studio-danger/40 text-red-100",
        type === "success" && "border-studio-success/40 text-green-100",
        type === "info" && "border-studio-border text-studio-text",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">{message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-1 shrink-0 rounded-md p-1 text-current/70 transition hover:bg-white/10 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-cyan"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
