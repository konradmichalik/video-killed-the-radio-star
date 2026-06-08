#!/usr/bin/env node
/**
 * apply-metadata.mjs — fill missing genre/country in a videos/seed JSON from
 * lookup tables, matched by artist.
 *
 * Lookup sources (later ones only used as fallback):
 *   1. scripts/artist-meta.json  — curated { "<artist>": { genre, country } }
 *   2. scripts/seed-tracks.json  — the curated seed (artist-level)
 *   3. public/videos.json        — the curated demo
 *
 * Only fills fields that are missing or set to the "Other" placeholder; pass
 * --overwrite to replace existing values too.
 *
 * Usage:
 *   node scripts/apply-metadata.mjs --input scripts/videos.hitster.json
 *   node scripts/apply-metadata.mjs --input scripts/videos.hitster.json --output public/videos.json
 *   node scripts/apply-metadata.mjs --input file.json --overwrite --dry-run
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PLACEHOLDER = 'Other';

/* --------------------------------------------------------------------------
   Pure helpers (exported for tests)
   -------------------------------------------------------------------------- */

export function normalizeArtist(name) {
  return String(name ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '') // drop punctuation/spaces
    .trim();
}

/**
 * Build a normalized artist -> { genre?, country? } lookup. Earlier tables win;
 * each can be a plain { artist: meta } map or an array of track objects.
 */
export function buildLookup(tables) {
  const map = new Map();
  for (const table of tables) {
    const entries = Array.isArray(table)
      ? table.map((t) => [t.artist, { genre: t.genre, country: t.country }])
      : Object.entries(table);
    for (const [artist, meta] of entries) {
      const key = normalizeArtist(artist);
      if (!key) continue;
      const prev = map.get(key) ?? {};
      // earlier tables win: only fill gaps from later ones
      map.set(key, {
        genre: prev.genre ?? meta.genre,
        country: prev.country ?? meta.country,
      });
    }
  }
  return map;
}

/** Fill genre/country on each video from the lookup. Returns { videos, stats }. */
export function applyMetadata(videos, lookup, { overwrite = false } = {}) {
  const stats = { total: videos.length, genre: 0, country: 0, unmatched: 0, missingGenre: 0 };
  const out = videos.map((v) => {
    const meta = lookup.get(normalizeArtist(v.artist));
    const next = { ...v };
    if (meta) {
      const genreEmpty = !next.genre || next.genre === PLACEHOLDER;
      if (meta.genre && (overwrite || genreEmpty)) {
        if (next.genre !== meta.genre) stats.genre++;
        next.genre = meta.genre;
      }
      if (meta.country && (overwrite || !next.country)) {
        if (next.country !== meta.country) stats.country++;
        next.country = meta.country;
      }
    } else {
      stats.unmatched++;
    }
    if (!next.genre || next.genre === PLACEHOLDER) stats.missingGenre++;
    return next;
  });
  return { videos: out, stats };
}

/* --------------------------------------------------------------------------
   CLI
   -------------------------------------------------------------------------- */

async function readJson(path) {
  return JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
}
async function readJsonOr(path, fallback) {
  try {
    return await readJson(path);
  } catch {
    return fallback;
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      input: { type: 'string' },
      output: { type: 'string' },
      meta: { type: 'string', default: join('scripts', 'artist-meta.json') },
      overwrite: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help || !values.input) {
    console.log(`apply-metadata.mjs — fill genre/country by artist.

  --input <file>     videos/seed JSON to enrich (required)
  --output <file>    where to write (default: in place, = --input)
  --meta <file>      curated artist map (default scripts/artist-meta.json)
  --overwrite        replace existing genre/country too (default: gaps only)
  --dry-run          report without writing
`);
    return;
  }

  const videos = await readJson(values.input);
  const artistMeta = await readJsonOr(values.meta, {});
  const seed = await readJsonOr(join('scripts', 'seed-tracks.json'), []);
  const demo = await readJsonOr(join('public', 'videos.json'), []);
  const lookup = buildLookup([artistMeta, seed, demo]);

  const { videos: out, stats } = applyMetadata(videos, lookup, { overwrite: values.overwrite });

  console.log(
    `\n  ${stats.total} tracks · filled genre ${stats.genre} · country ${stats.country}` +
      ` · unmatched artists ${stats.unmatched} · still without genre ${stats.missingGenre}\n`,
  );

  if (values['dry-run']) {
    console.log('  dry-run: nothing written.\n');
    return;
  }
  const outPath = values.output || values.input;
  await writeFile(resolve(ROOT, outPath), JSON.stringify(out, null, 2) + '\n');
  console.log(`  wrote ${out.length} tracks -> ${outPath}\n`);
}

const invokedDirectly = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
