# Deployment Checklist

## Required Checks

- Run `npm run deploy:check` before every deploy.
- Deploy only over HTTPS. Browser media APIs will fail on insecure LAN or production origins.
- Confirm the deployed host applies `public/_headers` or equivalent response headers.
- Confirm `Content-Security-Policy`, `Permissions-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` are present in production responses.
- Test `/studio`, `/recordings`, and `/phone-camera/:roomId` on mobile and desktop widths.
- Test camera, microphone, screen capture, recording review playback, local save, and download in Chrome or Edge.
- Test phone camera pairing from the deployed HTTPS origin, not from `localhost`.

## Privacy And Data

- Recordings must remain local in IndexedDB or user downloads.
- Do not add analytics, upload endpoints, or third-party scripts without updating the privacy model and CSP.
- Do not request camera, microphone, or screen permissions before a user action.
- Keep signaling messages limited to WebRTC negotiation data; never send recorded media through signaling.

## Known Browser Limits

- Screen capture is unavailable on many mobile browsers.
- Tab audio depends on the browser and chosen capture source.
- Multiple camera streams depend on device CPU, battery, and network quality.
