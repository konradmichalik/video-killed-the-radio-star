// Screen Wake Lock — stop the iPad/phone from dimming while the channel plays.
// Best-effort: silently does nothing where unsupported (needs HTTPS + Safari 16.4+).

let sentinel = null;
let wired = false;

async function acquire() {
  if (!('wakeLock' in navigator)) return;
  if (sentinel && !sentinel.released) return; // already holding one
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener?.('release', () => {
      sentinel = null;
    });
  } catch {
    sentinel = null; /* denied / not allowed right now — ignore */
  }
}

export function enableWakeLock() {
  acquire();
  if (wired) return;
  wired = true;
  // the lock is dropped when the tab is hidden; re-acquire when visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') acquire();
  });
}
