<p align="center">
  <img src="screenshot.jpg" alt="VKTRS start screen — VIDEO KILLED THE RADIO STAR wordmark with neo-brutalist VKTRS station block above the TURN ON TV button" width="720">
</p>

# VideoKilledTheRadioStar (VKTRS)

A full-screen retro-TV PWA that turns a curated catalogue of music videos into a lean-back MTV-style channel — complete with CRT overlay, channel-change static, neo-brutalist UI, and a self-rated guess game. Built with Vite + Svelte 5. Mobile-first, iPad-optimised, installable offline.

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
- **Curated catalogue** — enriched via Hitster card datasets and MusicBrainz API, verified embeddable
- **Installable PWA** — Workbox precaches the app shell and `videos.json`; launches offline (streaming still needs the network)
- **iPad-hardened** — wake lock, fullscreen API, autoplay fallback, test-card error states, reduced-motion support

## 🎮 Controls

### Keyboard

| Key       | Action                       |
| --------- | ---------------------------- |
| `Space`   | Play / pause                 |
| `←` / `→` | Previous / next track        |
| `↑`       | Open TV Guide                |
| `↓`       | Show song info (lower third) |
| `Q`       | Open Queue                   |
| `/`       | Open Search                  |
| `I`       | Show/hide STATION LOGO       |
| `M`       | Toggle CRT filter            |
| `F`       | Toggle fullscreen            |
| `D`       | Toggle dev review mode       |
| `Esc`     | Close any open panel         |

### Touch / Swipe

| Gesture                      | Action                |
| ---------------------------- | --------------------- |
| Tap left third               | Previous track        |
| Tap right third              | Next track            |
| Tap centre                   | Play / pause          |
| Swipe up (≥ 60 px)           | Open TV Guide         |
| Swipe down (≥ 60 px)         | Show song info        |
| Swipe left / right (≥ 60 px) | Next / previous track |

## 🛠 Development

For local development, dev review mode, data pipeline scripts, and the GitHub Pages deployment workflow, see [`DEVELOPMENT.md`](DEVELOPMENT.md).

## 📜 License

Source code is **MIT licensed** — see [`LICENSE`](LICENSE). Music videos stream from YouTube and remain © their respective owners, subject to the [YouTube Terms of Service](https://www.youtube.com/t/terms). A notice is shown in-app on the start screen and in the TV Guide.
