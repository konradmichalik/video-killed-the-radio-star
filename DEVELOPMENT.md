# VKTRS — Development Guide

Local development, data pipeline, and deployment notes for VideoKilledTheRadioStar.

## ⚙️ Common Commands

```bash
npm run lint          # ESLint (flat config) for JS + Svelte
npm run lint:fix      # ESLint with autofix
npm run format        # Prettier write
npm run format:check  # Prettier check (CI mode)
npm run check         # svelte-check — Svelte/a11y/compiler diagnostics

npm test              # Vitest unit tests (pure helpers, Node env)
npm run test:watch    # Vitest watch mode
npm run test:e2e      # Playwright — iPhone 13 + iPad (landscape)
```

CI runs `lint`, `format:check`, `check`, `test`, and `build` on every push. The Playwright E2E job is gated by `if: false` in `.github/workflows/ci.yml` — enable it after installing browser binaries on the runner.

## 🎬 Dev Review Mode

> [!TIP]
> Press `D` to enter dev review mode. Annotate each video with status flags, replacement IDs, and free-text notes. All data auto-saves to `localStorage`.

Statuses: `OK` · `LYRIC` · `LIVE` · `AUDIO` · `FAN` · `WRONG` · `DROP`

When dev mode is active and the toggle is on, only un-reviewed tracks play (auto-skip reviewed). Export your review session from the browser console:

```js
window.vktrsReviewsMarkdown(); // export a Markdown report
window.vktrsReviews(); // raw review object
window.vktrsReviewsCount(); // summary statistics
window.vktrsReviewsClear(); // wipe all reviews
```

The DevReview panel also shows live catalog stats (OK / issue / to-check), `+10s` / `+30s` seek buttons, and per-track spoiler flags.

## 📡 Data Pipeline

The video catalogue lives in `public/videos.json`. Scripts in `scripts/` manage the full lifecycle:

| Script                   | Purpose                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| `enrich.mjs`             | Resolves `seed-tracks.json` → `videos.json` (YouTube IDs, embeddability) |
| `csv-to-seed.mjs`        | Converts Exportify / Hitster CSVs to seed format                         |
| `musicbrainz-lookup.mjs` | Resumable MusicBrainz enrichment, with cache                             |
| `apply-metadata.mjs`     | Merges enriched metadata back into `videos.json`                         |
| `verify.mjs`             | Checks every ID is reachable and embeddable                              |

> [!WARNING]
> `enrich.mjs` can use `youtubei.js` (unofficial, no key needed) or the official Data API (`YT_API_KEY`). Never commit your `YT_API_KEY`. Use the official path for production data updates.

See [`scripts/README.md`](scripts/README.md) for full CLI reference.

## 🔌 Deployment

Set the `VITE_BASE` environment variable to the repo subpath for GitHub Pages project sites (e.g. `/video-killed-the-radio-star/`). Leave it unset for root deployments and custom domains.

```bash
VITE_BASE=/video-killed-the-radio-star/ npm run build
```

The deploy workflow (`.github/workflows/deploy.yml`) handles this automatically:

- Triggers on push to `main`
- Sets `VITE_BASE=/<repo-name>/` derived from the repository name
- Builds with Workbox PWA service worker
- Uploads `dist/` via `actions/deploy-pages@v4`

> [!IMPORTANT]
> Once-off: in the repository **Settings → Pages**, set **Source** to **"GitHub Actions"** (not "Deploy from branch"). Otherwise the workflow runs but the deployment never goes live.

The published site URL is `https://<user>.github.io/<repo-name>/`. The PWA service worker only registers on HTTPS or `localhost`, so test offline behaviour on the deployed site (not on a LAN IP).
