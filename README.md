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

## Privacy and Storage

Media capture, composition, voice processing, previewing, and file creation occur in the browser. The project has no upload, analytics, account, or cloud-sync implementation.

Unsaved recordings remain in browser memory. **Save locally** stores a recording in IndexedDB on the current browser and device. Downloading creates a local WebM file through the browser.

Saved recordings are subject to browser storage limits and can be removed when site data is cleared. They are not synchronized or recoverable from another browser or device.

## Scripts

| Command                 | Purpose                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `npm run dev`           | Start the local HTTPS Vite server                                  |
| `npm run build`         | Type-check the project and create the production build             |
| `npm run preview`       | Preview the production build locally                               |
| `npm run lint`          | Run ESLint                                                         |
| `npm test`              | Run the Vitest suite once                                          |
| `npm run test:watch`    | Run Vitest in watch mode                                           |
| `npm run test:e2e`      | Run Playwright tests in desktop and mobile Edge projects           |
| `npm run test:e2e:list` | List configured Playwright tests                                   |
| `npm run deploy:check`  | Run lint, unit tests, build, and a moderate-level dependency audit |
| `npm run format`        | Format the repository with Prettier                                |

Set `E2E_BASE_URL` to run Playwright against an existing deployment. Without it, Playwright starts the local HTTPS development server automatically.

## Testing

The test files are development-only and are not included in the production bundle.

- Collocated `src/**/*.test.ts(x)` files verify routing, media API support, recorder MIME selection, microphone testing, audio mixing, and canvas composition.
- `src/test/` contains the shared Vitest setup and browser-media mocks.
- `tests/e2e/` verifies navigation, responsive layout, setup accessibility, focus handling, media controls, and the optional microphone-test workflow in Edge.

These tests are retained because they protect the browser-media pipeline and responsive interaction flow without adding production runtime code.

## Project Structure

```text
src/
├── components/   Layout, studio, recording, and shared UI components
├── hooks/        Media-device, capture, microphone, and recorder state
├── routes/       Home, Studio, and Recordings pages
├── services/     Media API, download, recorder, and IndexedDB access
├── styles/       Global design tokens and styles
├── test/         Vitest setup and media mocks
├── types/        Shared media and recording types
└── utils/        Canvas composition, audio mixing, and formatting helpers

tests/e2e/        Playwright browser tests
public/           Static assets and host security headers
```

## Production Build and Deployment

```bash
npm run deploy:check
npm run build
```

The production output is written to `dist/`.

The repository includes `vercel.json` with a single-page-application rewrite and production security headers. `public/_headers` provides equivalent headers for compatible static hosts.

For another static host:

1. Publish `dist/`.
2. Rewrite unknown routes to `/index.html`.
3. Serve the application over HTTPS.
4. Preserve the supplied content-security, permissions, referrer, framing, and content-type headers.
