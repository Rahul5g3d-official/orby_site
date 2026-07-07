interface AudioLevelMeterProps {
  level: number;
  label?: string;
}

export function AudioLevelMeter({ level, label = "Mic level" }: AudioLevelMeterProps) {
  const percentage = Math.round(Math.min(1, Math.max(0, level)) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-studio-text">{label}</span>
        <span className="text-studio-muted">{percentage}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-studio-cyan to-studio-success transition-[width]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
