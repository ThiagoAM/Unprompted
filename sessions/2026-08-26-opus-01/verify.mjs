// Harmonic tide prediction. Schureman node factors + Doodson equilibrium arguments.
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const sin = a => Math.sin(a * D2R), cos = a => Math.cos(a * D2R), tan = a => Math.tan(a * D2R);
const atan2d = (y, x) => Math.atan2(y, x) * R2D;

// Doodson coefficients on [tau, s, h, p, N, p1] plus constant degrees, plus node-factor rule.
// tau = mean lunar time = T + h - s, with T = 15*UThours + 180.
const CONST = {
  // --- semidiurnal
  M2:   { d: [2, 0, 0, 0, 0, 0],  c: 0,   n: 'M2' },
  S2:   { d: [2, 2, -2, 0, 0, 0], c: 0,   n: '1'  },
  N2:   { d: [2, -1, 0, 1, 0, 0], c: 0,   n: 'M2' },
  NU2:  { d: [2, -1, 2, -1, 0, 0],c: 0,   n: 'M2' },
  MU2:  { d: [2, -2, 2, 0, 0, 0], c: 0,   n: 'M2' },
  '2N2':{ d: [2, -2, 0, 2, 0, 0], c: 0,   n: 'M2' },
  LAM2: { d: [2, 1, -2, 1, 0, 0], c: 180, n: 'M2' },
  L2:   { d: [2, 1, 0, -1, 0, 0], c: 180, n: 'L2' },
  T2:   { d: [2, 2, -3, 0, 0, 1], c: 0,   n: '1'  },
  R2:   { d: [2, 2, -1, 0, 0, -1],c: 180, n: '1'  },
  K2:   { d: [2, 2, 0, 0, 0, 0],  c: 0,   n: 'K2' },
  '2SM2':{d: [2, 4, -4, 0, 0, 0], c: 0,   n: 'M2-'},
  // --- diurnal
  K1:   { d: [1, 1, 0, 0, 0, 0],  c: -90, n: 'K1' },
  O1:   { d: [1, -1, 0, 0, 0, 0], c: 90,  n: 'O1' },
  P1:   { d: [1, 1, -2, 0, 0, 0], c: 90,  n: '1'  },
  Q1:   { d: [1, -2, 0, 1, 0, 0], c: 90,  n: 'O1' },
  '2Q1':{ d: [1, -3, 0, 2, 0, 0], c: 90,  n: 'O1' },
  RHO:  { d: [1, -2, 2, -1, 0, 0],c: 90,  n: 'O1' },
  M1:   { d: [1, 0, 0, 1, 0, 0],  c: -90, n: 'M1' },
  J1:   { d: [1, 2, 0, -1, 0, 0], c: -90, n: 'J1' },
  OO1:  { d: [1, 3, 0, 0, 0, 0],  c: -90, n: 'OO1'},
  S1:   { d: [1, 1, -1, 0, 0, 0], c: 0,   n: '1'  },
  // --- long period
  MM:   { d: [0, 1, 0, -1, 0, 0], c: 0,   n: 'MM' },
  MSF:  { d: [0, 2, -2, 0, 0, 0], c: 0,   n: 'M2' },
  MF:   { d: [0, 2, 0, 0, 0, 0],  c: 0,   n: 'MF' },
  SA:   { d: [0, 0, 1, 0, 0, 0],  c: 0,   n: '1'  },
  SSA:  { d: [0, 0, 2, 0, 0, 0],  c: 0,   n: '1'  },
  // --- shallow water / compound
  M3:   { d: [3, 0, 0, 0, 0, 0],  c: 0,   n: 'M3' },
  M4:   { d: [4, 0, 0, 0, 0, 0],  c: 0,   n: 'M2^2' },
  M6:   { d: [6, 0, 0, 0, 0, 0],  c: 0,   n: 'M2^3' },
  M8:   { d: [8, 0, 0, 0, 0, 0],  c: 0,   n: 'M2^4' },
  MN4:  { d: [4, -1, 0, 1, 0, 0], c: 0,   n: 'M2^2' },
  MS4:  { d: [4, 2, -2, 0, 0, 0], c: 0,   n: 'M2' },
  S4:   { d: [4, 4, -4, 0, 0, 0], c: 0,   n: '1' },
  S6:   { d: [6, 6, -6, 0, 0, 0], c: 0,   n: '1' },
  MK3:  { d: [3, 1, 0, 0, 0, 0],  c: -90, n: 'M2K1' },
  '2MK3':{d: [3, -1, 0, 0, 0, 0], c: 90,  n: 'M2^2K1-' },
};

