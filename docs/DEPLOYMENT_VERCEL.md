# Deployment notes (Vercel)

- Framework preset: Vite. Install: `npm ci`. Build command: `npm run build`. Output directory: `dist`.
- Env vars (Project settings, Environment Variables): `VITE_API_URL`, `VITE_USE_MOCKS` (`false` for real API, `true` for a mock-only demo), `VITE_APP_NAME`, `VITE_DEMO_MODE`, `VITE_GOOGLE_CLIENT_ID`. Vite bakes these in at build time, so redeploy after changing them.
- SPA rewrite: `vercel.json` (included) sends every non-file path to `/index.html` so `/app/...` and `/portal/...` refreshes work.
- Preview URLs change per deploy. The API's CORS allowlist must accept them (allow `https://*.vercel.app` by pattern, or add each preview origin), or previews will fail on credentialed calls.
- Cookies across sites need `SameSite=None; Secure` on the API (see integration guide).
- The Judge demo QR code should use the stable production domain, not a preview URL.
