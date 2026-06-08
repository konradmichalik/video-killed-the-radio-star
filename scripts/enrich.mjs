#!/usr/bin/env node
/**
 * enrich.mjs — resolve "Artist + Title" -> YouTube video_id and build videos.json.
 *
 * Reads a seed list (artist/title/year/genre[, country]), looks up each track's
 * YouTube video id, checks that it is embeddable, de-duplicates, resolves the
 * artist's country of origin (seed value, else MusicBrainz), and writes the
 * schema the app expects: { title, artist, year, genre, country?, video_id }
 *
 * Providers (choose with --provider):
 *   youtubei  (default)  no API key, uses youtubei.js (YouTube's InnerTube)
 *   dataapi              official YouTube Data API v3, needs env YT_API_KEY
 *   mock                 offline: resolves from scripts/fixtures.json (tests/CI)
 *
 * Country of origin: taken from the seed entry's `country` if present, otherwise
 * looked up once per artist from MusicBrainz (artist "area"/country). Disable
 * the network lookup with --no-musicbrainz (then only seed countries are used).
 *
 * Usage:
 *   node scripts/enrich.mjs                         # youtubei, full pipeline
 *   node scripts/enrich.mjs --provider dataapi      # official API (YT_API_KEY)
 *   node scripts/enrich.mjs --provider mock         # offline demo / test
 *   node scripts/enrich.mjs --no-musicbrainz        # skip country lookups
 *   node scripts/enrich.mjs --dry-run               # don't write, just report
 *   node scripts/enrich.mjs --limit 5               # only the first 5 tracks
 *   node scripts/enrich.mjs --help
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { values } = parseArgs({
  options: {
    input: { type: 'string', default: join('scripts', 'seed-tracks.json') },
    output: { type: 'string', default: join('public', 'videos.json') },
    provider: { type: 'string', default: 'youtubei' },
    fixtures: { type: 'string', default: join('scripts', 'fixtures.json') },
    'query-suffix': { type: 'string', default: 'official video' },
    'check-embed': { type: 'boolean', default: true },
    'keep-non-embeddable': { type: 'boolean', default: false },
    'no-musicbrainz': { type: 'boolean', default: false },
    delay: { type: 'string', default: '500' },
    limit: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
});

if (values.help) {
  console.log(`enrich.mjs — build videos.json from a seed list.

  --input <file>            seed JSON (default scripts/seed-tracks.json)
  --output <file>           output JSON (default public/videos.json)
  --provider <name>         youtubei | dataapi | mock   (default youtubei)
  --fixtures <file>         mock lookup table (default scripts/fixtures.json)
  --query-suffix <text>     appended to "artist title" (default "official video")
  --check-embed             verify embeddability (default true)
  --keep-non-embeddable     keep videos that can't be embedded (default false)
  --no-musicbrainz          skip the artist country lookup (use seed only)
  --delay <ms>              pause between live lookups (default 500)
  --limit <n>               only process the first n tracks
  --dry-run                 report without writing the output file
  --help                    show this help
`);
  process.exit(0);
}

/* --------------------------------------------------------------------------
   Resolvers — each returns { videoId, embeddable, resolvedTitle? } or null
   -------------------------------------------------------------------------- */

async function mockResolver(opts) {
  const table = JSON.parse(await readFile(resolve(ROOT, opts.fixtures), 'utf8'));
  return (t) => {
    const hit = table[`${t.artist}::${t.title}`];
    return hit ? { videoId: hit.video_id, embeddable: hit.embeddable !== false } : null;
  };
}

async function youtubeiResolver(opts) {
  // lazy import so `mock`/`dataapi` don't require the dependency
  const { Innertube } = await import('youtubei.js');
  const yt = await Innertube.create({ retrieve_player: false });

  return async (t) => {
    const query = `${t.artist} ${t.title} ${opts['query-suffix']}`.trim();
    const search = await yt.search(query, { type: 'video' });
    const hit = search.videos?.[0] ?? search.results?.find((r) => r.id || r.video_id);
    const videoId = hit?.id ?? hit?.video_id;
    if (!videoId) return null;

    let embeddable = true;
    if (opts['check-embed']) {
      try {
        const info = await yt.getBasicInfo(videoId);
        if (info?.basic_info && 'is_embeddable' in info.basic_info) {
          embeddable = info.basic_info.is_embeddable !== false;
        }
      } catch {
        /* fail open: if we can't tell, assume embeddable and let the app skip on error */
      }
    }
    return { videoId, embeddable, resolvedTitle: hit?.title?.text };
  };
}

