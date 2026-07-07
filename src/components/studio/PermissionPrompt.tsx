import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

interface PermissionPromptProps {
  title: string;
  description: string;
  action: ReactNode;
}

export function PermissionPrompt({ title, description, action }: PermissionPromptProps) {
  return (
    <div className="rounded-lg border border-studio-border bg-white/[0.03] p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-studio-accent/15 text-studio-cyan">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-studio-text">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-studio-muted">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
