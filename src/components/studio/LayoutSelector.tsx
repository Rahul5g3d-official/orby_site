import { Check } from "lucide-react";
import type { LayoutOption, StudioLayout } from "../../types/media";
import { cn } from "../../utils/cn";

interface LayoutSelectorProps {
  layouts: LayoutOption[];
  value: StudioLayout;
  onChange: (layout: StudioLayout) => void;
}

export function LayoutSelector({ layouts, value, onChange }: LayoutSelectorProps) {
  return (
    <div className="grid gap-2">
      {layouts.map((layout) => {
        const isSelected = value === layout.id;
        return (
          <button
            key={layout.id}
            type="button"
            onClick={() => onChange(layout.id)}
            className={cn(
              "flex min-h-16 items-start justify-between gap-3 rounded-lg border p-3 text-left transition",
              isSelected
                ? "border-studio-cyan bg-studio-cyan/10"
                : "border-studio-border bg-white/[0.03] hover:bg-white/[0.06]",
            )}
          >
            <span>
              <span className="block text-sm font-medium text-studio-text">{layout.name}</span>
              <span className="mt-1 block text-xs leading-5 text-studio-muted">{layout.description}</span>
            </span>
            {isSelected ? <Check className="h-4 w-4 shrink-0 text-studio-cyan" /> : null}
          </button>
        );
      })}
    </div>
  );
}
