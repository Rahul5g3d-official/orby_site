# framesync

framesync is a private, browser-based recording studio built with React and TypeScript. It captures a browser tab, window, or display, can add one webcam and microphone, and produces a local recording without an application backend.

## Features

- Browser tab, window, and full-display capture
- Optional single-webcam and microphone input
- Six recording layouts: screen only, camera only, face bubble, side camera, two-source grid, and picture-in-picture
- Shared-audio and microphone mixing
- Five voice profiles: Voice boost, Noise reduced, Broadcast, Warm, and Natural
- Optional microphone sample recording and playback
- Start, pause, resume, stop, and reset controls
- Safe recording stop when an active source disconnects
- Recording preview before local save or download
- Browser-local recording library with download and delete actions
- Responsive, keyboard-accessible studio setup

Recordings are exported as WebM files named `screen-recording-YYYY-MM-DD.webm`.

## Technology

- React 18 and React Router
- TypeScript
- Vite
- Tailwind CSS
- Media Capture, MediaRecorder, Canvas, Web Audio, and IndexedDB browser APIs
- Vitest and Testing Library
- Playwright

## Requirements

- A current Node.js LTS release and npm
- A current Chrome or Microsoft Edge browser
- HTTPS, including during local development, because browser media APIs require a secure context
- Microsoft Edge installed locally when running the configured end-to-end suite

Safari and Firefox are not automated test targets. Screen and shared-audio availability can vary by browser, operating system, and the source selected in the browser sharing dialog.

## Getting Started

```bash
npm install
npm run dev
```

Open `https://localhost:5173`. The local development certificate is self-signed, so the browser may show a one-time certificate warning.
