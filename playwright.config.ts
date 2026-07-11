import { defineConfig, devices } from "@playwright/test";

const baseURL = "https://127.0.0.1:5173";

const edgeLaunchOptions = {
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
  ],
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: "list",
  expect: {
    timeout: 7_500,
  },
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    permissions: ["camera", "microphone"],
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "edge-desktop",
      use: {
        ...devices["Desktop Edge"],
        channel: "msedge",
        launchOptions: edgeLaunchOptions,
      },
    },
    {
      name: "edge-mobile",
      use: {
        ...devices["Pixel 7"],
        channel: "msedge",
        launchOptions: edgeLaunchOptions,
      },
    },
  ],
  webServer: {
    command: "npm run dev:vite -- --host 127.0.0.1",
    url: baseURL,
    ignoreHTTPSErrors: true,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
