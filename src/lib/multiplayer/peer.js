// Thin wrapper around peerjs. Lazy-loads the lib so the initial bundle stays
// untouched for users who never enter Connected Mode. Returns control objects
// with explicit lifecycle methods so callers don't depend on peerjs types.
import { PEER_CONNECT_TIMEOUT_MS, PEER_RECONNECT_BACKOFF_MS, ICE_SERVERS } from '../constants.js';

// Shared PeerJS options. The explicit iceServers list replaces PeerJS's sparse
// default so both ends gather enough candidates to connect across devices on
// the same network, not just same-machine browser tabs over loopback.
const PEER_OPTIONS = { config: { iceServers: ICE_SERVERS } };

// Lightweight pre-flight: hit the public PeerJS broker's `/peerjs/id` endpoint
// (returns a UUID when up) so we can disable Connected Mode in the UI before
// the user wastes 8–13s on the regular connect-timeout path. Sends `cache:
// 'no-store'` because a cached 200 from yesterday would lie about today's
// availability. Returns false on any error (CORS, network, abort, !ok status,
// offline) — the only `true` answer is a successful response within the
// timeout. The `fetcher` and `url` overrides exist for testability.
const BROKER_PROBE_URL = 'https://0.peerjs.com/peerjs/id';
const BROKER_PROBE_TIMEOUT_MS = 3000;

export async function checkBrokerReachable({
  url = BROKER_PROBE_URL,
  timeoutMs = BROKER_PROBE_TIMEOUT_MS,
  fetcher = typeof fetch === 'function' ? fetch : null,
} = {}) {
  if (!fetcher) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetcher(url, { method: 'GET', signal: ctl.signal, cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

let _Peer = null;
async function loadPeer() {
  if (!_Peer) {
    const mod = await import('peerjs');
    _Peer = mod.Peer || mod.default;
  }
  return _Peer;
}

export async function hostRoom(roomId, handlers = {}) {
  const Peer = await loadPeer();
  const peer = new Peer(roomId, PEER_OPTIONS);
  const conns = new Map();

  await waitForOpen(peer);
  handlers.onBrokerStatus?.('open');

  peer.on('connection', (conn) => {
    conn.on('open', () => {
      conns.set(conn.peer, conn);
      handlers.onJoin?.(conn.peer);
    });
    conn.on('data', (raw) => handlers.onMessage?.(conn.peer, raw));
    conn.on('close', () => {
      conns.delete(conn.peer);
      handlers.onLeave?.(conn.peer);
    });
    conn.on('error', (err) => handlers.onError?.(conn.peer, err));
  });

  // The host can silently lose its socket to the broker (network blip, the TV
  // sleeping/waking, Wi-Fi roam). PeerJS keeps the local peer object alive but
  // stops registering the room id — so the QR/code stops resolving and NO new
  // phone can join, no matter how often it reloads. The host id is deterministic
  // (the room code), so re-registering the SAME id re-opens the room and lets
  // clients (which reconnect with backoff) come back. Cap the attempts so a
  // permanently-dead network surfaces 'unreachable' instead of looping forever.
  let destroyed = false;
  let brokerAttempts = 0;
  peer.on('disconnected', () => {
    if (destroyed) return;
    if (brokerAttempts >= PEER_RECONNECT_BACKOFF_MS.length) {
      handlers.onBrokerStatus?.('unreachable');
      return;
    }
    brokerAttempts++;
    handlers.onBrokerStatus?.('reconnecting');
    try {
      peer.reconnect();
    } catch {
      handlers.onBrokerStatus?.('unreachable');
    }
  });
  peer.on('open', () => {
    if (destroyed) return;
    brokerAttempts = 0;
    handlers.onBrokerStatus?.('open');
  });

  return {
    roomId,
    peerCount: () => conns.size,
    broadcast(message) {
      for (const c of conns.values()) c.send(message);
    },
    sendTo(peerId, message) {
      conns.get(peerId)?.send(message);
    },
    kick(peerId) {
      const c = conns.get(peerId);
      if (c) {
        try {
          c.close();
        } catch {
          /* ignore */
        }
      }
      conns.delete(peerId);
    },
    close() {
      destroyed = true;
      try {
        peer.destroy();
      } catch {
        /* ignore */
      }
    },
  };
}

export async function joinRoom(roomId, ownPeerId, handlers = {}) {
  const Peer = await loadPeer();
  const peer = new Peer(ownPeerId, PEER_OPTIONS);
  await waitForOpen(peer);

  let attempts = 0;
  let connectTimeout = null;
  let opened = false;

  // After the broker is open, errors arrive on the peer instance. The
  // important one is `peer-unavailable` — PeerJS emits it when the target
  // peer id doesn't exist on the broker (host hasn't opened the room yet
  // or the roomId is mistyped). Without this handler the connection sits
  // on 'connecting' indefinitely because conn.on('open') never fires.
  // onUnreachable receives a reason ('room-not-found' | 'timeout') so the
  // UI can tell "wrong/closed room" apart from "network blocks WebRTC".
  peer.on('error', (err) => {
    if (err?.type === 'peer-unavailable') {
      clearTimeout(connectTimeout);
      handlers.onUnreachable?.('room-not-found');
    } else {
      handlers.onError?.(err);
    }
  });

  function armConnectTimeout() {
    clearTimeout(connectTimeout);
    connectTimeout = setTimeout(() => {
      // Belt-and-braces fallback for the cases where PeerJS doesn't surface
      // an error (WebRTC ICE failure on strict / symmetric-NAT networks the
      // bundled STUN can't traverse). Without this the spinner stays on
      // forever; with it we surface 'unreachable' so the user can retry.
      if (!opened) handlers.onUnreachable?.('timeout');
    }, PEER_CONNECT_TIMEOUT_MS);
  }

  let conn = peer.connect(roomId, { reliable: true });
  armConnectTimeout();

  const wire = () => {
    conn.on('open', () => {
      opened = true;
      clearTimeout(connectTimeout);
      handlers.onOpen?.();
    });
    conn.on('data', (raw) => handlers.onMessage?.(raw));
    conn.on('close', () => {
      opened = false;
      handlers.onClose?.();
    });
    conn.on('error', (err) => handlers.onError?.(err));
  };
  wire();

  function reconnect() {
    if (attempts >= PEER_RECONNECT_BACKOFF_MS.length) {
      handlers.onUnreachable?.('timeout');
      return;
    }
    const delay = PEER_RECONNECT_BACKOFF_MS[attempts++];
    handlers.onReconnecting?.(attempts, delay);
    setTimeout(() => {
      conn = peer.connect(roomId, { reliable: true });
      armConnectTimeout();
      wire();
    }, delay);
  }

  peer.on('disconnected', () => reconnect());

  return {
    send(message) {
      if (conn && conn.open) conn.send(message);
    },
    close() {
      clearTimeout(connectTimeout);
      try {
        peer.destroy();
      } catch {
        /* ignore */
      }
    },
  };
}

function waitForOpen(peer) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('peer-open-timeout')), PEER_CONNECT_TIMEOUT_MS);
    peer.on('open', () => {
      clearTimeout(timer);
      resolve();
    });
    peer.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