async function dataApiResolver(opts) {
  const key = process.env.YT_API_KEY;
  if (!key) throw new Error('Set YT_API_KEY to use --provider dataapi');
  const base = 'https://www.googleapis.com/youtube/v3';

  return async (t) => {
    const q = encodeURIComponent(`${t.artist} ${t.title}`);
    const sr = await fetch(`${base}/search?part=snippet&type=video&maxResults=1&q=${q}&key=${key}`);
    const sj = await sr.json();
    const videoId = sj.items?.[0]?.id?.videoId;
    if (!videoId) return null;

    let embeddable = true;
    if (opts['check-embed']) {
      const vr = await fetch(
        `${base}/videos?part=status&fields=items/status/embeddable&id=${videoId}&key=${key}`,
      );
      const vj = await vr.json();
      embeddable = vj.items?.[0]?.status?.embeddable !== false;
    }
    return { videoId, embeddable };
  };
}

const RESOLVERS = {
  mock: mockResolver,
  youtubei: youtubeiResolver,
  dataapi: dataApiResolver,
};

/* --------------------------------------------------------------------------
   Country of origin — MusicBrainz "area"/country, cached per artist.
   MusicBrainz asks for a descriptive User-Agent and <= 1 request/second.
   -------------------------------------------------------------------------- */

const ISO_TO_NAME = {
  US: 'United States',
  GB: 'United Kingdom',
  IE: 'Ireland',
  FR: 'France',
  DE: 'Germany',
  NO: 'Norway',
  SE: 'Sweden',
  AU: 'Australia',
  NZ: 'New Zealand',
  CA: 'Canada',
  BB: 'Barbados',
};

function makeCountryLookup() {
  const cache = new Map();
  return async (artist) => {
    if (cache.has(artist)) return cache.get(artist);
    let country = null;
    try {
      const q = encodeURIComponent(`artist:"${artist}"`);
      const res = await fetch(`https://musicbrainz.org/ws/2/artist?query=${q}&fmt=json&limit=1`, {
        headers: { 'User-Agent': 'VKTRS/1.0 (music-video channel; enrich.mjs)' },
      });
      const json = await res.json();
      const a = json.artists?.[0];
      country =
        a?.area?.name || a?.['begin-area']?.name || ISO_TO_NAME[a?.country] || a?.country || null;
    } catch {
      /* offline / blocked — leave country unknown */
    }
    cache.set(artist, country);
    return country;
  };
}

/* --------------------------------------------------------------------------
   Main
   -------------------------------------------------------------------------- */

async function main() {
  const makeResolver = RESOLVERS[values.provider];
  if (!makeResolver) throw new Error(`Unknown provider "${values.provider}"`);

  const seed = JSON.parse(await readFile(resolve(ROOT, values.input), 'utf8'));
  const tracks = values.limit ? seed.slice(0, Number(values.limit)) : seed;
  const resolve_ = await makeResolver(values);
  const live = values.provider !== 'mock';
  const lookupCountry = makeCountryLookup();
  const useMB = live && !values['no-musicbrainz'];

  console.log(`\n  provider: ${values.provider}   tracks: ${tracks.length}\n`);

  const out = [];
  const seen = new Set();
  const pending = [];
  const stats = { resolved: 0, notFound: 0, nonEmbeddable: 0, duplicate: 0 };

  for (const t of tracks) {
    const label = `${t.artist} — ${t.title}`;
    let r = null;
    try {
      r = await resolve_(t);
    } catch (err) {
      console.warn(`  ! error    ${label}: ${err.message}`);
    }

    if (!r?.videoId) {
      stats.notFound++;
      pending.push(label);
      console.warn(`  ? no match ${label}`);
    } else if (!r.embeddable && !values['keep-non-embeddable']) {
      stats.nonEmbeddable++;
      console.warn(`  ⊘ blocked  ${label} (${r.videoId} not embeddable)`);
    } else if (seen.has(r.videoId)) {
      stats.duplicate++;
      console.warn(`  = dup      ${label} (${r.videoId})`);
    } else {
      seen.add(r.videoId);
      const country = t.country ?? (useMB ? await lookupCountry(t.artist) : null);
      const entry = {
        title: t.title,
        artist: t.artist,
        year: t.year,
        genre: t.genre,
        video_id: r.videoId,
      };
      if (country) entry.country = country;
      out.push(entry);
      stats.resolved++;
      console.log(`  ✓ ${r.videoId}  ${label}${country ? `  [${country}]` : ''}`);
    }

    if (live) await sleep(Number(values.delay));
  }

  console.log(
    `\n  resolved ${stats.resolved} · no match ${stats.notFound} · ` +
      `non-embeddable ${stats.nonEmbeddable} · duplicates ${stats.duplicate}\n`,
  );

  if (pending.length && live === false) {
    console.log('  (mock has no id for these — run a live provider to resolve them:)');
    for (const p of pending) console.log(`    · ${p}`);
    console.log('');
  }

  if (values['dry-run']) {
    console.log('  dry-run: nothing written.\n');
    return;
  }

  await writeFile(resolve(ROOT, values.output), JSON.stringify(out, null, 2) + '\n');
  console.log(`  wrote ${out.length} videos -> ${values.output}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
