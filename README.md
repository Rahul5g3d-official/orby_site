# Orby

Private, browser-based screen recording with webcam, microphone, audio mixing, and flexible layouts.

**Live:** [www.orby.co.in](https://www.orby.co.in/)

## Features

- Record a browser tab, window, or display
- Combine screen, webcam, microphone, and shared audio
- Choose from six recording layouts and five voice profiles
- Preview, download, save, and manage recordings locally
- Responsive and keyboard-accessible interface
- No backend, account, or media upload required

## Privacy

Recording and processing happen entirely in the browser. Saved recordings remain in the device's IndexedDB storage unless the user downloads or deletes them.

## Tech Stack

React, TypeScript, Vite, Tailwind CSS, MediaRecorder, Web Audio, Canvas, IndexedDB, Vitest, and Playwright.

## Local Development

Requires a current Node.js LTS release and npm.

```bash
npm ci
npm run dev
```

Open `https://localhost:5173`. The local development certificate is self-signed, so the browser may show a one-time certificate warning.

## Quality Checks

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

End-to-end tests require Microsoft Edge. Chrome and Edge are the primary supported browsers; capture capabilities vary by browser, operating system, and selected media source.

## Deployment

The application is a static Vite SPA configured for Vercel. Production deployment requires HTTPS for screen, camera, and microphone access.
