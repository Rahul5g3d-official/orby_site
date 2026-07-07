import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ isOpen, title, children, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-lg border border-studio-border bg-studio-panel p-5 shadow-studio">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-studio-text">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
