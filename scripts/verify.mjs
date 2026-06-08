#!/usr/bin/env node
/**
 * verify.mjs — check every video_id in videos.json for reachability and
 * embeddability, and report broken entries.
 *
 * Providers (auto-detected, override with --provider):
 *   oembed  (default)  no API key. YouTube oEmbed status code tells us:
 *                        200 -> ok, 401/403 -> embedding disabled, 404 -> gone
 *   dataapi            official Data API v3 (env YT_API_KEY). Authoritative.
 *   mock               offline: reads scripts/verify-fixtures.json (tests/CI)
 *
 * Exit code is non-zero when any entry fails, so CI can flag/raise an issue.
 *
 * Usage:
 *   node scripts/verify.mjs
 *   node scripts/verify.mjs --report verify-report.md
 *   node scripts/verify.mjs --provider mock
 *   YT_API_KEY=AIza... node scripts/verify.mjs --provider dataapi
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const STATUS = {
  OK: 'ok',
  NOT_EMBEDDABLE: 'not-embeddable',
  NOT_FOUND: 'not-found',
  ERROR: 'error',
};

/** Map a YouTube oEmbed HTTP status to our STATUS. (pure, unit-tested) */
export function classifyOembedStatus(httpStatus) {
  if (httpStatus === 200) return STATUS.OK;
  if (httpStatus === 401 || httpStatus === 403) return STATUS.NOT_EMBEDDABLE;
  if (httpStatus === 404 || httpStatus === 400) return STATUS.NOT_FOUND;
  return STATUS.ERROR;
}

/** Build a markdown report from results, or null if everything is OK. (pure) */
export function buildReport(results, { provider, checked } = {}) {
  const failures = results.filter((r) => r.status !== STATUS.OK);
  if (!failures.length) return null;

  const rows = failures
    .map(
      (r) =>
        `| \`${r.status}\` | ${r.artist} — ${r.title} | \`${r.video_id}\` | ${r.detail ?? ''} |`,
    )
    .join('\n');

  return `# ⚠️ VKTRS data verification — ${failures.length} issue(s)

Checked **${checked ?? results.length}** entries in \`public/videos.json\` via \`${provider ?? 'oembed'}\` on ${new Date().toISOString()}.

| Status | Track | video_id | Detail |
| ------ | ----- | -------- | ------ |
${rows}

**Status meanings**
- \`not-embeddable\` — the video exists but the owner disabled embedding.
- \`not-found\` — removed, private, or invalid id.
- \`error\` — could not be checked (network / unexpected response).

Fix by re-resolving the ids (\`node scripts/enrich.mjs\`) or removing the dead entries.
`;
}

/* ---------------------------------------------------------------- checkers */

async function checkOembed(video) {
  const target = `https://www.youtube.com/watch?v=${video.video_id}`;
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(target)}&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'vktrs-verify' } });
    const status = classifyOembedStatus(res.status);
    return { status, detail: status === STATUS.OK ? '' : `HTTP ${res.status}` };
  } catch (err) {
    return { status: STATUS.ERROR, detail: err.message };
  }
}

async function checkDataApiBatch(videos, key) {
  const base = 'https://www.googleapis.com/youtube/v3';
  const byId = new Map();
  for (let i = 0; i < videos.length; i += 50) {
    const chunk = videos.slice(i, i + 50);
    const ids = chunk.map((v) => v.video_id).join(',');
    const res = await fetch(
      `${base}/videos?part=status&fields=items(id,status/embeddable,status/privacyStatus,status/uploadStatus)&id=${ids}&key=${key}`,
    );
    const json = await res.json();
    for (const item of json.items ?? []) byId.set(item.id, item.status);
  }
  return videos.map((v) => {
    const s = byId.get(v.video_id);
    if (!s) return { ...v, status: STATUS.NOT_FOUND, detail: 'not returned by API' };
    if (s.privacyStatus === 'private') return { ...v, status: STATUS.NOT_FOUND, detail: 'private' };
    if (s.embeddable === false)
      return { ...v, status: STATUS.NOT_EMBEDDABLE, detail: 'embeddable=false' };
    return { ...v, status: STATUS.OK, detail: '' };
  });
}

async function checkMock(videos, opts) {
  const table = JSON.parse(await readFile(resolve(ROOT, opts.fixtures), 'utf8'));
  return videos.map((v) => {
    const status = table[v.video_id] ?? STATUS.ERROR;
    return { ...v, status, detail: status === STATUS.OK ? '' : 'mock' };
  });
}

/* -------------------------------------------------------------------- main */

async function main() {
  const { values } = parseArgs({
    options: {
      input: { type: 'string', default: join('public', 'videos.json') },
      provider: { type: 'string', default: 'auto' },
      fixtures: { type: 'string', default: join('scripts', 'verify-fixtures.json') },
      report: { type: 'string' },
      delay: { type: 'string', default: '200' },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    console.log(
      'verify.mjs — check videos.json ids for reachability/embeddability.\n' +
        '  --input <file>    videos json (default public/videos.json)\n' +
        '  --provider <name> auto | oembed | dataapi | mock\n' +
        '  --report <file>   write a markdown report on failure\n' +
        '  --delay <ms>      pause between live checks (default 200)\n' +
        '  --json            print machine-readable JSON\n',
    );
    return 0;
  }

  let provider = values.provider;
  if (provider === 'auto') provider = process.env.YT_API_KEY ? 'dataapi' : 'oembed';

  const videos = JSON.parse(await readFile(resolve(ROOT, values.input), 'utf8'));
  let results;

  if (provider === 'dataapi') {
    if (!process.env.YT_API_KEY) throw new Error('Set YT_API_KEY for --provider dataapi');
    results = await checkDataApiBatch(videos, process.env.YT_API_KEY);
  } else if (provider === 'mock') {
    results = await checkMock(videos, values);
  } else {
    results = [];
    for (const v of videos) {
      const r = await checkOembed(v);
      results.push({ ...v, ...r });
      if (r.status === STATUS.OK) console.log(`  ✓ ${v.video_id}  ${v.artist} — ${v.title}`);
      else console.warn(`  ✗ ${r.status.padEnd(14)} ${v.video_id}  ${v.artist} — ${v.title}`);
      await sleep(Number(values.delay));
    }
  }

  const failures = results.filter((r) => r.status !== STATUS.OK);
  console.log(
    `\n  ${provider}: ${results.length - failures.length}/${results.length} ok, ${failures.length} issue(s)\n`,
  );

  if (values.json) console.log(JSON.stringify(results, null, 2));

  const report = buildReport(results, { provider, checked: results.length });
  if (values.report && report) {
    await writeFile(resolve(ROOT, values.report), report);
    console.log(`  report written -> ${values.report}\n`);
  }

  return failures.length ? 1 : 0;
}

// only run when invoked directly (so tests can import the pure helpers)
const invokedDirectly = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err);
      process.exit(2);
    });
}
