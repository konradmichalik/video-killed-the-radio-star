import { describe, it, expect } from 'vitest';
import { shuffle, genresOf, yearBounds, filterVideos } from '../src/lib/data.js';

const sample = [
  { title: 'A', artist: 'x', year: 1985, genre: 'Synthpop', video_id: '1' },
  { title: 'B', artist: 'y', year: 1991, genre: 'Grunge', video_id: '2' },
  { title: 'C', artist: 'z', year: 2004, genre: 'Rock', video_id: '3' },
  { title: 'D', artist: 'w', year: 2013, genre: 'Dance', video_id: '4' },
];

const byId = (a, b) => a.video_id.localeCompare(b.video_id);

describe('shuffle', () => {
  it('keeps the same items and length', () => {
    const out = shuffle(sample);
    expect(out).toHaveLength(sample.length);
    expect([...out].sort(byId)).toEqual([...sample].sort(byId));
  });

  it('does not mutate the input array', () => {
    const copy = [...sample];
    shuffle(sample);
    expect(sample).toEqual(copy);
  });
});

describe('genresOf', () => {
  it('returns unique, sorted genres', () => {
    const dup = [...sample, { ...sample[0] }];
    expect(genresOf(dup)).toEqual(['Dance', 'Grunge', 'Rock', 'Synthpop']);
  });
});

describe('yearBounds', () => {
  it('returns [min, max] year', () => {
    expect(yearBounds(sample)).toEqual([1985, 2013]);
  });
});

describe('filterVideos', () => {
  it('filters by year range and genre set', () => {
    const out = filterVideos(sample, {
      yearMin: 1990,
      yearMax: 2010,
      genres: new Set(['Grunge', 'Rock']),
    });
    expect(out.map((v) => v.title)).toEqual(['B', 'C']);
  });

  it('returns empty when nothing matches', () => {
    const out = filterVideos(sample, {
      yearMin: 1990,
      yearMax: 2010,
      genres: new Set(['Dance']),
    });
    expect(out).toEqual([]);
  });

  it('excludes a genre that is toggled off even if the year matches', () => {
    const out = filterVideos(sample, {
      yearMin: 1980,
      yearMax: 2020,
      genres: new Set(['Synthpop']),
    });
    expect(out.map((v) => v.title)).toEqual(['A']);
  });
});
