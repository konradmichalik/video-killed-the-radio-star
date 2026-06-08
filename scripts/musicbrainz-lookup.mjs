#!/usr/bin/env node
/**
 * musicbrainz-lookup.mjs — fill missing genre/country in public/videos.json by
 * looking up each unique artist on MusicBrainz (free, no API key required).
 *
 * Maps MB top-tag → our genre vocabulary, MB country ISO code → full name.
 * Only fills `Other`/missing fields; never overwrites existing values.
 * Cache is written after each successful lookup, so re-runs are cheap.
 *
 * Rate-limit: MusicBrainz allows 1 req/sec/UA. We wait 1100ms between calls.
 *
 *   node scripts/musicbrainz-lookup.mjs                  # full run
 *   node scripts/musicbrainz-lookup.mjs --dry-run        # show what would change
 *   node scripts/musicbrainz-lookup.mjs --limit 50       # stop after N artists
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'VKTRS-data-tool/1.0 ( https://github.com/km/vktrs )';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// MB user-tag → our genre vocabulary. First match wins. Lowercase comparison.
const TAG_TO_GENRE = [
  // electronic family
  [/(synth-?pop|electropop)/, 'Synthpop'],
  [/(eurodance|euro house|house|techno|electronic|edm|trance|dance-pop|dance pop)/, 'Dance'],
  // rock family
  [/grunge/, 'Grunge'],
  [/(britpop|brit pop)/, 'Britpop'],
  [/(indie pop|indie rock|indie folk|indietronica|^indie$)/, 'Indie'],
  [/alternative/, 'Alternative'],
  [/(metal|nu metal|nu-metal|industrial metal|gothic metal|power metal)/, 'Metal'],
  [/(pop punk|punk rock|^punk$|hardcore punk|post-punk|new wave punk)/, 'Punk'],
  [/(new wave|no wave|post-new-wave)/, 'New Wave'],
  [/(hard rock|classic rock|arena rock|soft rock|stadium rock|rock and roll|^rock$|prog|krautrock)/, 'Rock'],
  // hiphop/r&b/soul
  [/(hip hop|hip-hop|hiphop|rap|trap|gangsta)/, 'Hip-Hop'],
  [/(r&b|rnb|rhythm and blues|contemporary r&b)/, 'R&B'],
  [/(neo soul|neo-soul|northern soul|soul)/, 'Soul'],
  [/funk/, 'Funk'],
  [/disco/, 'Disco'],
  // global / specialty
  [/reggae|dancehall|ska/, 'Reggae'],
  [/(schlager|volksmusik|deutsche schlager)/, 'Schlager'],
  [/(folk rock|^folk$|singer-songwriter|americana|country folk)/, 'Folk'],
  [/(country|country pop)/, 'Country'],
  [/(latin|reggaeton|salsa|cumbia|bachata)/, 'Latin'],
  [/(jazz|swing|bebop|big band)/, 'Jazz'],
  [/blues/, 'Blues'],
  [/gospel|christian/, 'Gospel'],
  // pop (last so it's a fallback before generic)
  [/(synthwave|chillwave|bedroom pop|art pop|baroque pop|teen pop|^pop$|adult contemporary)/, 'Pop'],
];

// MB country ISO 3166-1 alpha-2 → display name (matches existing data).
const ISO_TO_COUNTRY = {
  US: 'United States', GB: 'United Kingdom', DE: 'Germany', FR: 'France',
  CA: 'Canada', AU: 'Australia', NL: 'Netherlands', IT: 'Italy',
  SE: 'Sweden', IE: 'Ireland', AT: 'Austria', BE: 'Belgium',
  ES: 'Spain', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  JM: 'Jamaica', BR: 'Brazil', JP: 'Japan', NZ: 'New Zealand',
  MX: 'Mexico', CO: 'Colombia', MD: 'Moldova', CH: 'Switzerland',
  IS: 'Iceland', HU: 'Hungary', PL: 'Poland', CZ: 'Czech Republic',
  RO: 'Romania', GR: 'Greece', PT: 'Portugal', RU: 'Russia',
  UA: 'Ukraine', TR: 'Turkey', IL: 'Israel', ZA: 'South Africa',
  AR: 'Argentina', CL: 'Chile', PE: 'Peru', KR: 'South Korea',
  CN: 'China', IN: 'India', PH: 'Philippines', TH: 'Thailand',
  EG: 'Egypt', NG: 'Nigeria', GH: 'Ghana', SK: 'Slovakia',
  HR: 'Croatia', SI: 'Slovenia', RS: 'Serbia', BG: 'Bulgaria',
  LT: 'Lithuania', LV: 'Latvia', EE: 'Estonia', LU: 'Luxembourg',
  XW: null, // worldwide / supranational — skip
};

/** Map first matching MB tag to our genre (lowercase, sorted by vote count). */
export function mapTags(tags) {
  if (!Array.isArray(tags)) return null;
  const sorted = [...tags].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  for (const { name } of sorted) {
    const n = String(name || '').toLowerCase().trim();
    for (const [rx, genre] of TAG_TO_GENRE) {
      if (rx.test(n)) return genre;
    }
  }
  return null;
}

