import { MonitorUp } from "lucide-react";
import { useEffect, useRef } from "react";

interface ScreenPreviewProps {
  stream: MediaStream | null;
}

export function ScreenPreview({ stream }: ScreenPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-studio-border bg-black">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
      ) : (
        <div className="flex flex-col items-center gap-3 text-studio-muted">
          <MonitorUp className="h-10 w-10" />
          <span className="text-sm">Screen preview</span>
        </div>
      )}
      <div className="absolute bottom-3 left-3 rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
        Screen
      </div>
    </div>
  );
}