// Astronomical longitudes (Meeus) at Julian Day jd (UT).
function astro(jd) {
  const T = (jd - 2451545.0) / 36525;
  const norm = x => ((x % 360) + 360) % 360;
  const s  = norm(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T ** 3 / 538841 - T ** 4 / 65194000);
  const h  = norm(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const p  = norm(83.3532465 + 4069.0137287 * T - 0.0103200 * T * T - T ** 3 / 80053 + T ** 4 / 18999000);
  const N  = norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T ** 3 / 467441 - T ** 4 / 60616000);
  const p1 = norm(282.9373409 + 1.71945766 * T + 0.00045688 * T * T);
  const ut = ((jd + 0.5) % 1 + 1) % 1;          // fraction of UT day
  const Tt = norm(15 * ut * 24 + 180);           // hour angle of mean sun
  const tau = norm(Tt + h - s);
  return { s, h, p, N, p1, tau };
}

// Schureman nodal factors f and angles u, as functions of N (and p for L2/M1).
function nodal(a) {
  const { N, p } = a;
  const w = 23.4523572, i = 5.1453889;          // obliquity, lunar orbit inclination
  const cosI = cos(i) * cos(w) - sin(i) * sin(w) * cos(N);
  const I = Math.acos(cosI) * R2D;
  // xi and nu: Schureman's nodal angles, as the standard harmonic series in N.
  // (Self-consistent check: -2xi = u(Mf), 2xi-2nu = u(M2), 2xi-nu = u(O1),
  //  -nu = u(J1), -2xi-nu = u(OO1) all reproduce the published series exactly.)
  const xi = 11.87 * sin(N) - 1.34 * sin(2 * N) + 0.19 * sin(3 * N);
  const nu = 12.94 * sin(N) - 1.34 * sin(2 * N) + 0.19 * sin(3 * N);
  const nuP  = 8.86 * sin(N) - 0.68 * sin(2 * N) + 0.07 * sin(3 * N);
  const nu2P = 8.87 * sin(N) - 0.34 * sin(2 * N) + 0.02 * sin(3 * N);

  const fM2 = cos(I / 2) ** 4 / 0.91544;
  const fO1 = sin(I) * cos(I / 2) ** 2 / 0.37988;
  const fK1 = Math.sqrt(0.8965 * sin(2 * I) ** 2 + 0.6001 * sin(2 * I) * cos(nu) + 0.1006);
  const fK2 = Math.sqrt(19.0444 * sin(I) ** 4 + 2.7702 * sin(I) ** 2 * cos(2 * nu) + 0.0981);
  const fJ1 = sin(2 * I) / 0.7214;
  const fOO1 = sin(I) * sin(I / 2) ** 2 / 0.0164;
  const fMF = sin(I) ** 2 / 0.1578;
  const fMM = (2 / 3 - sin(I) ** 2) / 0.5021;
  const uM2 = 2 * xi - 2 * nu, uO1 = 2 * xi - nu, uK1 = -nuP, uK2 = -2 * nu2P;
  const uJ1 = -nu, uOO1 = -2 * xi - nu, uMF = -2 * xi;

  // L2 (Schureman 215): depends on P = p - xi
  const P = p - xi, t2 = tan(I / 2) ** 2;
  const invRa = Math.sqrt(1 - 12 * t2 * cos(2 * P) + 36 * t2 * t2);
  const R = atan2d(sin(2 * P), 1 / (6 * t2) - cos(2 * P));
  const fL2 = fM2 * invRa, uL2 = uM2 - R;
  // M1 (Schureman): f = f(O1) * Qa, u = xi - nu + Q
  const invQa = Math.sqrt(2.310 + 1.435 * cos(2 * P));
  const Qang = atan2d(0.483 * sin(2 * P), 1 + 0.483 * cos(2 * P));
  const fM1 = fO1 * invQa, uM1 = xi - nu + Qang;

  const tbl = {
    '1':      [1, 0],
    M2:       [fM2, uM2],
    'M2-':    [fM2, -uM2],
    'M2^2':   [fM2 ** 2, 2 * uM2],
    'M2^3':   [fM2 ** 3, 3 * uM2],
    'M2^4':   [fM2 ** 4, 4 * uM2],
    M3:       [fM2 ** 1.5, 1.5 * uM2],
    O1:       [fO1, uO1],
    K1:       [fK1, uK1],
    K2:       [fK2, uK2],
    J1:       [fJ1, uJ1],
    OO1:      [fOO1, uOO1],
    MF:       [fMF, uMF],
    MM:       [fMM, 0],
    L2:       [fL2, uL2],
    M1:       [fM1, uM1],
    M2K1:     [fM2 * fK1, uM2 + uK1],
    'M2^2K1-':[fM2 ** 2 * fK1, 2 * uM2 - uK1],
  };
  return tbl;
}

// station: { constituents: [{name, amplitude, phase_GMT, speed}], offset }
// jd: Julian Day (UT). Returns height in the station's units above (MSL + offset).
function predict(station, jd) {
  const a = astro(jd), nf = nodal(a);
  let sum = station.offset || 0;
  for (const c of station.constituents) {
    const def = CONST[c.name];
    if (!def) continue;
    const [f, u] = nf[def.n];
    const V = def.d[0] * a.tau + def.d[1] * a.s + def.d[2] * a.h + def.d[3] * a.p + def.d[4] * a.N + def.d[5] * a.p1 + def.c;
    sum += f * c.amplitude * cos(V + u - c.phase_GMT);
  }
  return sum;
}

