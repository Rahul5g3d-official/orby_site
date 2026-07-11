import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { installMediaStreamMock } from "./mediaMocks";

installMediaStreamMock();

Object.defineProperty(HTMLCanvasElement.prototype, "captureStream", {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

afterEach(() => {
  cleanup();
});
