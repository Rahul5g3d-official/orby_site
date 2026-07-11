import { useCallback, useEffect, useMemo, useState } from "react";
import { listMediaDevices } from "../services/mediaService";
import type { MediaDeviceOption } from "../types/media";

export function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDeviceOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setDevices(await listMediaDevices());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to list media devices.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDevices();

    navigator.mediaDevices?.addEventListener("devicechange", refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener("devicechange", refreshDevices);
  }, [refreshDevices]);

  const cameras = useMemo(
    () => devices.filter((device) => device.kind === "videoinput"),
    [devices],
  );

  const microphones = useMemo(
    () => devices.filter((device) => device.kind === "audioinput"),
    [devices],
  );

  return {
    cameras,
    microphones,
    isLoading,
    error,
    refreshDevices,
  };
}
