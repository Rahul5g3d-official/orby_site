import { cn } from "../../utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-studio-border bg-white/[0.03] p-8 text-center", className)}>
      <h3 className="text-base font-semibold text-studio-text">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-studio-muted">{description}</p> : null}
    </div>
  );
}
