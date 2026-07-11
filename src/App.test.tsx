import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App data-router integration", () => {
  beforeEach(() => {
    const mediaDevices = {
      enumerateDevices: vi.fn(async () => []),
      getUserMedia: vi.fn(),
      getDisplayMedia: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: mediaDevices,
    });
    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      value: class MockMediaRecorder {},
    });
  });

  it("renders the guarded Studio route inside a data router", async () => {
    const router = createMemoryRouter([{ path: "*", element: <App /> }], {
      initialEntries: ["/studio"],
    });

    render(
      <RouterProvider router={router} future={{ v7_startTransition: true }} />,
    );

    const liveStageHeading = await screen.findByRole("heading", {
      level: 1,
      name: "Live stage",
    });
    expect(liveStageHeading).toBeVisible();

    const liveStageHeader = liveStageHeading.parentElement?.parentElement;
    expect(liveStageHeader).not.toBeNull();
    expect(
      within(liveStageHeader as HTMLElement).getByRole("button", {
        name: /Studio setup/,
      }),
    ).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.queryByText(/phone camera|QR code/i)).not.toBeInTheDocument();
  });
});
