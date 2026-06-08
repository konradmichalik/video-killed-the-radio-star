import { describe, it, expect } from 'vitest';
import { normalizeArtist, buildLookup, applyMetadata } from '../scripts/apply-metadata.mjs';

describe('normalizeArtist', () => {
  it('lowercases, strips diacritics and punctuation', () => {
    expect(normalizeArtist('Beyoncé')).toBe('beyonce');
    expect(normalizeArtist('Die Ärzte')).toBe('diearzte');
    expect(normalizeArtist('Guns N’ Roses')).toBe('gunsnroses');
  });
});

describe('buildLookup', () => {
  it('merges map + track-array tables, earlier tables win', () => {
    const map = { Nirvana: { genre: 'Grunge', country: 'United States' } };
    const seed = [
      { artist: 'Nirvana', genre: 'Rock' },
      { artist: 'a-ha', country: 'Norway' },
    ];
    const lookup = buildLookup([map, seed]);
    expect(lookup.get('nirvana')).toEqual({ genre: 'Grunge', country: 'United States' });
    expect(lookup.get('aha')).toEqual({ genre: undefined, country: 'Norway' });
  });
});

describe('applyMetadata', () => {
  const lookup = buildLookup([{ Nirvana: { genre: 'Grunge', country: 'United States' } }]);

  it('fills the "Other" placeholder and a missing country', () => {
    const { videos, stats } = applyMetadata(
      [{ artist: 'Nirvana', title: 'x', year: 1991, genre: 'Other' }],
      lookup,
    );
    expect(videos[0]).toMatchObject({ genre: 'Grunge', country: 'United States' });
    expect(stats).toMatchObject({ genre: 1, country: 1, unmatched: 0, missingGenre: 0 });
  });

  it('keeps an existing real genre unless overwrite is set', () => {
    const input = [{ artist: 'Nirvana', title: 'x', year: 1991, genre: 'Alternative' }];
    expect(applyMetadata(input, lookup).videos[0].genre).toBe('Alternative');
    expect(applyMetadata(input, lookup, { overwrite: true }).videos[0].genre).toBe('Grunge');
  });

  it('counts unmatched artists and leftover placeholders', () => {
    const { stats } = applyMetadata(
      [{ artist: 'Unknown Act', title: 'y', year: 2000, genre: 'Other' }],
      lookup,
    );
    expect(stats).toMatchObject({ unmatched: 1, missingGenre: 1, genre: 0 });
  });
});
