import type { MediaDeviceOption } from "../../types/media";

interface DeviceSelectorProps {
  label: string;
  devices: MediaDeviceOption[];
  value: string;
  placeholder: string;
  onChange: (deviceId: string) => void;
}

export function DeviceSelector({ label, devices, value, placeholder, onChange }: DeviceSelectorProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-studio-text">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-studio-border bg-studio-panel px-3 text-sm text-studio-text outline-none transition focus:border-studio-cyan"
      >
        <option value="">{placeholder}</option>
        {devices.map((device) => (
          <option key={device.deviceId || device.label} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </label>
  );
}
