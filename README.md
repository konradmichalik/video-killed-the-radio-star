<p align="center">
  <img src="screenshot.jpg" alt="VKTRS start screen — VIDEO KILLED THE RADIO STAR wordmark with neo-brutalist VKTRS station block above the TURN ON TV button" width="720">
</p>

<h1 align="center"><a href="https://www.youtube.com/watch?v=W8r-tXRLazs">VideoKilledTheRadioStar (VKTRS)</a></h1>

<p align="center">
  <a href="https://konradmichalik.github.io/video-killed-the-radio-star/"><img src="https://img.shields.io/badge/demo-live-FF2E63?style=flat-square&logo=github" alt="Live demo"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-08D9D6?style=flat-square" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Svelte-5-FF3E00?style=flat-square&logo=svelte&logoColor=white" alt="Svelte 5">
  <img src="https://img.shields.io/badge/Vite-PWA-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite + PWA">
</p>

<p align="center">
A full-screen retro-TV PWA that turns a curated catalogue of music videos into a lean-back MTV-style channel — complete with CRT overlay, channel-change static, neo-brutalist UI, and a year-guess game you can play solo or together (phones join the TV in Connected mode). Built with Vite + Svelte 5. Mobile-first, installable offline.
</p>

> It hosts no media. Videos stream via the YouTube IFrame Player API and remain © their respective owners.

## 🚀 Quick Start

**Watch it live** → [konradmichalik.github.io/video-killed-the-radio-star](https://konradmichalik.github.io/video-killed-the-radio-star/)

Works in any modern browser, but for the canonical experience install it as a PWA: on **iPad / iPhone in Safari → Share → Add to Home Screen**, or on **Android in Chrome → menu → Add to Home screen / Install app**. The installed PWA runs full-screen and supports offline launch.

<details>
<summary><b>Run it locally</b> — for hacking or LAN testing</summary>

```bash
npm install
npm run dev        # Vite dev server on :5173, LAN-visible
```

Then open the printed **Network:** URL (e.g. `http://192.168.x.x:5173`) on your iPad/phone, or `http://localhost:5173` on desktop.

> [!IMPORTANT]
> YouTube embeds require an `http(s)` origin. Always use the dev server URL — never open `file://` directly.

```bash
npm run build      # Production build + PWA service worker
npm run preview    # Preview the built dist
npm run verify     # Check all videos.json IDs are reachable and embeddable
```

> [!NOTE]
> The PWA service worker only registers on **HTTPS or `localhost`**. Test offline behaviour there, not on a LAN IP.

</details>

> [!TIP]
> **About YouTube ads** — VKTRS streams via the YouTube IFrame Player, and YouTube serves pre-roll ads on embedded third-party sites. We use the privacy-enhanced `youtube-nocookie.com` host and detect ad playback (`ADVERTISEMENT` indicator + tap-through to YouTube's own "Skip Ad" button), but the ads themselves cannot be suppressed in a Terms-of-Service-compliant way. Installing VKTRS as a PWA used to reduce ad delivery (via iOS Intelligent Tracking Prevention), but this no longer reliably holds — expect ads even in the installed app.

## ✨ Features

- **Full-screen channel** — shuffle play, smooth preloaded song-to-song transitions, "▶ COMING UP" teasers, end-screen suppression (~1.5 s preempt before YouTube's "more videos" overlay)
- **TV Guide** — build your own channel: year range, genre and country filters, one-tap presets and CRT / SONG INFO / STATION LOGO toggles all tune the catalogue to your own taste
- **Search** with ranked autocomplete; **Queue** editor with drag-to-reorder; **Settings** panel
- **Game modes** — opt-in **Solo** (self-rated guess game: REVEAL, ✓/✗, streak + hit-rate stats in the sheet) and **Connected** (phones join the TV via QR, year-guess per round, closest year wins) — see [`docs/game-modes.md`](docs/game-modes.md)

> [!NOTE]
> **Connected mode signaling** runs through the **public [PeerJS](https://peerjs.com) broker** (`0.peerjs.com`). No data is stored there — only the WebRTC handshake passes through, after which TV and phones talk peer-to-peer. The broker is a free community service without SLA: if it is rate-limited or temporarily down, new rooms can't be created or joined until it recovers (in-flight rooms keep working). Hosts behind symmetric NAT (some corporate / mobile-carrier networks) may also fail to connect since no TURN server is configured. For reliable production use, run your own [`peerjs-server`](https://github.com/peers/peerjs-server) and point `new Peer(id, { host, port })` in `src/lib/multiplayer/peer.js` at it.

- **Neo-brutalist UI** — VKTRS station-bug logo (player corner), "VIDEO KILLED / THE RADIO STAR" wordmark with RGB-glitch effect on the start screen and all overlay sheets, hard teal offset shadows
- **Curated catalogue** — enriched via Hitster card datasets and MusicBrainz API, verified embeddable
- **Installable PWA** — Workbox precaches the app shell and `videos.json`; launches offline (streaming still needs the network)
- **iPad-hardened** — wake lock, fullscreen API, autoplay fallback, test-card error states, reduced-motion support

## 🤝 Contributing

The catalogue currently holds **1,150+ verified music videos** and keeps growing. The easiest way to contribute is to suggest tracks for it or to fix broken / wrong replacement IDs.

**Suggest a new song** — open an issue (or PR) with:

| Field                   | Example                                    |
| ----------------------- | ------------------------------------------ |
| Artist                  | `Talking Heads`                            |
| Title                   | `Once in a Lifetime`                       |
| Year (original release) | `1980`                                     |
| Genre                   | `New Wave`                                 |
| Country (artist origin) | `United States`                            |
| YouTube `video_id`      | `I1wg1DNHbNU` (the 11-char `v=` parameter) |

Bonus points if you've checked that the video is actually embeddable (no `not-embeddable` / `not-found` from `npm run verify`) and is the **official music video** — not a lyric video, audio rip, or fan upload.

The maintainer will append your submission to `scripts/seed-tracks.json`, run `scripts/enrich.mjs` + `scripts/verify.mjs` to confirm embeddability, and add it to `public/videos.json`. See [DEVELOPMENT.md](DEVELOPMENT.md) for the in-app dev-review mode that lets active maintainers walk the catalogue and submit replacement IDs from the browser console.

## 🛠 Development

For local development, dev review mode, data pipeline scripts, and the GitHub Pages deployment workflow, see [`DEVELOPMENT.md`](DEVELOPMENT.md).

## 📜 License

Source code is **MIT licensed** — see [`LICENSE`](LICENSE). Music videos stream from YouTube and remain © their respective owners, subject to the [YouTube Terms of Service](https://www.youtube.com/t/terms). A notice is shown in-app on the start screen and in the TV Guide.