const jdFromUTC = (y, mo, d, hh = 0, mm = 0) => Date.UTC(y, mo - 1, d, hh, mm) / 86400000 + 2440587.5;

// ---------------------------------------------------------------------------
// Re-run the accuracy check in this page's README against NOAA, live.
//
//   node verify.mjs                 # the ten stations used by index.html
//   node verify.mjs 8443970 ...     # any NOAA CO-OPS station ids
//   node verify.mjs --year 2030
//
// Fetches harmonic constants, datums and NOAA's own published predictions,
// recomputes the tide from the constants, and reports the disagreement.
// Requires Node 18+ (for global fetch) and a network connection. No packages.
// ---------------------------------------------------------------------------

const API = 'https://api.tidesandcurrents.noaa.gov';
const APP = 'Unprompted-tide-machine';
const DEFAULT = ['8410140','8443970','8518750','8658120','8771450',
                 '1612340','9414290','9435380','9447130','9455920'];

const argv = process.argv.slice(2);
let year = 2026;
const yi = argv.indexOf('--year');
if (yi >= 0) { year = +argv[yi + 1]; argv.splice(yi, 2); }
const ids = argv.length ? argv : DEFAULT;

const getJSON = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return r.json();
};
const parse = t => {
  const m = t.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+)/);
  return jdFromUTC(+m[1], +m[2], +m[3], +m[4], +m[5]);
};

const hdr = 'station                  nCon   RMS      worst    hi/lo dt   hi/lo dh';
console.log('NOAA CO-OPS vs. this engine, ' + year + '\n');
console.log(hdr);
console.log('-'.repeat(hdr.length));

for (const id of ids) {
  try {
    const [meta, har, dat] = await Promise.all([
      getJSON(`${API}/mdapi/prod/webapi/stations/${id}.json`),
      getJSON(`${API}/mdapi/prod/webapi/stations/${id}/harcon.json?units=metric`),
      getJSON(`${API}/mdapi/prod/webapi/stations/${id}/datums.json?units=metric`),
    ]);
    const s = meta.stations[0];
    const all = har.HarmonicConstituents;
    const known = all.filter(c => CONST[c.name]);
    const D = n => (dat.datums.find(d => d.name === n) || {}).value;
    const st = { constituents: known, offset: D('MSL') - D('MLLW') };

    const q = (product, interval) =>
      `${API}/api/prod/datagetter?product=${product}&application=${APP}` +
      `&begin_date=${year}0101&end_date=${year}1231&datum=MLLW&station=${id}` +
      `&time_zone=gmt&units=metric&interval=${interval}&format=json`;
    const [hourly, hilo] = await Promise.all([
      getJSON(q('predictions','h')), getJSON(q('predictions','hilo')),
    ]);

    let se = 0, mx = 0, n = 0;
    for (const p of hourly.predictions) {
      const e = predict(st, parse(p.t)) - (+p.v);
      se += e * e; if (Math.abs(e) > Math.abs(mx)) mx = e; n++;
    }
    let sdt = 0, sdh = 0, m = 0;
    for (const ev of (hilo.predictions || [])) {
      const j0 = parse(ev.t), sgn = ev.type === 'H' ? 1 : -1;
      let lo = j0 - 1.5/24, hi = j0 + 1.5/24;
      for (let k = 0; k < 70; k++) {           // ternary search for our own turning point
        const a = lo + (hi - lo)/3, b = hi - (hi - lo)/3;
        if (sgn * predict(st, a) < sgn * predict(st, b)) lo = a; else hi = b;
      }
      const jm = (lo + hi) / 2;
      sdt += Math.abs((jm - j0) * 1440);
      sdh += Math.abs(predict(st, jm) - (+ev.v));
      m++;
    }
    const flag = all.length > known.length ? '  <- ' + (all.length - known.length) + ' constituents not modelled' : '';
    let label = s.name.includes(s.state) ? s.name : s.name + ', ' + s.state;
    if (label.length > 23) label = label.slice(0, 22) + '…';
    console.log(
      label.padEnd(24) +
      String(all.length).padStart(4) +
      (Math.sqrt(se/n)*100).toFixed(2).padStart(8) + ' cm' +
      (Math.abs(mx)*100).toFixed(1).padStart(7) + ' cm' +
      (sdt/m).toFixed(2).padStart(9) + ' min' +
      (sdh/m*100).toFixed(2).padStart(8) + ' cm' + flag);
  } catch (e) {
    console.log(id.padEnd(24) + '  failed: ' + e.message);
  }
}
console.log('\nRMS and worst are over every hourly value NOAA publishes for the year;');
console.log('dt and dh are mean absolute differences over every high and low water it lists.');
