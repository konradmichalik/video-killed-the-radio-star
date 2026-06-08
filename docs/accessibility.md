# Accessibility

- **Modal panels** (Guide, Queue, Search) are `role="dialog"` / `aria-modal`
  with a focus trap: focus moves into the panel on open, Tab cycles within it,
  and returns to the trigger on close. The rest of the app is set `inert` while a
  panel or the test card is up (hidden from tab order and screen readers); Esc
  closes a panel even from a focused control inside it.
- **Search** is a proper ARIA combobox (`role="combobox"`/`listbox`/`option`,
  `aria-activedescendant`, ↑/↓ + Enter), and the input is auto-focused on open.
- **Now playing** changes are announced via a visually-hidden
  `aria-live="polite"` region (suppressed in guess mode to avoid spoilers).
- Genre/country toggles expose `aria-pressed`; the CRT/SONG-INFO/STATION-LOGO
  switches use `role="switch"` + `aria-checked`; icon buttons have `aria-label`s.
- A visible `:focus-visible` outline is shown for keyboard users; the test card
  focuses its Reload button on appearance.
- Animations (CRT, channel static, station dot) honour `prefers-reduced-motion`.
