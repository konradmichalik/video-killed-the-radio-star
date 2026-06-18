import { describe, it, expect } from 'vitest';
import { countriesOf, filterVideos, searchVideos } from '../src/lib/data.js';

const sample = [
  {
    title: 'Take On Me',
    artist: 'a-ha',
    year: 1985,
    genre: 'Synthpop',
    country: 'Norway',
    video_id: '1',
  },
  {
    title: 'Creep',
    artist: 'Radiohead',
    year: 1992,
    genre: 'Alternative',
    country: 'United Kingdom',
    video_id: '2',
  },
  {
    title: 'Lose Yourself',
    artist: 'Eminem',
    year: 2002,
    genre: 'Hip-Hop',
    country: 'United States',
    video_id: '3',
  },
  {
    title: 'Get Lucky',
    artist: 'Daft Punk',
    year: 2013,
    genre: 'Dance',
    country: 'France',
    video_id: '4',
  },
  { title: 'No Country', artist: 'Unknown', year: 2000, genre: 'Rock', video_id: '5' },
];

describe('countriesOf', () => {
  it('returns unique, sorted, non-empty countries', () => {
    expect(countriesOf(sample)).toEqual(['France', 'Norway', 'United Kingdom', 'United States']);
  });
});

describe('filterVideos with countries', () => {
  const all = new Set(['Synthpop', 'Alternative', 'Hip-Hop', 'Dance', 'Rock']);

  it('keeps only the selected countries', () => {
    const out = filterVideos(sample, {
      yearMin: 1900,
      yearMax: 2100,
      genres: all,
      countries: new Set(['United Kingdom', 'France']),
    });
    expect(out.map((v) => v.title)).toEqual(['Creep', 'Get Lucky']);
  });

  it('excludes entries that have no country when a subset is active', () => {
    const out = filterVideos(sample, {
      yearMin: 1900,
      yearMax: 2100,
      genres: all,
      countries: new Set(['United States']),
    });
    expect(out.map((v) => v.title)).toEqual(['Lose Yourself']);
  });

  it('applies no country constraint when countries is null', () => {
    const out = filterVideos(sample, {
      yearMin: 1900,
      yearMax: 2100,
      genres: all,
      countries: null,
    });
    expect(out).toHaveLength(5);
  });
});

describe('searchVideos', () => {
  it('returns nothing for an empty query', () => {
    expect(searchVideos(sample, '')).toEqual([]);
    expect(searchVideos(sample, '   ')).toEqual([]);
  });

  it('matches on artist and ranks a prefix hit first', () => {
    const out = searchVideos(sample, 'daft');
    expect(out[0].title).toBe('Get Lucky');
  });

  it('matches on title regardless of case', () => {
    const out = searchVideos(sample, 'CREEP');
    expect(out.map((v) => v.artist)).toContain('Radiohead');
  });

  it('matches on country and year', () => {
    expect(searchVideos(sample, 'norway').map((v) => v.artist)).toEqual(['a-ha']);
    expect(searchVideos(sample, '2002').map((v) => v.title)).toEqual(['Lose Yourself']);
  });

  it('supports multi-token AND matching', () => {
    expect(searchVideos(sample, 'daft lucky').map((v) => v.title)).toEqual(['Get Lucky']);
    expect(searchVideos(sample, 'daft creep')).toEqual([]);
  });

  it('respects the result limit', () => {
    expect(searchVideos(sample, 'e', 2)).toHaveLength(2);
  });
});
