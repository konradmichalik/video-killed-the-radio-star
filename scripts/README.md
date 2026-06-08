# Data enrichment — `enrich.mjs`

Turns a plain seed list of tracks (artist / title / year / genre) into the
app's `public/videos.json` by resolving each track to a **YouTube video id**
and verifying it is **embeddable**.

```
scripts/
  enrich.mjs          the script
  seed-tracks.json    input: 42 starter tracks (metadata only)
  fixtures.json       offline lookup table for --provider mock (tests/CI)
```

## TL;DR

```bash
# Fill public/videos.json from the seed list (no API key needed):
node scripts/enrich.mjs

# Offline demo / CI (no network) — resolves from fixtures.json:
node scripts/enrich.mjs --provider mock

# Official YouTube Data API (ToS-clean, needs a key):
YT_API_KEY=AIza... node scripts/enrich.mjs --provider dataapi
```

## Input format

`seed-tracks.json` is just an array; `video_id` is filled in by the script:

```json
[{ "artist": "a-ha", "title": "Take On Me", "year": 1985, "genre": "Synthpop" }]
```

Output matches the app schema exactly:

```json
[{ "title": "...", "artist": "...", "year": 1985, "genre": "...", "video_id": "..." }]
```

## Providers

| Provider          | API key | Network    | Notes                                                                                                                                 |
| ----------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `youtubei` (def.) | no      | YouTube    | Uses `youtubei.js` (InnerTube). Easiest. Unofficial → may break, ToS grey area.                                                       |
| `dataapi`         | yes     | googleapis | Official YouTube Data API v3. `status.embeddable` is authoritative. Search costs 100 quota units (~100 lookups/day on the free tier). |
| `mock`            | no      | none       | Resolves from `fixtures.json`. Used by the offline test below.                                                                        |

The provider is the only thing that changes; parsing, embeddability filtering,
de-duplication, logging and output are shared.

## Options

```
--input <file>          seed JSON           (default scripts/seed-tracks.json)
--output <file>         output JSON          (default public/videos.json)
--provider <name>       youtubei | dataapi | mock   (default youtubei)
--fixtures <file>       mock table           (default scripts/fixtures.json)
--query-suffix <text>   appended to "artist title"  (default "official video")
--check-embed           verify embeddability        (default on)
--keep-non-embeddable   keep blocked videos anyway  (default off → dropped)
--delay <ms>            pause between live lookups   (default 500)
--limit <n>             only the first n tracks
--dry-run               report without writing
--help
```

## What "embeddable" means here

A video can exist but still refuse to play in an `<iframe>` (the rights holder
disabled embedding). The script checks this and **drops** such videos by default
so they never enter `videos.json`. With `dataapi` the check is exact
(`videos.list?part=status` → `status.embeddable`); with `youtubei` it is
best-effort and fails open. Either way, the player also auto-skips on error at
runtime as a safety net.

## Offline test

This is what runs in CI / sandboxes without YouTube access:

```bash
node scripts/enrich.mjs --provider mock
```

It resolves every track that exists in `fixtures.json`, lists the rest as
"resolve live", and writes the result. The current `fixtures.json` covers the
20 originally-curated tracks; the other 22 seed tracks resolve on a live run.

## Swapping in your own list

Replace `seed-tracks.json` (or pass `--input your-list.json`) and run a live
provider. Genres in the app's TV Guide are generated from whatever ends up in
`videos.json`, so new genres appear automatically.

> The seed metadata (artist/title/year/genre) is accurate; the **ids** are what
> the live run resolves and verifies. Re-run any time to refresh ids that rot.

---

# CSV import — `csv-to-seed.mjs`

Turn a CSV of songs into the seed (or directly into `videos.json`). It
auto-detects common headers from **Exportify** (Spotify playlist export) and the
**songseeker Hitster** CSVs, filters to a year window, de-dupes by
artist+title, and sorts by year.

```bash
# Exportify export -> seed, MTV window, then enrich resolves ids:
node scripts/csv-to-seed.mjs export.csv --from 1975 --to 2013 --output scripts/seed-tracks.json
node scripts/enrich.mjs

# songseeker CSV that already has YouTube links -> straight to videos.json:
node scripts/csv-to-seed.mjs hitster-de.csv --from 1975 --to 2013 \
  --target videos --output public/videos.json
npm run verify
```

- `--target seed` (default) writes `{ title, artist, year, genre, country? }`.
  `--target videos` also carries a `video_id` parsed from a YouTube column.
- Output defaults to `scripts/seed.generated.json` (so it won't clobber the
  curated seed) — point `--output` where you want it.
- Override any column: `--artist-col`, `--title-col`, `--year-col`,
  `--genre-col`, `--country-col`, `--video-col`. Rows without a detected genre
  get `--fallback-genre` (default `Other`) — curate those before shipping.
- `--dry-run` reports the detected column mapping + counts without writing.

> Treat third-party curated lists (e.g. Hitster) as a **starting point** to
> verify and adapt, not a finished product — see the note in
> [`docs/data.md`](../docs/data.md).

---

# Data verification — `verify.mjs`

Checks every `video_id` in `public/videos.json` for reachability and
embeddability, and reports broken entries. Used by the scheduled
`Verify data` GitHub workflow.

```bash
npm run verify                       # oEmbed (no key), human-readable
node scripts/verify.mjs --report verify-report.md   # write a markdown report
node scripts/verify.mjs --provider mock             # offline (tests/CI)
YT_API_KEY=AIza... node scripts/verify.mjs          # authoritative Data API
```

It exits non-zero if anything fails, so CI can raise an issue.

| Provider        | Key | How it judges a video                                              |
| --------------- | --- | ------------------------------------------------------------------ |
| `oembed` (def.) | no  | oEmbed HTTP status: 200 ok · 401/403 embedding disabled · 404 gone |
| `dataapi`       | yes | `videos.list?part=status` → `embeddable` / `privacyStatus` (exact) |
| `mock`          | no  | `scripts/verify-fixtures.json` (used by the offline test)          |

oEmbed is a reliable heuristic and needs no key/quota; the Data API is
authoritative — add a `YT_API_KEY` repo secret and the workflow upgrades to it
automatically.
