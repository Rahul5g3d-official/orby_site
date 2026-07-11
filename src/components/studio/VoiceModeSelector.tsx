import {
  AudioLines,
  Check,
  Radio,
  Sparkles,
  Volume2,
  Wand2,
} from "lucide-react";
import { useId } from "react";
import type { AudioMode, AudioModeOption } from "../../types/media";
import { cn } from "../../utils/cn";

interface VoiceModeSelectorProps {
  options: AudioModeOption[];
  value: AudioMode;
  onChange: (mode: AudioMode) => void;
  disabled?: boolean;
}

const icons = {
  natural: Volume2,
  "voice-boost": Sparkles,
  "noise-reduced": Wand2,
  broadcast: Radio,
  warm: AudioLines,
};

export function VoiceModeSelector({
  options,
  value,
  onChange,
  disabled = false,
}: VoiceModeSelectorProps) {
  const groupId = useId();

  return (
    <fieldset disabled={disabled}>
      <legend className="sr-only">Voice mode</legend>
      <div className="grid gap-2">
        {options.map((option) => {
          const Icon = icons[option.id];
          const selected = option.id === value;
          const optionId = `${groupId}-${option.id}`;

          return (
            <div key={option.id}>
              <input
                id={optionId}
                type="radio"
                name={`${groupId}-voice-mode`}
                value={option.id}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(option.id)}
                className="peer sr-only"
              />
              <label
                htmlFor={optionId}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-studio-cyan/70 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-studio-panel",
                  selected
                    ? "border-studio-cyan bg-studio-cyan/10"
                    : "border-studio-border bg-white/[0.03] hover:bg-white/[0.06]",
                  disabled && "cursor-not-allowed opacity-55",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-studio-accent/15 text-studio-cyan">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-studio-text">
                    {option.name}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-studio-muted">
                    {option.description}
                  </span>
                </span>
                {selected ? (
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
