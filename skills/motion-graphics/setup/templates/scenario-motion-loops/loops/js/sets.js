// The two packs. Order of pages = order of the carousel. `first` = number of the first tile on the page.
// tone: dark (card bg, accent motif) | accent (accent bg, ink motif) | light (paper bg, ink motif)
(function () {
  const TONES = ['dark', 'accent', 'light', 'dark', 'dark', 'accent', 'light', 'dark'];
  const page = (name, accent, first, ids, tones = TONES) => ({
    name, accent, first,
    tiles: ids.map((id, i) => ({ id, tone: tones[i] })),
  });

  window.SETS = {
    bg: {
      title: ['40 Motion Backgrounds', 'for AI video'],
      cta: 'LOOPS',
      pages: [
        page('Depth', '#5CC8FF', 1, [
          'bg.perspective-floor', 'bg.grid-tunnel', 'bg.wave-mesh', 'bg.dot-tunnel',
          'bg.infinite-zoom', 'bg.warp-stars', 'bg.iso-cubes', 'bg.tilted-rings',
        ]),
        page('Lines', '#FF5A1F', 9, [
          'bg.speed-lines', 'bg.sine-stack', 'bg.line-burst', 'bg.flow-lines',
          'bg.stripe-twist', 'bg.moire', 'bg.scan-bars', 'bg.contours',
        ]),
        page('Dots', '#FF6FA8', 17, [
          'bg.halftone-wave', 'bg.halftone-bloom', 'bg.dot-ripple', 'bg.phyllotaxis',
          'bg.polka-drift', 'bg.dot-sweep', 'bg.pixel-rain', 'bg.orbit-dots',
        ]),
        page('Shapes', '#A99BFF', 25, [
          'bg.bauhaus-grid', 'bg.truchet-flow', 'bg.circle-pop', 'bg.floating-shapes',
          'bg.kaleidoscope', 'bg.shape-tunnel', 'bg.confetti-fall', 'bg.pinwheels',
        ]),
        page('Minimal', '#FFB800', 33, [
          'bg.breathing-circle', 'bg.split-panels', 'bg.arc-rotation', 'bg.sliding-stripes',
          'bg.nested-squares', 'bg.soft-orbs', 'bg.single-wave', 'bg.quarter-turns',
        ]),
      ],
    },
    sh: {
      title: ['40 Shape Animations', 'for AI video'],
      cta: 'SHAPES',
      pages: [
        page('Morph', '#D4FF3A', 1, [
          'sh.circle-to-square', 'sh.shape-cycle', 'sh.blob-morph', 'sh.split-merge',
          'sh.paper-fold', 'sh.star-morph', 'sh.corner-twist', 'sh.flip-tiles',
        ]),
        page('Bounce', '#FF5A1F', 9, [
          'sh.bounce-drop', 'sh.squash-stretch', 'sh.elastic-pop', 'sh.pendulum',
          'sh.jelly-wobble', 'sh.spin-snap', 'sh.slide-through', 'sh.heartbeat',
        ]),
        page('Burst', '#FF6FA8', 17, [
          'sh.confetti-burst', 'sh.shape-explosion', 'sh.firework', 'sh.bubble-pop',
          'sh.shockwave', 'sh.radial-fan', 'sh.particle-orbit', 'sh.spiral-out',
        ]),
        page('Rhythm', '#5CC8FF', 25, [
          'sh.domino-fall', 'sh.wave-dots', 'sh.grid-cascade', 'sh.equalizer',
          'sh.shape-parade', 'sh.stack-up', 'sh.stair-hop', 'sh.loader-dots',
        ]),
        page('Draw', '#33E0A1', 33, [
          'sh.squiggle-draw', 'sh.circle-draw', 'sh.check-draw', 'sh.underline-swipe',
          'sh.arrow-draw', 'sh.spirograph', 'sh.path-follow', 'sh.infinity-draw',
        ]),
      ],
    },
  };

  window.THEMES = {};
})();
