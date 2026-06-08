import { describe, it, expect } from 'vitest';
import { buildPresets } from '../src/lib/presets.js';

const sample = [
  { artist: 'a', title: 'x', year: 1983, genre: 'Pop' },
  { artist: 'b', title: 'y', year: 1991, genre: 'Grunge' },
  { artist: 'c', title: 'z', year: 2002, genre: 'Hip-Hop' },
  { artist: 'd', title: 'w', year: 2013, genre: 'Dance' },
];

describe('buildPresets', () => {
  const presets = buildPresets(sample);
  const labels = presets.map((p) => p.label);

  it('returns nothing for empty input', () => {
    expect(buildPresets([])).toEqual([]);
  });

  it('always starts with an All Time preset spanning the data', () => {
    expect(presets[0]).toMatchObject({
      label: 'All Time',
      yearMin: 1983,
      yearMax: 2013,
      genres: null,
    });
  });

  it('includes decade presets that overlap the data', () => {
    expect(labels).toContain('Best of 80s');
    expect(labels).toContain('Best of 90s');
    expect(labels).toContain('Best of 00s');
    expect(labels).toContain('Best of 10s');
  });

  it('omits decades with no data (no 70s)', () => {
    expect(labels).not.toContain('Best of 70s');
  });

  it('clamps decade ranges to the data bounds', () => {
    const eighties = presets.find((p) => p.label === 'Best of 80s');
    expect(eighties).toMatchObject({ yearMin: 1983, yearMax: 1989 });
    const tens = presets.find((p) => p.label === 'Best of 10s');
    expect(tens).toMatchObject({ yearMin: 2010, yearMax: 2013 });
  });

  it('only offers genre channels whose genres exist', () => {
    const hiphop = presets.find((p) => p.label === 'Hip-Hop');
    expect(hiphop).toBeTruthy();
    expect(hiphop.genres).toEqual(['Hip-Hop']);
    // Rock Block keeps only the genres present in the data
    const rock = presets.find((p) => p.label === 'Rock Block');
    expect(rock.genres).toEqual(['Grunge']);
  });
});
