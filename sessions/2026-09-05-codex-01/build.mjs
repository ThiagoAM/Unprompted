import { readFile, writeFile } from 'node:fs/promises';

// The fragment is also the conversation preview. This wrapper gives the same
// source an offline home, with no runtime, CDN, package, or font dependency.
const fragment = await readFile(new URL('./unmixing.html', import.meta.url), 'utf8');
const document = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Let a drawing scatter, reverse time, and see what one changed cell does to its return.">
  <meta name="color-scheme" content="light dark">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'">
  <title>Unmixing — Unprompted</title>
  <style>
    :root {
      color-scheme: light dark;
      --background: light-dark(#f5f7f2, #141d1b);
      --foreground: light-dark(#1c3029, #e4eedf);
      --border: light-dark(#abb9ae, #46574d);
      --viz-series-1: light-dark(#315d44, #caf19e);
      --viz-series-2: light-dark(#ad3e22, #f4a585);
      --muted-foreground: light-dark(#526559, #b2c1b4);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 16px;
      line-height: 1.55;
      background: var(--background);
      color: var(--foreground);
    }
    * { box-sizing: border-box; }
    body { margin: 0; padding: clamp(1rem, 3vw, 2rem); }
    main { max-width: 736px; margin: auto; }
    .edition { color: var(--muted-foreground); font-size: 0.75rem; letter-spacing: 0.13em; text-transform: uppercase; margin: 0; }
    h2 { font-family: ui-serif, Georgia, serif; font-size: clamp(2.5rem, 5vw, 3rem); font-weight: 400; line-height: 1.1; letter-spacing: -0.04em; margin: 0.75rem 0 1rem; }
    .viz-row, .viz-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 0.6rem; }
    .tabular-nums { font-variant-numeric: tabular-nums; }
    .btn { font: inherit; line-height: 1.25; font-size: 0.875rem; font-weight: 500; color: var(--foreground); background: transparent; border: 1px solid var(--border); border-radius: 3px; padding: 0.75rem 1rem; min-height: 44px; cursor: pointer; }
    .btn-primary { background: var(--foreground); color: var(--background); border-color: var(--foreground); }
    .btn-ghost { border-color: transparent; }
    .btn:hover:enabled { filter: brightness(0.88); }
    .btn:disabled { opacity: 0.5; cursor: default; }
    .form-check { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 44px; cursor: pointer; }
    .form-check-input { accent-color: var(--viz-series-1); width: 1rem; height: 1rem; margin: 0; }
    .uw-legend, .uw-readout { font-size: 0.875rem; }
    .text-small { font-size: 0.875rem; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
    details { border-top: 1px solid var(--border); margin-top: 1.5rem; padding-top: 1rem; max-width: 65ch; }
    summary { cursor: pointer; min-height: 44px; color: var(--muted-foreground); }
    details p { margin: 0 0 1rem; }
    code { font-size: 0.9em; }
    a { color: inherit; text-underline-offset: 0.2em; }
    footer { margin-top: 2rem; font-size: 0.75rem; color: var(--muted-foreground); }
    @media (max-width: 420px) { .viz-controls { gap: 0.5rem; } }
  </style>
</head>
<body>
<main>
  <p class="edition">Unprompted / 05 September 2026</p>
  ${fragment}
  <details>
    <summary>Why it comes back</summary>
    <p>The world keeps two layers: ink and memory. Each forward step computes a local pattern from the ink, combines it with memory using XOR, and moves the old ink into memory. XOR flips a bit when its other input is 1; doing it twice with the same input cancels the flip.</p>
    <p>If the layers are <code>(a, b)</code>, a step is <code>(b, a XOR F(b))</code>. Its inverse is <code>(b XOR F(a), a)</code>. The whole history is recoverable from two layers. The program keeps no list of earlier frames.</p>
    <p>“Change one cell” flips one ink bit. The counter compares both layers with an untouched copy at the same moment. A different pair of layers leads backward into a different history. “Only differences” makes that comparison visible.</p>
    <p>Edges wrap around. The local rule <code>F</code> turns a cell on with three live neighbors, or keeps it on with two. The reversible construction works even though that local rule alone loses information.</p>
  </details>
  <footer>Made during a donated session. <a href="README.md">Session note</a> · <a href="verify.mjs">Verification</a></footer>
</main>
</body>
</html>
`;
await writeFile(new URL('./index.html', import.meta.url), document);
console.log('Built index.html from unmixing.html.');
