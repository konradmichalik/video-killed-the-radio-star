# Deployment & PWA

## GitHub Pages

`.github/workflows/deploy.yml` builds and publishes to Pages on every push to
`main` (and on demand). Enable it once: **Settings → Pages → Source: GitHub
Actions**.

The site is served from `https://<user>.github.io/<repo>/`, so the build sets
`base` to `/<repo>/` automatically (via `VITE_BASE`, read in `vite.config.js`).
All asset, manifest and `videos.json` paths are base-aware
(`import.meta.env.BASE_URL`), so it works under a subpath or at the root.

> For a user/org page (`<user>.github.io`) or a custom domain, set
> `VITE_BASE: '/'` in the workflow (or remove the line).

## PWA & offline

`vite-plugin-pwa` (Workbox) generates a service worker on build that precaches
the app shell **and `videos.json`**, so the app loads instantly on repeat visits
and still opens without a connection. Video playback always needs the network
(YouTube can't be cached). `registerType: 'autoUpdate'` ships new versions
automatically; the hand-written `public/manifest.json` is kept
(`manifest: false`) and the service worker respects the Pages `base`.

> A service worker only registers over HTTPS or on `localhost` — verify offline
> start there (DevTools → Application → Offline).
