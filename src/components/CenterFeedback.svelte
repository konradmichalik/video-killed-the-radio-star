<script>
  import { feedback } from '../lib/stores.js';

  const ICONS = {
    play: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E\")",
    pause:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M6 5h4v14H6zM14 5h4v14h-4z'/%3E%3C/svg%3E\")",
    'fav-on':
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffe600'%3E%3Cpath d='M12 2l2.9 6.9 7.5.6-5.7 4.9 1.8 7.4L12 17.8 5.5 21.8l1.8-7.4L1.6 9.5l7.5-.6z'/%3E%3C/svg%3E\")",
    'fav-off':
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpath d='M12 2l2.9 6.9 7.5.6-5.7 4.9 1.8 7.4L12 17.8 5.5 21.8l1.8-7.4L1.6 9.5l7.5-.6z'/%3E%3C/svg%3E\")",
  };

  let pulseKey = 0;
  let glyph = ICONS.play;
  let icon = 'play';

  $: if ($feedback.n) {
    icon = $feedback.icon;
    glyph = ICONS[$feedback.icon] || ICONS.play;
    pulseKey = $feedback.n;
  }

  $: isFav = icon === 'fav-on' || icon === 'fav-off';
</script>

{#key pulseKey}
  {#if pulseKey}
    <div
      id="center-feedback"
      class:fav={isFav}
      class:fav-on={icon === 'fav-on'}
      class:fav-off={icon === 'fav-off'}
      style="--glyph: {glyph}"
    >
      {#if isFav}
        <div class="cf-fav-box">
          <div class="cf-fav-glyph"></div>
        </div>
      {/if}
    </div>
  {/if}
{/key}

<style>
  /* Default container — play/pause keep their soft circle pulse so the
     gesture confirmation stays subtle. Only the favourite reveal escalates
     to the full neo-brutalist frame + glitch treatment. */
  #center-feedback {
    position: absolute;
    inset: 0;
    z-index: 9;
    display: grid;
    place-items: center;
    pointer-events: none;
  }
  #center-feedback:not(.fav) {
    animation: cf-pulse 0.6s ease forwards;
  }
  #center-feedback:not(.fav)::before {
    content: '';
    width: clamp(80px, 18vw, 150px);
    height: clamp(80px, 18vw, 150px);
    background:
      var(--glyph) center / 45% no-repeat,
      rgba(0, 0, 0, 0.55);
    border-radius: 50%;
    backdrop-filter: blur(2px);
  }
  @keyframes cf-pulse {
    0% {
      opacity: 0;
      transform: scale(0.7);
    }
    30% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.25);
    }
  }

  /* Neo-brutalist favourite reveal: hard square frame with offset accent
     shadow + multi-step glitch on the inner star (position jitter, RGB
     drop-shadow split, clip-path tears). fav-on gets a cyan shadow (the
     celebratory accent-2), fav-off gets pink (the accent — "removed"). */
  .cf-fav-box {
    width: clamp(120px, 22vw, 180px);
    height: clamp(120px, 22vw, 180px);
    background: #050505;
    border: 4px solid #ffffff;
    box-shadow: 8px 8px 0 var(--accent-2);
    display: grid;
    place-items: center;
    animation: cf-fav-frame 0.95s steps(6, end) forwards;
  }
  #center-feedback.fav-off .cf-fav-box {
    box-shadow: 8px 8px 0 var(--accent);
  }
  .cf-fav-glyph {
    width: clamp(70px, 14vw, 110px);
    height: clamp(70px, 14vw, 110px);
    background: var(--glyph) center / contain no-repeat;
    animation: cf-fav-glitch 0.7s steps(1, end) forwards;
  }

  /* Frame: pops in with a tiny over-shoot, holds the brutalist shape, then
     fades out. Stepped easing keeps it discrete (no buttery interpolation). */
  @keyframes cf-fav-frame {
    0% {
      opacity: 0;
      transform: translate(-6px, 4px) scale(0.84);
    }
    18% {
      opacity: 1;
      transform: translate(0, 0) scale(1.06);
    }
    30% {
      transform: translate(2px, -1px) scale(0.98);
    }
    44%,
    78% {
      transform: translate(0, 0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(0, 0) scale(1);
    }
  }

  /* Glyph: discrete-frame VHS-tracking glitch — pos jitter + RGB drop-shadow
     split + clip-path horizontal tears, then settles clean for the hold. */
  @keyframes cf-fav-glitch {
    0% {
      opacity: 0;
      transform: translate(0, 0);
      filter: none;
      clip-path: inset(0 0 0 0);
    }
    8% {
      opacity: 1;
      transform: translate(-5px, 2px);
      filter: drop-shadow(5px 0 0 var(--accent)) drop-shadow(-5px 0 0 var(--accent-2));
    }
    16% {
      transform: translate(4px, -3px);
      filter: drop-shadow(-4px 0 0 var(--accent)) drop-shadow(4px 0 0 var(--accent-2));
      clip-path: inset(0 0 38% 0);
    }
    24% {
      transform: translate(0, 1px);
      filter: none;
      clip-path: inset(0 0 0 0);
    }
    34% {
      transform: translate(3px, 0);
      filter: drop-shadow(3px 0 0 var(--bug-yellow));
      clip-path: inset(34% 0 0 0);
    }
    44% {
      transform: translate(-2px, 1px);
      filter: drop-shadow(-2px 0 0 var(--accent)) drop-shadow(2px 0 0 var(--accent-2));
      clip-path: inset(0 0 0 0);
    }
    56% {
      transform: translate(1px, 0);
      filter: none;
    }
    100% {
      opacity: 1;
      transform: translate(0, 0);
      filter: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cf-fav-box,
    .cf-fav-glyph {
      animation: none;
    }
    .cf-fav-glyph {
      opacity: 1;
    }
  }
</style>
