import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { loadError } from '../src/lib/stores.js';
import { armInitWatchdog } from '../src/lib/player.js';

describe('init watchdog', () => {
  beforeEach(() => {
    loadError.set(null);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    loadError.set(null);
  });

  it('does nothing before the timeout', () => {
    armInitWatchdog(1000);
    vi.advanceTimersByTime(500);
    expect(get(loadError)).toBeNull();
  });

  it('surfaces an error if playback never starts', () => {
    armInitWatchdog(1000);
    vi.advanceTimersByTime(1100);
    expect(get(loadError)).toBeTruthy();
  });
});
