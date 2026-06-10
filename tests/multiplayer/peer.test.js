import { describe, it, expect, vi } from 'vitest';
import { checkBrokerReachable } from '../../src/lib/multiplayer/peer.js';

describe('checkBrokerReachable', () => {
  it('returns true when the broker responds OK', async () => {
    const fetcher = vi.fn(async () => ({ ok: true }));
    const ok = await checkBrokerReachable({ fetcher, url: 'http://example.test/probe' });
    expect(ok).toBe(true);
    expect(fetcher).toHaveBeenCalledWith(
      'http://example.test/probe',
      expect.objectContaining({ method: 'GET', cache: 'no-store' }),
    );
  });

  it('returns false on non-ok status', async () => {
    const fetcher = vi.fn(async () => ({ ok: false }));
    expect(await checkBrokerReachable({ fetcher })).toBe(false);
  });

  it('returns false when the fetch throws (network / CORS / abort)', async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(await checkBrokerReachable({ fetcher })).toBe(false);
  });

  it('aborts and returns false when the response exceeds the timeout', async () => {
    const fetcher = vi.fn(
      (_url, opts) =>
        new Promise((_resolve, reject) => {
          opts.signal.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );
    const ok = await checkBrokerReachable({ fetcher, timeoutMs: 20 });
    expect(ok).toBe(false);
  });

  it('returns false when no fetcher is available', async () => {
    expect(await checkBrokerReachable({ fetcher: null })).toBe(false);
  });
});
