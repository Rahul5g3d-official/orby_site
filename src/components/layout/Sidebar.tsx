import { Camera, MonitorUp, Mic2, SplitSquareHorizontal } from "lucide-react";

const items = [
  { icon: MonitorUp, label: "Screen capture" },
  { icon: Mic2, label: "Audio mixing" },
  { icon: Camera, label: "One webcam" },
  { icon: SplitSquareHorizontal, label: "Layouts" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-16 shrink-0 border-r border-studio-border bg-studio-panel/80 p-3 lg:block">
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] text-studio-muted"
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </div>
          );
        })}
      </div>
    </aside>
  );
}
