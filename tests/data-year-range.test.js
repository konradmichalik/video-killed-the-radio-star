import { describe, it, expect } from 'vitest';
import { yearRange } from '../src/lib/data.js';

describe('yearRange', () => {
  it('returns dynamic range from videos', () => {
    expect(yearRange([{ year: 1985 }, { year: 1990 }, { year: 1970 }])).toEqual({
      min: 1970,
      max: 1990,
    });
  });
  it('falls back when empty', () => {
    const r = yearRange([]);
    expect(r.min).toBe(1900);
    expect(typeof r.max).toBe('number');
  });
  it('ignores non-numeric years', () => {
    expect(
      yearRange([{ year: 1985 }, { year: null }, { year: 'oops' }, { year: 1990 }]),
    ).toEqual({ min: 1985, max: 1990 });
  });
});
