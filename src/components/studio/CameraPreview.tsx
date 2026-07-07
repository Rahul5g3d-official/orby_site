import { VideoOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "../../utils/cn";

interface CameraPreviewProps {
  stream: MediaStream | null;
  label: string;
  className?: string;
  muted?: boolean;
}

export function CameraPreview({ stream, label, className, muted = true }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-lg border border-studio-border bg-black", className)}>
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-studio-muted">
          <VideoOff className="h-7 w-7" />
          <span className="text-sm">{label}</span>
        </div>
      )}
      <div className="absolute bottom-3 left-3 rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
        {label}
      </div>
    </div>
  );
}
