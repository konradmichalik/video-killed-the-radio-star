import { describe, it, expect } from 'vitest';
import { classifyOembedStatus, buildReport, STATUS } from '../scripts/verify.mjs';

describe('classifyOembedStatus', () => {
  it('200 -> ok', () => expect(classifyOembedStatus(200)).toBe(STATUS.OK));
  it('401 -> not-embeddable', () => expect(classifyOembedStatus(401)).toBe(STATUS.NOT_EMBEDDABLE));
  it('403 -> not-embeddable', () => expect(classifyOembedStatus(403)).toBe(STATUS.NOT_EMBEDDABLE));
  it('404 -> not-found', () => expect(classifyOembedStatus(404)).toBe(STATUS.NOT_FOUND));
  it('500 -> error', () => expect(classifyOembedStatus(500)).toBe(STATUS.ERROR));
});

describe('buildReport', () => {
  const results = [
    { artist: 'a-ha', title: 'Take On Me', video_id: 'aaa', status: STATUS.OK },
    { artist: 'X', title: 'Y', video_id: 'bbb', status: STATUS.NOT_EMBEDDABLE, detail: 'HTTP 401' },
  ];

  it('returns null when everything is ok', () => {
    const ok = results.filter((r) => r.status === STATUS.OK);
    expect(buildReport(ok)).toBeNull();
  });

  it('lists failing entries with their id and status', () => {
    const md = buildReport(results, { provider: 'oembed', checked: 2 });
    expect(md).toContain('1 issue(s)');
    expect(md).toContain('bbb');
    expect(md).toContain('not-embeddable');
    expect(md).not.toContain('aaa'); // ok entries are not listed
  });
});
