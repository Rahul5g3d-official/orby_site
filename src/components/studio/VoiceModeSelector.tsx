import { AudioLines, Check, Radio, Sparkles, Volume2, Wand2 } from "lucide-react";
import type { AudioMode, AudioModeOption } from "../../types/media";
import { cn } from "../../utils/cn";

interface VoiceModeSelectorProps {
  options: AudioModeOption[];
  value: AudioMode;
  onChange: (mode: AudioMode) => void;
}

const icons = {
  natural: Volume2,
  "voice-boost": Sparkles,
  "noise-reduced": Wand2,
  broadcast: Radio,
  warm: AudioLines,
};

export function VoiceModeSelector({ options, value, onChange }: VoiceModeSelectorProps) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-studio-text">Voice mode</h3>
        <p className="mt-1 text-xs leading-5 text-studio-muted">
          Applies to microphone and phone camera voices in the final recording.
        </p>
      </div>
      <div className="grid gap-2">
        {options.map((option) => {
          const Icon = icons[option.id];
          const selected = option.id === value;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-lg border p-3 text-left transition",
                selected
                  ? "border-studio-cyan bg-studio-cyan/10"
                  : "border-studio-border bg-white/[0.03] hover:bg-white/[0.06]",
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-studio-accent/15 text-studio-cyan">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-studio-text">{option.name}</span>
                <span className="mt-0.5 block text-xs leading-5 text-studio-muted">{option.description}</span>
              </span>
              {selected ? <Check className="h-4 w-4 shrink-0 text-studio-cyan" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
