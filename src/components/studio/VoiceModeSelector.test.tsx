import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AudioModeOption } from "../../types/media";
import { VoiceModeSelector } from "./VoiceModeSelector";

const options: AudioModeOption[] = [
  { id: "natural", name: "Natural", description: "No voice processing." },
  {
    id: "voice-boost",
    name: "Voice boost",
    description: "Bring speech forward.",
  },
  {
    id: "noise-reduced",
    name: "Noise reduced",
    description: "Reduce steady background noise.",
  },
];

describe("VoiceModeSelector", () => {
  it("exposes the selected voice mode and reports a keyboard/mouse selection", () => {
    const onChange = vi.fn();
    render(
      <VoiceModeSelector
        options={options}
        value="natural"
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("radio", { name: /Natural/ })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Voice boost/ }),
    ).not.toBeChecked();

    fireEvent.click(screen.getByRole("radio", { name: /Voice boost/ }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith("voice-boost");
  });

  it("prevents voice-mode changes while setup is locked", () => {
    const onChange = vi.fn();
    render(
      <VoiceModeSelector
        options={options}
        value="natural"
        onChange={onChange}
        disabled
      />,
    );

    const voiceBoost = screen.getByRole("radio", { name: /Voice boost/ });
    expect(voiceBoost).toBeDisabled();

    voiceBoost.click();

    expect(onChange).not.toHaveBeenCalled();
  });
});
