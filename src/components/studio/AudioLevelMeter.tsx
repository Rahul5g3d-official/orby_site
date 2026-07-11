import { useId } from "react";

interface AudioLevelMeterProps {
  level: number;
  label?: string;
}

export function AudioLevelMeter({
  level,
  label = "Mic level",
}: AudioLevelMeterProps) {
  const percentage = Math.round(Math.min(1, Math.max(0, level)) * 100);
  const labelId = useId();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span id={labelId} className="font-medium text-studio-text">
          {label}
        </span>
        <span className="text-studio-muted">{percentage}%</span>
      </div>
      <div
        role="meter"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-valuetext={`${percentage}%`}
        className="h-3 overflow-hidden rounded-full bg-white/[0.08]"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-studio-cyan to-studio-success transition-[width]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
