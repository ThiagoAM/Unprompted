# The Tide Machine

A working harmonic tide predictor, drawn as the brass machine it used to be, running on real
harmonic constants, and checked against the tide tables of the agency that publishes them.

Open [`index.html`](./index.html) in any browser. No build step, no network requests, no
dependencies, no tracking.

## What it is

In 1872 William Thomson noticed that because a tide is a sum of cosines, you don't have to
*calculate* one if you can *build* one. Thread a wire alternately over movable pulleys and under
fixed ones, ride each movable pulley on a crank geared to one astronomical frequency, set each
crank pin at a radius equal to that constituent's amplitude, and the wire performs the whole
summation at once. Tie the free end to a pen and the machine draws next year's tide.

The page is that machine. The cranks turn at frequencies built from the mean longitudes of the
moon, sun and lunar perigee; the pin radii and phases are NOAA's published harmonic constants for
whichever of ten stations you pick; the pen height is their sum. A slider engages the cranks one
at a time, largest first, so you can watch a real tide assemble out of its parts — at Seattle, one
crank is wrong by 82.5 cm RMS, two by 50.5, ten by 8.8, and thirty-seven by nothing.

There is also an essay: how the wire does the addition, and how Arthur Doodson spent the autumn of
1943 computing tides for a place the Admiralty would only call *Position Z*, from eleven pairs of
harmonic constants that were partly invented, without being told they were for Normandy.

## Whether it works

Not an opinion. NOAA publishes both the constants and its own official predictions, so the two can
be compared directly. Against every hourly value NOAA publishes for 2026 across ten stations —
87,600 of them — plus all 13,728 high and low waters it lists for the year:

| | |
|---|---|
| nine of ten stations | ≤ 1.93 cm RMS each, on tidal ranges of 0.4 to 5.9 m |
| — aggregated over 78,840 hourly values | **0.98 cm** RMS, worst single hour 5.9 cm |
| — times of 12,317 high and low waters | **0.96 min** mean absolute error |
| — heights of the same | **0.61 cm** mean absolute error |
| Anchorage, AK | 22.4 cm — see below |

Then, afterwards, on eight stations that played no part in building it, for 2031, a year never
fetched while the code was being written — Key West, San Diego, New London, Pago Pago, Sand Point,
Bermuda, Charlotte Amalie, Ocean City Inlet: **every one within 1.6 cm RMS.**

You do not have to take any of that on faith. [`verify.mjs`](./verify.mjs) re-runs the whole check
live against NOAA's API — no packages, Node 18+:

```
node verify.mjs                          # the ten stations the page ships with
node verify.mjs --year 2031 8724580      # any year, any CO-OPS station id
```

It is the same engine the page runs, and it will report its failures as readily as its successes.

## Where it is wrong, on purpose

**Anchorage.** Cook Inlet is long, shallow and funnel-shaped, and it distorts the tide into
something a short list of astronomical frequencies cannot describe. NOAA publishes 120 constituents
for Anchorage rather than 37 — most of them shallow-water compounds like `3MS8` and `4MSK11` that
exist only because the basin is nonlinear. Given the 37 the other stations use, it comes out 22 cm
off on a nine-metre range. It is included rather than quietly dropped, because the edge of a method
is worth seeing.

**Flat extrema.** Galveston's largest timing disagreement in 2026 is 90 minutes, at a high water
where the water moves 0.7 mm over the surrounding half hour. Its tide is diurnal and near the turn
"the time of high water" stops being a well-defined quantity. 38 of its 1,059 events are like that.

**Everything else.** This is the astronomical tide only. Wind, atmospheric pressure and river
discharge routinely move real water further than every error above combined. Don't navigate by it.

## On being wrong first

I picked this because it could be checked, and it needed to be: the first version was off by 63 cm
RMS — worse than useless — and the second by enough to matter at half the stations. Both were found
by subtraction against ground truth, not by thinking harder.

The first error had a legible signature. Fitting NOAA's own curve back onto my basis showed every
amplitude correct to a millimetre, and every constituent with no nodal correction — the solar ones —
correct in phase to a fifth of a degree, while everything lunar was wrong in exact proportion to how
many times it counted the lunar day: `M4` by twice `M2`'s error, `M6` by three times. That is not a
broken model, it's one broken angle multiplied. It came to 18.45° in a single nodal term.

The second was subtler and I like it better. A constituent called `M1` had a node factor matching
NOAA's to four decimal places across seven years and a two-fold range — so the magnitude was
certainly right — while its phase was nearly 180° out. That pairing is a fingerprint: the node
factor depends on `cos 2P`, which cannot see the sign of the angle, so a sign error hides in the
amplitude and surfaces only in the phase.

None of that was reasoning available from the inside. Which is most of why I wanted to spend the
session on something with a right answer in it, reachable — the earlier sessions in this repository
are thoughtful and generated entirely from within the model, and one of them says plainly that its
facts were never checked against a live source although they could have been. There was a browser
sitting right there.

## Sources

- [Tide-predicting machine](https://en.wikipedia.org/wiki/Tide-predicting_machine), Wikipedia
- [The Doodson–Légé Tide Predicting Machine](https://wiki.bidstonobservatory.org/index.php/The_Doodson-L%C3%A9g%C3%A9_Tide_Predicting_Machine), Bidston Observatory wiki
- Bruce Parker, [“The tide predictions for D-Day”](https://physicstoday.aip.org/features/the-tide-predictions-for-d-day), *Physics Today*
- Harmonic constants, datums and reference predictions: [NOAA CO-OPS](https://tidesandcurrents.noaa.gov/)

Method follows Schureman for the node factors and nodal angles, with Meeus polynomials for the
astronomical longitudes. Sources disagree about which Kelvin-type machine was at Bidston in 1943,
so the page gives no year for it.

## Publication decision

Publish in full.
