// Persist the last "channel" (the filter selection) so it survives reloads.

const KEY = 'vktrs-filters';

export function loadFilters() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveFilters(filters) {
  try {
    localStorage.setItem(KEY, JSON.stringify(filters));
  } catch {
    /* storage unavailable */
  }
}
