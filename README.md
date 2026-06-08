# VideoKilledTheRadioStar (VKTRS)

A full-screen retro-TV PWA that turns 1,211 curated music videos (1975–2024) into a lean-back MTV-style channel — complete with CRT overlay, channel-change static, neo-brutalist UI, and a self-rated guess game. Built with Vite + Svelte 5. Mobile-first, iPad-optimised, installable offline.

> It hosts no media. Videos stream via the YouTube IFrame Player API and remain © their respective owners.

## 🚀 Quick Start

```bash
npm install
npm run dev        # Vite dev server on :5173, LAN-visible
```

Open the printed **Network:** URL (e.g. `http://192.168.x.x:5173`) on your iPad or phone.

> [!IMPORTANT]
> YouTube embeds require an `http(s)` origin. Always use the dev server URL — never open `file://` directly.

```bash
npm run build      # Production build + PWA service worker
npm run preview    # Preview the built dist
npm run verify     # Check all videos.json IDs are reachable and embeddable
```

> [!NOTE]
> The PWA service worker only registers on **HTTPS or `localhost`**. Test offline behaviour there, not on a LAN IP.

## ✨ Features

- **Full-screen channel** — shuffle play, smooth preloaded song-to-song transitions, "▶ COMING UP" teasers, end-screen suppression (~1.5 s preempt before YouTube's "more videos" overlay)
- **TV Guide** — year range, genre and country filters, one-tap channel presets, CRT / SONG INFO / STATION LOGO toggles
- **Search** with ranked autocomplete; **Queue** editor with drag-to-reorder; **Settings** panel
- **Guess game** — lean-back mode with title mask, self-rated reveal, running streak and hit-rate
- **Neo-brutalist UI** — VKTRS station-bug logo (player corner), "VIDEO KILLED / THE RADIO STAR" wordmark with RGB-glitch effect on the start screen and all overlay sheets, hard teal offset shadows
- **1,211 tracks (1975–2024)** — enriched via Hitster card datasets and MusicBrainz API, verified embeddable
- **Installable PWA** — Workbox precaches the app shell and `videos.json`; launches offline (streaming still needs the network)
- **iPad-hardened** — wake lock, fullscreen API, autoplay fallback, test-card error states, reduced-motion support

## 🎮 Controls

### Keyboard

| Key | Action |
|-----|--------|
| `Space` | Play / pause |
| `←` / `→` | Previous / next track |
| `↑` | Open TV Guide |
| `↓` | Show song info (lower third) |
| `Q` | Open Queue |
| `/` | Open Search |
| `I` | Show/hide STATION LOGO |
| `M` | Toggle CRT filter |
| `F` | Toggle fullscreen |
| `D` | Toggle dev review mode |
| `Esc` | Close any open panel |

### Touch / Swipe

| Gesture | Action |
|---------|--------|
| Tap left third | Previous track |
| Tap right third | Next track |
| Tap centre | Play / pause |
| Swipe up (≥ 60 px) | Open TV Guide |
| Swipe down (≥ 60 px) | Show song info |
| Swipe left / right (≥ 60 px) | Next / previous track |

## 🎬 Dev Review Mode

> [!TIP]
> Press `D` to enter dev review mode. Annotate each video with status flags, replacement IDs, and free-text notes. All data auto-saves to `localStorage`.

Statuses: `OK` · `LYRIC` · `LIVE` · `AUDIO` · `FAN` · `WRONG` · `DROP`

When dev mode is active, only un-reviewed tracks play (auto-skip reviewed). Export your review session from the browser console:

```js
window.vktrsReviewsMarkdown()   // export a Markdown report
window.vktrsReviews()            // raw review object
window.vktrsReviewsCount()       // summary statistics
window.vktrsReviewsClear()       // wipe all reviews
```

## 📡 Data Pipeline

The 1,211-track dataset lives in `public/videos.json`. Scripts in `scripts/` manage the full lifecycle:

| Script | Purpose |
|--------|---------|
| `enrich.mjs` | Resolves `seed-tracks.json` → `videos.json` (YouTube IDs, embeddability) |
| `csv-to-seed.mjs` | Converts Exportify / Hitster CSVs to seed format |
| `musicbrainz-lookup.mjs` | Resumable MusicBrainz enrichment, with cache |
| `apply-metadata.mjs` | Merges enriched metadata back into `videos.json` |
| `verify.mjs` | Checks every ID is reachable and embeddable |

> [!WARNING]
> `enrich.mjs` can use `youtubei.js` (unofficial, no key needed) or the official Data API (`YT_API_KEY`). Never commit your `YT_API_KEY`. Use the official path for production data updates.

See [`scripts/README.md`](scripts/README.md) for full CLI reference.

## ⚙️ Development

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

## 🔌 Deployment

Set the `VITE_BASE` environment variable to the repo subpath for GitHub Pages project sites (e.g. `/video-killed-the-radio-star/`). Leave it unset for root deployments and custom domains.

```bash
VITE_BASE=/video-killed-the-radio-star/ npm run build
```

The deploy workflow (`.github/workflows/deploy.yml`) handles this automatically. See [`docs/deployment.md`](docs/deployment.md) for full instructions.

## 📙 Documentation

| Doc | Contents |
|-----|---------|
| [docs/usage.md](docs/usage.md) | Controls, TV Guide, presets, search, queue |
| [docs/guess-game.md](docs/guess-game.md) | The self-rated guessing game |
| [docs/data.md](docs/data.md) | `videos.json` schema, adding videos |
| [docs/architecture.md](docs/architecture.md) | Layout, conventions, playback, persistence |
| [docs/quality.md](docs/quality.md) | Tooling, CI, unit tests, E2E |
| [docs/accessibility.md](docs/accessibility.md) | Focus management, ARIA, reduced-motion |
| [docs/mobile.md](docs/mobile.md) | Gestures and iPad robustness |
| [docs/deployment.md](docs/deployment.md) | GitHub Pages + PWA / offline |
| [scripts/README.md](scripts/README.md) | Data pipeline CLI reference |

## 📜 License

Source code is **MIT licensed** — see [`LICENSE`](LICENSE). Music videos stream from YouTube and remain © their respective owners, subject to the [YouTube Terms of Service](https://www.youtube.com/t/terms). A notice is shown in-app on the start screen and in the TV Guide.
