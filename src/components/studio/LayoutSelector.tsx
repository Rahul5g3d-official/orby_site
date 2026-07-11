import { Check } from "lucide-react";
import { useId } from "react";
import type { LayoutOption, StudioLayout } from "../../types/media";
import { cn } from "../../utils/cn";

interface LayoutSelectorProps {
  layouts: LayoutOption[];
  value: StudioLayout;
  onChange: (layout: StudioLayout) => void;
  disabled?: boolean;
}

export function LayoutSelector({
  layouts,
  value,
  onChange,
  disabled = false,
}: LayoutSelectorProps) {
  const groupId = useId();

  return (
    <fieldset disabled={disabled}>
      <legend className="sr-only">Recording layout</legend>
      <div className="grid gap-2">
        {layouts.map((layout) => {
          const isSelected = value === layout.id;
          const optionId = `${groupId}-${layout.id}`;

          return (
            <div key={layout.id}>
              <input
                id={optionId}
                type="radio"
                name={`${groupId}-layout`}
                value={layout.id}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onChange(layout.id)}
                className="peer sr-only"
              />
              <label
                htmlFor={optionId}
                className={cn(
                  "flex min-h-16 cursor-pointer items-start justify-between gap-3 rounded-lg border p-3 text-left transition peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-studio-cyan/70 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-studio-panel",
                  isSelected
                    ? "border-studio-cyan bg-studio-cyan/10"
                    : "border-studio-border bg-white/[0.03] hover:bg-white/[0.06]",
                  disabled && "cursor-not-allowed opacity-55",
                )}
              >
                <span>
                  <span className="block text-sm font-medium text-studio-text">
                    {layout.name}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-studio-muted">
                    {layout.description}
                  </span>
                </span>
                {isSelected ? (
                  <Check
                    className="h-4 w-4 shrink-0 text-studio-cyan"
                    aria-hidden="true"
                  />
                ) : null}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
