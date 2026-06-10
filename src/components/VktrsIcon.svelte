<!-- src/components/VktrsIcon.svelte -->
<!--
  The canonical VKTRS station mark. Inline SVG so the icon has a transparent
  background (the station-bug variant sits over the YouTube video), scales
  crisply, and recolours via CSS variables. Geometry mirrors
  public/vktrs-icon.svg — edit there in a vector editor and paste the
  resulting <path> + transform back into here when iterating on the V.
-->
<script>
  export let size = 56; // square px (the SVG is intrinsically 64×64; CSS scales)
  export let title = 'VKTRS';
</script>

<svg
  viewBox="0 0 64 64"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={title}
  width={size}
  height={size}
  class="vktrs-icon"
>
  <!-- Offset shadow square (cyan / accent-2) -->
  <rect class="shadow" x="14" y="14" width="46" height="46" />
  <!-- Body square: black fill, white border -->
  <rect class="body" x="6" y="6" width="46" height="46" />
  <!-- V glyph — path traced from a proper Impact-like V so strokes keep
       near-uniform width along their length and the bottom is a flat
       inner notch instead of a linear taper to a single point. -->
  <g transform="translate(6 3)">
    <path
      class="glyph"
      d="M10.609,14.453L18.109,14.453L23.43,33.297L28.867,14.453L36.039,14.453L26.828,40L19.773,40L10.609,14.453Z"
    />
  </g>
  <!-- On-air dot (accent / pink) -->
  <circle class="dot" cx="44" cy="18" r="3.5" />
</svg>

<style>
  .vktrs-icon {
    display: inline-block;
    flex: 0 0 auto;
  }
  .shadow {
    fill: var(--accent-2);
  }
  .body {
    fill: #050505;
    stroke: #ffffff;
    stroke-width: 4;
  }
  .glyph {
    fill: #ffffff;
    fill-rule: nonzero;
  }
  .dot {
    fill: var(--accent);
  }
</style>
