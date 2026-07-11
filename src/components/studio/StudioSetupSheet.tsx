import { Lock, X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/Button";

interface StudioSetupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  locked: boolean;
  children: ReactNode;
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function StudioSetupSheet({ isOpen, onClose, locked, children }: StudioSetupSheetProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => panelRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusableElements = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.getAttribute("aria-hidden") !== "true",
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      const activeElementIsFocusable = focusableElements.some((element) => element === activeElement);

      if (!activeElementIsFocusable) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      } else if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[2px] sm:flex sm:justify-end"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        id="studio-setup-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="grid h-[100dvh] w-full grid-rows-[auto_minmax(0,1fr)_auto] bg-studio-panel shadow-studio outline-none sm:max-w-[460px] sm:border-l sm:border-studio-border"
      >
        <header className="border-b border-studio-border bg-studio-panel px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-studio-text">
                Studio setup
              </h2>
              <p id={descriptionId} className="mt-1 text-sm leading-6 text-studio-muted">
                Choose your sources, layout, and voice settings.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close studio setup" className="shrink-0">
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          {locked ? (
            <div
              role="status"
              className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm leading-5 text-amber-100"
            >
              <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Stop recording to change your setup.</span>
            </div>
          ) : null}
        </header>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
          <div className="grid gap-5">{children}</div>
        </div>

        <footer className="border-t border-studio-border bg-studio-panel px-4 py-4 sm:px-5">
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
