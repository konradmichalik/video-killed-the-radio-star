<!-- Non-blocking nudge shown only on phone-sized screens held in portrait.
     Pure CSS: it disappears automatically when the device is rotated. -->
<div class="rotate" aria-hidden="true">
  <span>↻ Turn sideways for the full screen</span>
</div>

<style>
  .rotate {
    display: none;
  }
  @media (orientation: portrait) and (max-width: 600px) {
    .rotate {
      display: flex;
      position: absolute;
      left: 50%;
      bottom: calc(14px + env(safe-area-inset-bottom, 0px));
      transform: translateX(-50%);
      z-index: 13;
      pointer-events: none;
      padding: 7px 14px;
      background: rgba(0, 0, 0, 0.62);
      border: 1px solid rgba(255, 255, 255, 0.25);
      font-family: 'VT323', monospace;
      font-size: 16px;
      letter-spacing: 1px;
      color: var(--bug-yellow);
      white-space: nowrap;
    }
  }
</style>
