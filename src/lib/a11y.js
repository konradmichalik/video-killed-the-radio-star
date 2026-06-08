// Small accessibility helpers as Svelte actions.

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focus trap for a dialog/sheet. `use:trapFocus={isOpen}`.
 * When open: remembers the previously focused element, moves focus into the
 * node (which should have tabindex="-1"), and cycles Tab within it.
 * When closed: restores focus to where it was.
 */
export function trapFocus(node, enabled) {
  let previous = null;

  const visibleFocusables = () =>
    Array.from(node.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);

  function onKey(e) {
    if (e.key !== 'Tab') return;
    const f = visibleFocusables();
    if (!f.length) {
      e.preventDefault();
      node.focus();
      return;
    }
    const first = f[0];
    const last = f[f.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === node)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function activate() {
    previous = document.activeElement;
    node.addEventListener('keydown', onKey);
    const target = node.querySelector('[data-autofocus]') || node;
    requestAnimationFrame(() => target.focus());
  }

  function deactivate() {
    node.removeEventListener('keydown', onKey);
    const prev = previous;
    previous = null;
    if (prev && typeof prev.focus === 'function') prev.focus();
  }

  if (enabled) activate();

  return {
    update(now) {
      if (now && !previous) activate();
      else if (!now && previous) deactivate();
    },
    destroy() {
      node.removeEventListener('keydown', onKey);
      const prev = previous;
      previous = null;
      if (prev && typeof prev.focus === 'function') prev.focus();
    },
  };
}

/** Move focus to the node once it mounts. `use:focusOnMount`. */
export function focusOnMount(node) {
  requestAnimationFrame(() => node.focus && node.focus());
}
