# Unmixing

I wanted to make something that could come back.

Open [index.html](./index.html), press **Scatter**, and let the word HERE
become a field of noise. Press **Reverse**. Every cell returns to its starting
state. Then try again, but **Change one cell** before reversing.

The distinction that interested me was between losing a recognizable shape
and losing the information that made it. The shape disappears just by waiting;
the information survives in the pair of grids. A single intervention then
changes which history reversal reconstructs.

There is no recording of earlier frames. The state is a pair of bit grids,
called memory and ink. With a local rule `F`, a forward step is

```text
(a, b) → (b, a XOR F(b))
```

and its inverse is

```text
(a, b) → (b XOR F(a), a).
```

Substitution proves the claim: `a XOR F(b) XOR F(b)` is `a`.
The construction works for any deterministic `F`. Here `F` is the binary
eight-neighbor rule B3/S23: three live neighbors turn a cell on; two preserve
an already live cell. Edges wrap. The grid is 176 × 112; the initial memory
layer is zero.

Ink is bright, memory without ink is faint, and differences get a second color. The counter
counts spatial cells that differ in **either layer** from an untouched world
evolving alongside the visible one. This matters: a change can disappear from
the ink for a moment while remaining in memory. The comparison world is also
evolved by the rule, with no saved timeline.

There is a small precision to the intervention. Flipping a known bit is itself
invertible; the program could undo that flip if instructed. The Reverse button
only reverses the world's evolution. It deliberately leaves the intervention
in place. Nothing here establishes that information has been fundamentally
destroyed.

## Verification

The verifier reads the engine directly out of the visual's source. It checks:

- The local rule against a separate, simple implementation, including wrapped
  edges and rectangular grids.
- Both inverse compositions on all **262,144** possible two-layer states of
  a 3 × 3 grid.
- Random sequences of direction changes followed by their inverses.
- The actual drawing, forward 240 moments and back, in both layers.
- A one-bit intervention, memory-only differences, and input bounds.
- The standalone page contains the exact same fragment and no remote assets.

```sh
node verify.mjs
```

For the shipped drawing, flipping the center ink bit at moment 240 and
reversing leaves **13,548 of 19,712 cells** different at moment zero. Without
the intervention, the difference is exactly zero. That number belongs to
this drawing, rule, intervention, and duration; it is not a universal rate.

## Files

- `unmixing.html` is the editable fragment and the inline conversation version.
- `index.html` is the same piece with an offline wrapper and a short explanation.
- `build.mjs` regenerates the standalone page with `node build.mjs`.
- `verify.mjs` checks the engine and the generated page, using only Node's
  standard library.

The page needs no build step to open, no network connection, and no packages.
Animation starts only on request, stops at the ends, and pauses when hidden.
With reduced motion enabled, the primary control advances one moment per click.
Browser checks covered an untouched round trip, the one-bit intervention,
the difference-only view, light and dark layouts at 736px and 360px, and a
simulated reduced-motion preference.

## Publication decision

Publish in full. The contribution is left in this session folder; no remote
publication was performed during the session.
