import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  extractYear,
  extractVideoId,
  buildColumnMap,
  rowToEntry,
  convert,
} from '../scripts/csv-to-seed.mjs';

describe('parseCsv', () => {
  it('handles quotes, commas and "" escapes', () => {
    const rows = parseCsv('a,b\n"x,y","he said ""hi"""\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['x,y', 'he said "hi"'],
    ]);
  });

  it('handles CRLF and a missing trailing newline', () => {
    expect(parseCsv('a,b\r\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('extractYear', () => {
  it('finds a year inside a date string', () => {
    expect(extractYear('1985-07-01')).toBe(1985);
    expect(extractYear('07/1999')).toBe(1999);
    expect(extractYear('n/a')).toBeNull();
  });
});

describe('extractVideoId', () => {
  it('accepts a bare id and parses common url forms', () => {
    expect(extractVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('')).toBeNull();
  });
});

describe('buildColumnMap', () => {
  it('auto-detects Exportify-style headers', () => {
    const map = buildColumnMap(['Track Name', 'Artist Name(s)', 'Album Release Date', 'Genres']);
    expect(map.title).toBe(0);
    expect(map.artist).toBe(1);
    expect(map.year).toBe(2);
    expect(map.genre).toBe(3);
  });

  it('honours explicit overrides', () => {
    const map = buildColumnMap(['c1', 'c2'], { artist: 'c2', title: 'c1' });
    expect(map).toMatchObject({ artist: 1, title: 0 });
  });
});

describe('rowToEntry', () => {
  const map = { artist: 0, title: 1, year: 2, genre: 3, country: -1, video: 4 };

  it('builds a seed entry and tidies the genre', () => {
    const e = rowToEntry(['a-ha', 'Take On Me', '1985', 'new wave', ''], map);
    expect(e).toEqual({ title: 'Take On Me', artist: 'a-ha', year: 1985, genre: 'New Wave' });
  });

  it('falls back when no genre, and skips incomplete rows', () => {
    expect(rowToEntry(['x', 'y', '1990', '', ''], map).genre).toBe('Other');
    expect(rowToEntry(['', 'y', '1990', '', ''], map)).toBeNull();
    expect(rowToEntry(['x', 'y', 'nope', '', ''], map)).toBeNull();
  });

  it('requires a video id for the videos target', () => {
    expect(rowToEntry(['x', 'y', '1990', 'Pop', ''], map, { target: 'videos' })).toBeNull();
    const e = rowToEntry(['x', 'y', '1990', 'Pop', 'https://youtu.be/dQw4w9WgXcQ'], map, {
      target: 'videos',
    });
    expect(e.video_id).toBe('dQw4w9WgXcQ');
  });
});

describe('convert', () => {
  const csv = [
    'Artist,Title,Year,Genre',
    'a-ha,Take On Me,1985,Synthpop',
    'Nirvana,Smells Like Teen Spirit,1991,Grunge',
    'a-ha,Take On Me,1985,Synthpop', // duplicate
    'Future Act,New Song,2024,Pop', // out of range
    ',No Artist,1990,Pop', // skipped (no artist)
  ].join('\n');

  it('filters by year, de-dupes, sorts and reports stats', () => {
    const { entries, stats } = convert(csv, { from: 1975, to: 2013 });
    expect(entries.map((e) => e.artist)).toEqual(['a-ha', 'Nirvana']);
    expect(entries[0].year).toBeLessThanOrEqual(entries[1].year);
    expect(stats).toMatchObject({ rows: 5, kept: 2, duplicates: 1, outOfRange: 1, skipped: 1 });
  });
});
