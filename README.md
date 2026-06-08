# VideoKilledTheRadioStar (VKTRS)

A nostalgic, full-screen **"MTV channel"** PWA — built with Vite + Svelte. It
streams music videos via the YouTube IFrame API with a CSS-static start screen,
an animated MTV lower-third, invisible tap/swipe controls, a teletext-style TV
Guide, an optional CRT tube-TV filter, and a lean-back guess game.

> It hosts no media: videos are streamed from YouTube and remain © their owners.

## Quick start

```bash
npm install
npm run dev
```

Open the printed **Network:** URL (e.g. `http://192.168.x.x:5173`) on your iPad.
YouTube embeds need an `http(s)` origin — use the dev server, not `file://`.

```bash
npm run build      # production build (generates the PWA service worker)
npm run verify     # check videos.json ids are reachable / embeddable
```

## Features

- Full-screen channel: shuffle, smooth preloaded song-to-song transitions, "▶
  COMING UP" teasers.
- **TV Guide** — year range, genre + country (origin) filters, one-tap channel
  presets, CRT / SONG INFO / STATION LOGO switches.
- **Search** with ranked autocomplete; **Queue** editor; **guess game** with
  streak + hit-rate.
- iPad-hardened (wake lock, fullscreen, autoplay fallback, test-card error
  states), accessible (focus-trapped dialogs, ARIA, reduced-motion), and an
  installable offline PWA.

## Documentation

| Doc                                    | What's in it                               |
| -------------------------------------- | ------------------------------------------ |
| [usage](docs/usage.md)                 | Controls, TV Guide, presets, search, queue |
| [guess-game](docs/guess-game.md)       | The self-rated guessing game               |
| [data](docs/data.md)                   | `videos.json` schema, enrich/add videos    |
| [architecture](docs/architecture.md)   | Layout, conventions, playback, persistence |
| [quality](docs/quality.md)             | Tooling, CI, unit tests, E2E               |
| [accessibility](docs/accessibility.md) | Focus management, ARIA, reduced-motion     |
| [mobile](docs/mobile.md)               | Gestures + iPad robustness                 |
| [deployment](docs/deployment.md)       | GitHub Pages + PWA / offline               |
| [scripts/README](scripts/README.md)    | `enrich.mjs` / `verify.mjs` reference      |

## Tech stack

Vite · Svelte · vite-plugin-pwa (Workbox) · Vitest · Playwright · ESLint +
Prettier. Prefer **SvelteKit**? The components and stores port over unchanged.

## License & legal

Source is **MIT licensed** (see `LICENSE`). Music videos are streamed from
YouTube via the IFrame Player API and remain © their respective owners; use is
subject to the [YouTube Terms of Service](https://www.youtube.com/t/terms). The
optional `youtubei.js` path in `scripts/` is unofficial — prefer the official
Data API (`YT_API_KEY`) for production. A short notice is shown in-app on the
start screen and in the TV Guide.
