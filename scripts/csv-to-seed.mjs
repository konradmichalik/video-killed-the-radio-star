#!/usr/bin/env node
/**
 * csv-to-seed.mjs — turn a CSV of songs into the app's seed (or videos) JSON.
 *
 * Works with column-flexible input: it auto-detects common headers from
 * Exportify (Spotify playlist export) and the songseeker Hitster CSVs, and you
 * can override any column with a flag. Filters to a year window, de-dupes by
 * artist+title, sorts by year.
 *
 *   --target seed    (default) -> { title, artist, year, genre, country? }
 *                                 feed this to scripts/enrich.mjs to add ids
 *   --target videos            -> also carries video_id parsed from a YouTube
 *                                 column, ready for public/videos.json (then
 *                                 run `npm run verify`)
 *
 * Usage:
 *   node scripts/csv-to-seed.mjs hitster-de.csv --from 1975 --to 2013
 *   node scripts/csv-to-seed.mjs export.csv --output scripts/seed-tracks.json
 *   node scripts/csv-to-seed.mjs cards.csv --target videos --output public/videos.json
 *   node scripts/csv-to-seed.mjs in.csv --artist-col "Artist Name(s)" --year-col "Release Date"
 *   node scripts/csv-to-seed.mjs in.csv --dry-run
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* --------------------------------------------------------------------------
   Pure helpers (exported for tests)
   -------------------------------------------------------------------------- */

