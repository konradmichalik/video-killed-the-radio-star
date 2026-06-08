<div class="crt" aria-hidden="true">
  <div class="scanlines"></div>
  <div class="mask"></div>
  <div class="vignette"></div>
  <div class="glow"></div>
  <div class="scanbar"></div>
</div>

<style>
  .crt {
    position: absolute;
    inset: 0;
    z-index: 5;
    pointer-events: none;
    /* faint barrel-ish darkening at the corners, like glass curvature */
    box-shadow: inset 0 0 140px 40px rgba(0, 0, 0, 0.85);
    animation: flicker 6s infinite steps(60);
  }

  /* horizontal scanlines */
  .scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 0 2px,
      rgba(0, 0, 0, 0.22) 2px 4px
    );
    opacity: 0.7;
  }

  /* RGB phosphor / aperture-grille mask */
  .mask {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      to right,
      rgba(255, 0, 0, 0.06) 0 1px,
      rgba(0, 255, 0, 0.06) 1px 2px,
      rgba(0, 0, 255, 0.06) 2px 3px
    );
    mix-blend-mode: screen;
  }

  /* darkened edges (vignette) */
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.5) 100%);
  }

  /* soft bloom so bright areas feel like they leak light */
  .glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.05) 0%, transparent 60%);
    mix-blend-mode: overlay;
  }

  /* slowly rolling brightness bar, like an out-of-sync CRT */
  .scanbar {
    position: absolute;
    left: 0;
    right: 0;
    height: 18%;
    background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.04), transparent);
    animation: roll 9s linear infinite;
  }

  @keyframes roll {
    from {
      top: -20%;
    }
    to {
      top: 120%;
    }
  }

  @keyframes flicker {
    0%,
    96%,
    100% {
      opacity: 1;
    }
    97% {
      opacity: 0.92;
    }
    98% {
      opacity: 0.97;
    }
    99% {
      opacity: 0.9;
    }
  }

  /* respect reduced-motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .crt {
      animation: none;
    }
    .scanbar {
      display: none;
    }
  }
</style>
