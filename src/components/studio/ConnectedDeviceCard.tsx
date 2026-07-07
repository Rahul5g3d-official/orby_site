import { Smartphone } from "lucide-react";
import type { RemoteCamera } from "../../types/media";
import { CameraPreview } from "./CameraPreview";
import { StatusBadge } from "../ui/StatusBadge";

interface ConnectedDeviceCardProps {
  camera: RemoteCamera;
}

export function ConnectedDeviceCard({ camera }: ConnectedDeviceCardProps) {
  return (
    <div className="rounded-lg border border-studio-border bg-white/[0.03] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-studio-text">
          <Smartphone className="h-4 w-4 text-studio-cyan" />
          {camera.label}
        </div>
        <StatusBadge status={camera.status === "connected" ? "connected" : "connecting"}>
          {camera.status}
        </StatusBadge>
      </div>
      <CameraPreview stream={camera.stream} label={camera.label} />
    </div>
  );
}
