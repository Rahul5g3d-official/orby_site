import { expect, test } from "@playwright/test";

const layoutNames = [
  "Screen only",
  "Face camera only",
  "Screen + face bubble",
  "Screen + side camera",
  "Two-source grid",
  "Picture-in-picture",
  "Custom top-left",
] as const;

const voiceModeNames = ["Voice boost", "Noise reduced", "Broadcast", "Warm", "Natural"] as const;

test.beforeEach(async ({ page }) => {
  await page.goto("/studio");
});

test("the setup sheet is modal, focus-contained, and restores focus when closed", async ({ page }) => {
  const trigger = page.getByRole("button", { name: /Studio setup/ });

  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toHaveAttribute("aria-controls", "studio-setup-sheet");
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Studio setup" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog).toHaveAccessibleDescription("Choose your sources, layout, and voice settings.");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(dialog).toBeFocused();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Done", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close studio setup", exact: true })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");

  await trigger.click();
  await page.getByRole("dialog", { name: "Studio setup" }).getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page
    .getByRole("dialog", { name: "Studio setup" })
    .getByRole("button", { name: "Close studio setup" })
    .click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the single-webcam setup retains every layout, voice mode, and microphone-test control", async ({ page }) => {
  await page.getByRole("button", { name: /Studio setup/ }).click();
  const dialog = page.getByRole("dialog", { name: "Studio setup" });

  const sectionNavigation = dialog.getByRole("navigation", { name: "Studio setup sections" });
  await expect(sectionNavigation.getByRole("link", { name: "Sources", exact: true })).toBeVisible();
  await expect(sectionNavigation.getByRole("link", { name: "Layout", exact: true })).toBeVisible();
  await expect(sectionNavigation.getByRole("link", { name: "Voice", exact: true })).toBeVisible();

  await expect(dialog.getByText("Google Meet:", { exact: true })).toBeVisible();
  await expect(dialog.getByText(/Share tab audio/).first()).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Choose shared source", exact: true })).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "One webcam", exact: true })).toHaveCount(1);
  await expect(dialog.getByRole("combobox", { name: /webcam/i })).toHaveCount(1);
  await expect(dialog.getByRole("button", { name: "Enable webcam", exact: true })).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Microphone", exact: true })).toHaveCount(1);
  await expect(dialog.getByRole("button", { name: "Enable microphone", exact: true })).toBeVisible();

  const layouts = dialog.getByRole("group", { name: "Recording layout" });
  await expect(layouts.getByRole("radio")).toHaveCount(layoutNames.length);
  for (const name of layoutNames) {
    await expect(layouts.getByRole("radio", { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`) })).toHaveCount(1);
  }
  await expect(layouts.getByRole("radio", { name: /^Screen \+ face bubble\b/ })).toBeChecked();
  await dialog.getByText("Picture-in-picture", { exact: true }).click();
  await expect(layouts.getByRole("radio", { name: /^Picture-in-picture\b/ })).toBeChecked();

  const voiceModes = dialog.getByRole("group", { name: "Voice mode" });
  await expect(voiceModes.getByRole("radio")).toHaveCount(voiceModeNames.length);
  for (const name of voiceModeNames) {
    await expect(voiceModes.getByRole("radio", { name: new RegExp(`^${name}\\b`) })).toHaveCount(1);
  }
  await expect(voiceModes.getByRole("radio", { name: /^Voice boost\b/ })).toBeChecked();
  await dialog.getByText("Warm", { exact: true }).click();
  await expect(voiceModes.getByRole("radio", { name: /^Warm\b/ })).toBeChecked();

  await expect(dialog.getByRole("heading", { name: "Test your microphone", exact: true })).toBeVisible();
  await expect(dialog.getByText("Warm", { exact: true }).last()).toBeVisible();
  await expect(dialog.getByText(/enable a microphone to record a test sample/i)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Record sample", exact: true })).toBeDisabled();
});

test("phone, QR, remote-camera, and multi-webcam controls are absent", async ({ page }) => {
  for (const route of ["/", "/studio", "/recordings"]) {
    await page.goto(route);
    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(/\bQR(?:\s|-)?code\b/i);
    expect(visibleText).not.toMatch(/\bscan (?:a |the |this )?QR\b/i);
    expect(visibleText).not.toMatch(/\b(?:connect|pair)(?:ed|ing)? (?:a |your )?phone\b/i);
    expect(visibleText).not.toMatch(/\bphone (?:camera|connection|pairing)\b/i);
    expect(visibleText).not.toMatch(/\b(?:multiple\s+|multi[- ]?)(?:camera|webcam)s?\b/i);
    expect(visibleText).not.toMatch(/\bremote[- ](?:camera|webcam)s?\b/i);
    expect(visibleText).not.toMatch(/\badd (?:another|a second|an additional) (?:camera|webcam)\b/i);

    await expect(page.locator('[href*="phone" i], [aria-label*="QR" i], [data-testid*="qr" i]')).toHaveCount(0);
  }

  await page.goto("/studio");
  await page.getByRole("button", { name: /Studio setup/ }).click();
  const dialog = page.getByRole("dialog", { name: "Studio setup" });
  await expect(dialog.getByRole("combobox", { name: /webcam/i })).toHaveCount(1);
  await expect(dialog.getByRole("button", { name: /add.*(?:camera|webcam)/i })).toHaveCount(0);
});

test("changing voice mode requires a fresh recorded and played microphone sample", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "edge-mobile", "The media pipeline is exercised once in desktop Edge.");

  await page.getByRole("button", { name: /Studio setup/ }).click();
  const dialog = page.getByRole("dialog", { name: "Studio setup" });

  await dialog.getByRole("button", { name: "Enable webcam", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Turn off webcam", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Enable microphone", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Turn off microphone", exact: true })).toBeVisible();

  await dialog.getByText("Broadcast", { exact: true }).click();
  const recordSample = dialog.getByRole("button", { name: "Record sample", exact: true });
  await expect(recordSample).toBeEnabled();
  await recordSample.click();
  const stopSample = dialog.getByRole("button", { name: "Stop sample", exact: true });
  await expect(stopSample).toBeVisible();
  await page.waitForTimeout(600);
  await stopSample.click();

  await expect(dialog.getByText(/Sample ready/)).toBeVisible();
  const playback = dialog.getByLabel("Broadcast microphone test playback");
  await expect(playback).toBeVisible();
  await playback.evaluate(async (element) => {
    await (element as HTMLAudioElement).play();
  });
  await expect(dialog.getByText(/This voice mode has been recorded and played back/)).toBeVisible();

  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start", exact: true })).toBeEnabled();

  await page.getByRole("button", { name: /Studio setup/ }).click();
  await page.getByRole("dialog", { name: "Studio setup" }).getByText("Natural", { exact: true }).click();
  await page.getByRole("dialog", { name: "Studio setup" }).getByRole("button", { name: "Done" }).click();

  await expect(page.getByRole("button", { name: "Start", exact: true })).toBeDisabled();
  await expect(page.getByText(/Record and play a Natural microphone test first\./)).toBeVisible();
});
