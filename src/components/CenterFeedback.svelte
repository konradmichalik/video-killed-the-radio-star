<script>
  import { feedback } from '../lib/stores.js';

  const ICONS = {
    play: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E\")",
    pause:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M6 5h4v14H6zM14 5h4v14h-4z'/%3E%3C/svg%3E\")",
  };

  let pulseKey = 0;
  let glyph = ICONS.play;

  $: if ($feedback.n) {
    glyph = ICONS[$feedback.icon] || ICONS.play;
    pulseKey = $feedback.n;
  }
</script>

{#key pulseKey}
  {#if pulseKey}
    <div id="center-feedback" style="--glyph: {glyph}"></div>
  {/if}
{/key}

<style>
  #center-feedback {
    position: absolute;
    inset: 0;
    z-index: 9;
    display: grid;
    place-items: center;
    pointer-events: none;
    animation: cf-pulse 0.6s ease forwards;
  }
  #center-feedback::before {
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
</style>
