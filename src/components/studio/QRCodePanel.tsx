import { Copy, ExternalLink, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../ui/Button";

interface QRCodePanelProps {
  roomId: string;
  joinUrl: string;
  onCopy: () => void;
}

export function QRCodePanel({ roomId, joinUrl, onCopy }: QRCodePanelProps) {
  return (
    <div className="rounded-lg border border-studio-border bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-studio-cyan" />
        <h3 className="text-sm font-semibold text-studio-text">Phone camera room</h3>
      </div>
      <div className="mx-auto flex w-fit max-w-full rounded-lg bg-white p-2 sm:p-3">
        <QRCodeSVG value={joinUrl} size={164} level="M" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="rounded-lg border border-studio-border bg-studio-panel px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-studio-muted">Room</p>
          <p className="font-mono text-sm text-studio-text">{roomId}</p>
        </div>
        <div className="break-all rounded-lg border border-studio-border bg-studio-panel px-3 py-2 text-xs text-studio-muted">
          {joinUrl}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button className="w-full" variant="secondary" size="sm" icon={<Copy className="h-4 w-4 shrink-0" />} onClick={onCopy}>
            Copy
          </Button>
          <a href={joinUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm" icon={<ExternalLink className="h-4 w-4 shrink-0" />} className="w-full">
              Open
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
