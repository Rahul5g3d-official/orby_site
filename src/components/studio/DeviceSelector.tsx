import type { MediaDeviceOption } from "../../types/media";

interface DeviceSelectorProps {
  label: string;
  devices: MediaDeviceOption[];
  value: string;
  placeholder: string;
  onChange: (deviceId: string) => void;
  disabled?: boolean;
}

export function DeviceSelector({
  label,
  devices,
  value,
  placeholder,
  onChange,
  disabled = false,
}: DeviceSelectorProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-studio-text">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-studio-border bg-studio-panel px-3 text-sm text-studio-text outline-none transition focus-visible:border-studio-cyan focus-visible:ring-2 focus-visible:ring-studio-cyan/30 disabled:cursor-not-allowed disabled:opacity-55"
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
