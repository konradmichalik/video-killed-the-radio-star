import { describe, it, expect, vi } from 'vitest';
import { checkBrokerReachable, joinRoom } from '../../src/lib/multiplayer/peer.js';
import { PEER_CONNECT_TIMEOUT_MS } from '../../src/lib/constants.js';

// Minimal in-memory stand-in for the peerjs Peer class. Emits 'open' on a
// microtask so waitForOpen resolves after handlers are registered, exactly
// like the real broker handshake (just faster).
const { FakePeer } = vi.hoisted(() => {
  class FakeConn {
    constructor() {
      this.handlers = {};
      this.open = false;
    }
    on(ev, fn) {
      this.handlers[ev] = fn;
    }
    emit(ev, ...args) {
      this.handlers[ev]?.(...args);
    }
  }
  class FakePeer {
    static instances = [];
    constructor(id) {
      FakePeer.instances.push(this);
      this.id = id;
      this.handlers = {};
      this.connections = [];
      queueMicrotask(() => this.emit('open'));
    }
    on(ev, fn) {
      (this.handlers[ev] ??= []).push(fn);
    }
    emit(ev, ...args) {
      for (const fn of this.handlers[ev] || []) fn(...args);
    }
    connect() {
      const conn = new FakeConn();
      this.connections.push(conn);
      return conn;
    }
    destroy() {}
  }
  return { FakePeer };
});

vi.mock('peerjs', () => ({ Peer: FakePeer }));

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

describe('joinRoom unreachable reasons', () => {
  it("reports 'room-not-found' when the broker says the room id does not exist", async () => {
    const onUnreachable = vi.fn();
    const client = await joinRoom('VKTRS-ABCD', 'VKTRS-PEER-a', { onUnreachable });
    const peer = FakePeer.instances.at(-1);
    peer.emit('error', { type: 'peer-unavailable' });
    expect(onUnreachable).toHaveBeenCalledWith('room-not-found');
    client.close();
  });

  it("reports 'timeout' when the connection never opens", async () => {
    vi.useFakeTimers();
    try {
      const onUnreachable = vi.fn();
      const client = await joinRoom('VKTRS-ABCD', 'VKTRS-PEER-b', { onUnreachable });
      vi.advanceTimersByTime(PEER_CONNECT_TIMEOUT_MS);
      expect(onUnreachable).toHaveBeenCalledWith('timeout');
      client.close();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports nothing when the connection opens in time', async () => {
    vi.useFakeTimers();
    try {
      const onUnreachable = vi.fn();
      const onOpen = vi.fn();
      const client = await joinRoom('VKTRS-ABCD', 'VKTRS-PEER-c', { onUnreachable, onOpen });
      const peer = FakePeer.instances.at(-1);
      peer.connections.at(-1).emit('open');
      vi.advanceTimersByTime(PEER_CONNECT_TIMEOUT_MS);
      expect(onOpen).toHaveBeenCalled();
      expect(onUnreachable).not.toHaveBeenCalled();
      client.close();
    } finally {
      vi.useRealTimers();
    }
  });
});
