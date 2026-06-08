# Quality tooling

| Command                | What it does                                       |
| ---------------------- | -------------------------------------------------- |
| `npm run lint`         | ESLint (flat config) for JS + Svelte               |
| `npm run lint:fix`     | ESLint with autofix                                |
| `npm run format`       | Prettier (with `prettier-plugin-svelte`)           |
| `npm run format:check` | Prettier check only (CI-friendly)                  |
| `npm run check`        | `svelte-check` — Svelte/a11y/compiler diagnostics  |
| `npm test`             | Vitest unit tests (run once)                       |
| `npm run test:watch`   | Vitest in watch mode                               |
| `npm run test:e2e`     | Playwright mobile E2E (see below)                  |
| `npm run verify`       | Check `videos.json` ids for reachability/embedding |

## Unit tests

Pure logic is isolated and covered without a DOM (fast `node` environment) —
currently **50 tests**:

- `gestures.test.js` — swipe/tap resolution, edge zones, thresholds.
- `data.test.js` + `search.test.js` — filter/shuffle/genre, country filter,
  ranked autocomplete.
- `presets.test.js` — data-driven channel generation.
- `game.test.js` — guess-game scoring (streak / best / hit-rate).
- `player.test.js` — the init watchdog (fake timers).
- `verify.test.js` — the data-verify reachability/embedding checks.

## Continuous integration (`.github/workflows/`)

- **`ci.yml`** — on every push/PR: `lint`, `format:check`, `check`, `test`,
  `build`. (An optional mobile Playwright E2E job is included but disabled.)
- **`verify-data.yml`** — weekly / on demand: runs `verify.mjs` against
  `public/videos.json`; on any unreachable or non-embeddable id it uploads a
  report and opens/updates a GitHub issue labelled `data-verify`. Add a
  `YT_API_KEY` secret to use the authoritative Data API instead of the oEmbed
  heuristic.

## E2E (Playwright, touch emulation)

`playwright.config.js` emulates **iPhone 13** and **iPad** (`hasTouch`);
`e2e/navigation.spec.js` drives real pointer events (power on, swipe-up opens
the guide, backdrop tap closes it). Browser binaries aren't bundled:

```bash
npx playwright install   # one-time
npm run test:e2e
```