export function mapCountry(code) {
  if (!code) return null;
  return ISO_TO_COUNTRY[String(code).toUpperCase()] ?? null;
}

async function lookupArtist(name) {
  const url = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(`artist:"${name}"`)}&limit=3&fmt=json`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const hit = (json.artists ?? [])[0];
  if (!hit) return { found: false };
  // Only trust strong matches (score 90+).
  if ((hit.score ?? 0) < 90) return { found: false, lowScore: hit.score };
  return {
    found: true,
    name: hit.name,
    score: hit.score,
    country: hit.country ?? null,
    tags: hit.tags ?? [],
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      limit: { type: 'string' },
      input: { type: 'string', default: 'public/videos.json' },
      cache: { type: 'string', default: 'scripts/sources/mb-cache.json' },
    },
  });
  const limit = values.limit ? Number(values.limit) : Infinity;

  const inPath = resolve(ROOT, values.input);
  const cachePath = resolve(ROOT, values.cache);
  await mkdir(dirname(cachePath), { recursive: true });

  const videos = JSON.parse(await readFile(inPath, 'utf8'));
  const cache = existsSync(cachePath) ? JSON.parse(await readFile(cachePath, 'utf8')) : {};

  // Build a deterministic queue of artists that need lookup
  const seen = new Set();
  const queue = [];
  for (const v of videos) {
    const needGenre = !v.genre || v.genre === 'Other';
    const needCountry = !v.country;
    if (!needGenre && !needCountry) continue;
    if (seen.has(v.artist)) continue;
    seen.add(v.artist);
    if (cache[v.artist]) continue; // already looked up
    queue.push(v.artist);
  }
  console.log(`videos: ${videos.length}  Other-or-missing-country artists to look up: ${queue.length}`);
  console.log(`cache: ${Object.keys(cache).length} previously cached, limit: ${limit === Infinity ? 'no limit' : limit}`);
  if (!queue.length) console.log('nothing to do.');

  let done = 0, hits = 0, lowScore = 0, errors = 0;
  for (const artist of queue) {
    if (done >= limit) break;
    try {
      const r = await lookupArtist(artist);
      cache[artist] = {
        ...r,
        genre: r.found ? mapTags(r.tags) : null,
        countryName: r.found ? mapCountry(r.country) : null,
        at: new Date().toISOString(),
      };
      if (r.found) hits++;
      else if (r.lowScore) lowScore++;
    } catch (e) {
      cache[artist] = { error: e.message, at: new Date().toISOString() };
      errors++;
    }
    done++;
    // Persist after every lookup so we can resume on interruption.
    await writeFile(cachePath, JSON.stringify(cache, null, 2));
    if (done % 25 === 0 || done === queue.length) {
      console.log(`  ${done}/${Math.min(queue.length, limit)}  hits=${hits} lowScore=${lowScore} errors=${errors}`);
    }
    await sleep(1100); // respect MB's 1 req/sec/UA limit
  }

  // Apply cache to videos.json
  let genreFilled = 0, countryFilled = 0;
  const updated = videos.map((v) => {
    const c = cache[v.artist];
    if (!c) return v;
    const out = { ...v };
    if ((!out.genre || out.genre === 'Other') && c.genre) {
      out.genre = c.genre;
      genreFilled++;
    }
    if (!out.country && c.countryName) {
      out.country = c.countryName;
      countryFilled++;
    }
    return out;
  });

  console.log(`\n  filled: genre=${genreFilled}  country=${countryFilled}`);

  if (values['dry-run']) {
    console.log('  dry-run: not writing.');
    return;
  }
  await writeFile(inPath, JSON.stringify(updated, null, 2) + '\n');
  console.log(`  wrote ${updated.length} entries -> ${values.input}`);
}

const invokedDirectly = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
