// Request real fullscreen for the whole app. Must be called from a user
// gesture (the "TURN ON TV" tap). Best-effort: swallows errors and no-ops
// where unsupported (e.g. iPhone Safari only allows native video fullscreen).

export function requestAppFullscreen() {
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if (typeof fn !== 'function') return;
  try {
    const result = fn.call(el);
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch {
    /* not allowed — ignore */
  }
}