/** Minimal but correct CSV parser: handles quotes, "" escapes, CRLF, newlines in fields. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** First plausible 4-digit year found in a value (handles "1985-07-01", "07/1985"). */
export function extractYear(value) {
  const m = String(value ?? '').match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

/** Pull an 11-char YouTube id from a url or accept a bare id. */
export function extractVideoId(value) {
  const s = String(value ?? '').trim();
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

const ALIASES = {
  artist: [
    'artist',
    'artist name(s)',
    'artists',
    'interpret',
    'künstler',
    'kuenstler',
    'performer',
  ],
  title: ['title', 'track name', 'track', 'song', 'titel', 'name', 'song title'],
  year: ['year', 'jahr', 'release date', 'album release date', 'released', 'date'],
  genre: ['genre', 'genres', 'genre(s)'],
  country: ['country', 'land', 'origin', 'herkunft'],
  video: [
    'video_id',
    'videoid',
    'youtube',
    'youtube link',
    'youtube url',
    'youtube_url',
    'url',
    'link',
    'video',
  ],
};

/** Map each logical field to a column index using aliases, with explicit overrides. */
export function buildColumnMap(header, overrides = {}) {
  const norm = header.map((h) => String(h).trim().toLowerCase());
  const find = (field) => {
    if (overrides[field]) return norm.indexOf(String(overrides[field]).trim().toLowerCase());
    for (const a of ALIASES[field]) {
      const i = norm.indexOf(a);
      if (i >= 0) return i;
    }
    return -1;
  };
  const map = {};
  for (const field of Object.keys(ALIASES)) map[field] = find(field);
  return map;
}

function tidyGenre(raw) {
  const first = String(raw).split(/[;,/]/)[0].trim();
  return first.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/** Build one seed/videos entry from a row, or null if required fields are missing. */
export function rowToEntry(row, map, { target = 'seed', fallbackGenre = 'Other' } = {}) {
  const get = (i) => (i >= 0 && i < row.length ? String(row[i]).trim() : '');
  const artist = get(map.artist);
  const title = get(map.title);
  const year = extractYear(get(map.year));
  if (!artist || !title || !year) return null;

  const rawGenre = get(map.genre);
  const country = get(map.country);
  const entry = { title, artist, year, genre: rawGenre ? tidyGenre(rawGenre) : fallbackGenre };
  if (country) entry.country = country;

  if (target === 'videos') {
    const videoId = extractVideoId(get(map.video));
    if (!videoId) return null; // can't make a videos.json entry without an id
    entry.video_id = videoId;
  }
  return entry;
}

/** Parse + map + filter + de-dupe + sort. Returns { entries, map, stats }. */
export function convert(text, opts = {}) {
  const { from = 0, to = 9999, target = 'seed', columns = {}, fallbackGenre = 'Other' } = opts;
  const rows = parseCsv(text).filter((r) => r.some((c) => String(c).trim() !== ''));
  const stats = { rows: 0, kept: 0, skipped: 0, outOfRange: 0, duplicates: 0, fallbackGenre: 0 };
  if (rows.length < 2) return { entries: [], map: {}, stats };

  const map = buildColumnMap(rows[0], columns);
  stats.rows = rows.length - 1;
  const seen = new Set();
  const entries = [];

  for (let i = 1; i < rows.length; i++) {
    const entry = rowToEntry(rows[i], map, { target, fallbackGenre });
    if (!entry) {
      stats.skipped++;
      continue;
    }
    if (entry.year < from || entry.year > to) {
      stats.outOfRange++;
      continue;
    }
    const key = `${entry.artist}\u0000${entry.title}`.toLowerCase();
    if (seen.has(key)) {
      stats.duplicates++;
      continue;
    }
    seen.add(key);
    if (map.genre < 0 || !String(rows[i][map.genre] ?? '').trim()) stats.fallbackGenre++;
    entries.push(entry);
    stats.kept++;
  }

  entries.sort((a, b) => a.year - b.year || a.artist.localeCompare(b.artist));
  return { entries, map, stats };
}

/* --------------------------------------------------------------------------
   CLI
   -------------------------------------------------------------------------- */

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      input: { type: 'string' },
      output: { type: 'string', default: join('scripts', 'seed.generated.json') },
      target: { type: 'string', default: 'seed' },
      from: { type: 'string', default: '0' },
      to: { type: 'string', default: '9999' },
      'artist-col': { type: 'string' },
      'title-col': { type: 'string' },
      'year-col': { type: 'string' },
      'genre-col': { type: 'string' },
      'country-col': { type: 'string' },
      'video-col': { type: 'string' },
      'fallback-genre': { type: 'string', default: 'Other' },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    console.log(`csv-to-seed.mjs — CSV (Exportify / songseeker) -> seed or videos JSON.

  <file>                    input CSV (or use --input)
  --output <file>           output JSON (default scripts/seed.generated.json)
  --target seed|videos      seed for enrich.mjs, or videos for public/videos.json
  --from <year> --to <year> keep only this (inclusive) year window
  --artist-col / --title-col / --year-col / --genre-col / --country-col / --video-col
                            override auto-detected column names
  --fallback-genre <name>   genre for rows without one (default "Other")
  --dry-run                 report without writing
  --help
`);
    return;
  }

  const inputPath = values.input || positionals[0];
  if (!inputPath) throw new Error('No input CSV given (pass a file path or --input).');
  if (!['seed', 'videos'].includes(values.target)) {
    throw new Error(`--target must be "seed" or "videos" (got "${values.target}")`);
  }

  const text = await readFile(resolve(ROOT, inputPath), 'utf8');
  const columns = {
    artist: values['artist-col'],
    title: values['title-col'],
    year: values['year-col'],
    genre: values['genre-col'],
    country: values['country-col'],
    video: values['video-col'],
  };
  const { entries, map, stats } = convert(text, {
    from: Number(values.from),
    to: Number(values.to),
    target: values.target,
    columns,
    fallbackGenre: values['fallback-genre'],
  });

  const header = parseCsv(text)[0] ?? [];
  const col = (i) => (i >= 0 ? `"${header[i]}"` : '—');
  console.log(`\n  column mapping (detected):
    artist  -> ${col(map.artist)}
    title   -> ${col(map.title)}
    year    -> ${col(map.year)}
    genre   -> ${col(map.genre)}
    country -> ${col(map.country)}${values.target === 'videos' ? `\n    video   -> ${col(map.video)}` : ''}`);

  console.log(
    `\n  ${stats.rows} rows -> kept ${stats.kept} · skipped ${stats.skipped} · ` +
      `out of range ${stats.outOfRange} · duplicates ${stats.duplicates}`,
  );
  if (stats.fallbackGenre) {
    console.log(
      `  note: ${stats.fallbackGenre} entr${stats.fallbackGenre === 1 ? 'y' : 'ies'} got the "${values['fallback-genre']}" genre — curate before shipping.`,
    );
  }

  if (values['dry-run']) {
    console.log('\n  dry-run: nothing written.\n');
    return;
  }
  await writeFile(resolve(ROOT, values.output), JSON.stringify(entries, null, 2) + '\n');
  console.log(`\n  wrote ${entries.length} entries -> ${values.output}`);
  if (values.target === 'seed')
    console.log('  next: node scripts/enrich.mjs --input ' + values.output + '\n');
  else console.log('  next: copy to public/videos.json and run `npm run verify`\n');
}

const invokedDirectly = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
