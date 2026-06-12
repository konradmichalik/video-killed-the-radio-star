#!/usr/bin/env node
/**
 * find-candidates.mjs — for each seed track, search YouTube and pick the
 * best embeddable music-video candidate (prefer ≥1 M views, official-looking
 * uploader, no live/cover/reaction).
 *
 * Output: scripts/me100-candidates.json
 *   [{ rank?, artist, title, year, genre, country,
 *      video_id, view_count, channel, resolved_title, embeddable,
 *      candidates: [{ video_id, channel, views, title }] }]
 *
 * Usage:
 *   node scripts/find-candidates.mjs                  # full seed
 *   node scripts/find-candidates.mjs --limit 5        # first 5
 *   node scripts/find-candidates.mjs --min-views 500000
 *   node scripts/find-candidates.mjs --input scripts/seed-tracks-me100.json
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { values } = parseArgs({
  options: {
    input: { type: 'string', default: join('scripts', 'seed-tracks-me100.json') },
    output: { type: 'string', default: join('scripts', 'me100-candidates.json') },
    'top-n': { type: 'string', default: '6' },
    'min-views': { type: 'string', default: '1000000' },
    limit: { type: 'string' },
    delay: { type: 'string', default: '700' },
    'query-suffix': { type: 'string', default: 'official video' },
  },
});

const TOP_N = Number(values['top-n']);
const MIN_VIEWS = Number(values['min-views']);
const LIMIT = values.limit ? Number(values.limit) : Infinity;
const DELAY = Number(values.delay);

const BAD_TITLE = /\b(live|cover|tribute|reaction|karaoke|instrumental|remix|tutorial|lesson|guitar lesson|playthrough)\b/i;
const OFFICIAL = /(VEVO|official|records|topic|- topic)/i;

function parseViews(v) {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  const s = String(v).replace(/[, ]/g, '').toLowerCase();
  const m = s.match(/^([\d.]+)\s*([kmb])?/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const suffix = m[2];
  if (suffix === 'k') return Math.round(n * 1e3);
  if (suffix === 'm') return Math.round(n * 1e6);
  if (suffix === 'b') return Math.round(n * 1e9);
  return Math.round(n);
}

function scoreCandidate(c, seed) {
  let s = 0;
  if (c.embeddable) s += 1000;
  else s -= 5000;
  if (BAD_TITLE.test(c.title || '')) s -= 800;
  if (OFFICIAL.test(c.channel || '')) s += 500;
  if (c.views >= MIN_VIEWS) s += 1500;
  s += Math.log10(Math.max(c.views, 1)) * 80;
  // title/artist match
  const t = (c.title || '').toLowerCase();
  if (t.includes(seed.title.toLowerCase().split('(')[0].trim())) s += 300;
  if (t.includes(seed.artist.toLowerCase().split('&')[0].trim())) s += 200;
  return s;
}

async function main() {
  const { Innertube } = await import('youtubei.js');
  const yt = await Innertube.create({ retrieve_player: false });

  const inPath = resolve(ROOT, values.input);
  const seed = JSON.parse(await readFile(inPath, 'utf8'));
  const limited = seed.slice(0, LIMIT);

  const out = [];
  for (let i = 0; i < limited.length; i++) {
    const t = limited[i];
    const q = `${t.artist} ${t.title} ${values['query-suffix']}`.trim();
    process.stdout.write(`[${i + 1}/${limited.length}] ${t.artist} – ${t.title} … `);
    let candidates = [];
    try {
      const search = await yt.search(q, { type: 'video' });
      const top = (search.videos || []).slice(0, TOP_N);

      for (const hit of top) {
        const vid = hit.id || hit.video_id;
        if (!vid) continue;
        let views = parseViews(hit.short_view_count?.text || hit.view_count?.text);
        let embeddable = true;
        let channel = hit.author?.name || hit.channel?.name || '';
        let title = hit.title?.text || '';
        try {
          await sleep(120);
          const info = await yt.getBasicInfo(vid);
          if (info?.basic_info) {
            if (typeof info.basic_info.view_count === 'number') views = info.basic_info.view_count;
            if ('is_embeddable' in info.basic_info) embeddable = info.basic_info.is_embeddable !== false;
            channel = info.basic_info.channel?.name || info.basic_info.author || channel;
            title = info.basic_info.title || title;
          }
        } catch { /* swallow per-video errors */ }
        candidates.push({ video_id: vid, channel, views, title, embeddable });
      }
    } catch (e) {
      console.log(`SEARCH ERROR: ${e.message}`);
    }

    candidates.sort((a, b) => scoreCandidate(b, t) - scoreCandidate(a, t));
    const best = candidates.find((c) => c.embeddable) || candidates[0] || null;

    const entry = {
      ...t,
      video_id: best?.video_id || null,
      view_count: best?.views || 0,
      channel: best?.channel || null,
      resolved_title: best?.title || null,
      embeddable: best?.embeddable ?? null,
      meets_threshold: (best?.views || 0) >= MIN_VIEWS,
      candidates: candidates.map(({ video_id, channel, views, title, embeddable }) => ({
        video_id, channel, views, title, embeddable,
      })),
    };
    out.push(entry);

    const vTag = entry.view_count >= 1e9
      ? `${(entry.view_count / 1e9).toFixed(2)}B`
      : entry.view_count >= 1e6
        ? `${(entry.view_count / 1e6).toFixed(1)}M`
        : entry.view_count >= 1e3
          ? `${Math.round(entry.view_count / 1e3)}k`
          : String(entry.view_count);
    console.log(
      entry.video_id
        ? `→ ${entry.video_id} (${vTag} · ${entry.channel || '?'}${entry.embeddable ? '' : ' · NOT-EMBEDDABLE'})`
        : '→ no candidate',
    );

    await sleep(DELAY);
  }

  const outPath = resolve(ROOT, values.output);
  await writeFile(outPath, JSON.stringify(out, null, 2));

  const kept = out.filter((e) => e.video_id && e.embeddable && e.meets_threshold);
  const borderline = out.filter((e) => e.video_id && e.embeddable && !e.meets_threshold);
  const dropped = out.filter((e) => !e.video_id || !e.embeddable);

  console.log(`\nResults written: ${outPath}`);
  console.log(`  kept (≥${MIN_VIEWS.toLocaleString()} views, embeddable): ${kept.length}`);
  console.log(`  borderline (embeddable, fewer views):                   ${borderline.length}`);
  console.log(`  dropped (no candidate / not embeddable):                ${dropped.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
