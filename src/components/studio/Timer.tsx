import { formatTimer } from "../../utils/formatTime";

interface TimerProps {
  durationMs: number;
}

export function Timer({ durationMs }: TimerProps) {
  return <span className="font-mono text-2xl font-semibold tabular-nums text-studio-text">{formatTimer(durationMs)}</span>;
}
