# Deployment Checklist

## Required Checks

- Run `npm run deploy:check` before every deploy.
- Run `npm run test:e2e` in desktop Edge before the production deploy.
- Deploy only over HTTPS. Browser media APIs will fail on insecure LAN or production origins.
- Confirm `vercel.json` applies the SPA fallback and production response headers.
- Confirm `Content-Security-Policy`, `Permissions-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` are present in production responses.
- Open `/studio` and `/recordings` directly, then refresh both routes to verify the Vercel fallback.
- Test `/studio` and `/recordings` on mobile, tablet, and desktop widths.
- Confirm only one webcam can be active, and test selecting, switching, previewing, and stopping it.
- Test microphone selection, level metering, every voice mode, sample recording, and sample playback before recording.
- Test browser-tab capture with the tab-audio option enabled, plus window and full-screen capture without audio.
- Test every one-webcam layout, recording pause/resume/stop/reset, review playback, local save, download, and deletion in Chrome or Edge.
- Record at least two minutes of an audible meeting-style browser tab while the meeting tab is in the foreground, then verify video motion and tab audio in playback.

## Privacy And Data

- Recordings must remain local in IndexedDB or user downloads.
- Do not add analytics, upload endpoints, or third-party scripts without updating the privacy model and CSP.
- Do not request camera, microphone, or screen permissions before a user action.

## Known Browser Limits

- Screen capture is unavailable on many mobile browsers.
- Tab audio depends on the browser, selected source, and whether the user enables audio in the share picker.
- Window or full-screen capture may not provide audio; verify the studio warning before recording.
