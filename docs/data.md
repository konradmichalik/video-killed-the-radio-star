# Data

`public/videos.json` is the channel "database". Each entry:

```json
{
  "title": "...",
  "artist": "...",
  "year": 1999,
  "genre": "...",
  "country": "United Kingdom",
  "video_id": "YOUTUBE_ID"
}
```

`country` is **optional** — entries without it still play and are never hidden
by the ORIGIN filter. Genres, countries and presets in the guide are all derived
from this file automatically.

> Starter `video_id`s are well-known official clips, but YouTube IDs and
> embedding permissions change. Any video that refuses to embed is caught
> (`onError`) and auto-skipped, so the channel never stalls — verify/swap IDs
> for production.

## Generate from a seed list

Build `videos.json` from a plain track list with `scripts/enrich.mjs` — it
resolves each "artist + title" to a YouTube id, drops non-embeddable ones, and
fills `country` from the seed or MusicBrainz:

```bash
node scripts/enrich.mjs                       # youtubei.js, no API key
node scripts/enrich.mjs --provider dataapi    # official API (YT_API_KEY)
node scripts/enrich.mjs --provider mock       # offline (tests/CI)
node scripts/enrich.mjs --no-musicbrainz      # skip country lookups
```

Seed list: `scripts/seed-tracks.json` (42 starter tracks, each with a country).
Full tooling reference: [`scripts/README.md`](../scripts/README.md).

## Import a CSV (Exportify / Hitster)

Already have a list? `scripts/csv-to-seed.mjs` converts a CSV into the seed (or
straight into `videos.json` when it has YouTube links), auto-detecting Exportify
and songseeker-Hitster columns, filtering to a year window and de-duping:

```bash
node scripts/csv-to-seed.mjs playlist.csv --from 1975 --to 2013 \
  --output scripts/seed-tracks.json   # then: node scripts/enrich.mjs
```

Ready-made starting points: the MIT-licensed
[`andygruber/songseeker-hitster-playlists`](https://github.com/andygruber/songseeker-hitster-playlists)
CSVs (artist/title/year + YouTube links for many Hitster editions), or export a
Spotify playlist to CSV with Exportify. Treat such curated selections as a
**base to verify and adapt**, not a finished product — the facts
(artist/title/year) are free to use, but a third party's specific curation can
carry compilation/database rights, especially in the EU. The app itself hosts no
media; it only streams from YouTube.

### Ready-made base included

`scripts/videos.hitster.json` is a generated starting set: **205 tracks
(1975–2013)** built from the MIT-licensed songseeker German Hitster CSV via the
importer above, then enriched with genre + country from `scripts/artist-meta.json`
(a curated, editable artist map) using `scripts/apply-metadata.mjs`. Coverage:
**202/205 have a genre, 199/205 a country** — only three niche/novelty acts are
left as `Other`. To try it, copy it over the demo and verify:

```bash
cp scripts/videos.hitster.json public/videos.json
npm run verify        # check the YouTube ids are reachable / embeddable
```

To re-enrich after editing the artist map (or a fresh import):

```bash
node scripts/apply-metadata.mjs --input scripts/videos.hitster.json
```

`apply-metadata.mjs` fills missing `genre`/`country` by artist, drawing on
`artist-meta.json` plus the curated `seed-tracks.json` and `videos.json`
(`--overwrite` replaces existing values, `--dry-run` just reports). The genre
labels are **editorial judgement** — easy to adjust in `artist-meta.json`.
Embeddability still isn't verified in this repo; run `npm run verify`, and the
ids are Hitster's picks (mostly official videos, some may be audio) — re-run
`enrich.mjs` if you want guaranteed music videos.

## Add videos manually

Edit `public/videos.json` directly using the schema above. The guide updates
itself from the file — no rebuild of the app code needed.
