import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const fragment = await readFile(new URL('./unmixing.html', import.meta.url), 'utf8');
const core = fragment.split('// BEGIN ENGINE')[1]?.split('\n').slice(1).join('\n').split('// END ENGINE')[0];
assert.ok(core, 'The tested engine must exist in the actual visual.');
const { World, drawing } = vm.runInNewContext(`(() => { ${core}; return { World, drawing }; })()`, { Uint8Array, Int32Array });
let randomState = 0xCAFEF00D;
function random() {
  randomState ^= randomState << 13;
  randomState ^= randomState >>> 17;
  randomState ^= randomState << 5;
  return randomState >>> 0;
}
function randomBits(count) { return Uint8Array.from({ length: count }, () => random() & 1); }
function same(world, ink, memory) {
  assert.deepEqual(world.ink, ink, 'Ink must return bit for bit.');
  assert.deepEqual(world.memory, memory, 'Memory must return bit for bit.');
}

// A deliberately separate, slow implementation checks neighbor indexing and
// wrapping as well as the inverse property. Invertibility alone would not catch
// a consistently wrong implementation of the local rule.
function independentRule(source, width, height) {
  return Uint8Array.from(source, (bit, i) => {
    const x = i % width, y = Math.floor(i / width);
    let neighbors = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx || dy) neighbors += source[((y + dy + height) % height) * width + (x + dx + width) % width];
    }
    return Number(neighbors === 3 || (bit && neighbors === 2));
  });
}
for (const [width, height] of [[3, 3], [4, 7], [11, 5], [176, 112]]) {
  for (let trial = 0; trial < 12; trial++) {
    const ink = randomBits(width * height), memory = randomBits(width * height);
    const world = new World(width, height, ink, memory);
    const expected = independentRule(ink, width, height).map((bit, i) => bit ^ memory[i]);
    world.step(1);
    assert.deepEqual(world.ink, expected);
    assert.deepEqual(world.memory, ink);
    world.step(-1);
    same(world, ink, memory);
    assert.equal(world.moment, 0);
  }
}
console.log('Local rule agrees with an independent implementation, including wrapped edges.');

// Exhaust every possible two-layer state on the smallest supported grid,
// checking both compositions rather than only a few pretty initial conditions.
const world = new World(3, 3, new Uint8Array(9));
const ink = new Uint8Array(9), memory = new Uint8Array(9);
for (let state = 0; state < 2 ** 18; state++) {
  for (let i = 0; i < 9; i++) { ink[i] = (state >>> i) & 1; memory[i] = (state >>> (i + 9)) & 1; }
  world.ink.set(ink); world.memory.set(memory);
  world.step(1); world.step(-1);
  same(world, ink, memory);
  world.step(-1); world.step(1);
  same(world, ink, memory);
}
console.log('Both inverse compositions passed for all 262,144 two-layer states on a 3 × 3 grid.');

// Interrupted playback and many changes of direction must also return exactly.
for (let trial = 0; trial < 20; trial++) {
  const ink = randomBits(117), memory = randomBits(117);
  const world = new World(13, 9, ink, memory);
  const directions = Array.from({ length: 150 }, () => random() & 1 ? 1 : -1);
  for (const direction of directions) world.step(direction);
  for (const direction of directions.reverse()) world.step(-direction);
  same(world, ink, memory);
}
console.log('Mixed forward/backward paths return both layers exactly.');

const width = 176, height = 112, seed = drawing(width, height);
const clean = new World(width, height, seed), changed = new World(width, height, seed);
for (let tick = 0; tick < 240; tick++) { clean.step(); changed.step(); }
assert.equal(clean.distance(changed), 0);
changed.flip(Math.floor(height / 2) * width + Math.floor(width / 2));
assert.equal(clean.distance(changed), 1, 'The intervention must change exactly one cell.');
for (let tick = 0; tick < 240; tick++) { clean.step(-1); changed.step(-1); }
same(clean, seed, new Uint8Array(width * height));
assert.notEqual(clean.distance(changed), 0, 'Distinct states cannot merge under a bijection.');
assert.equal(clean.moment, 0);
assert.equal(changed.moment, 0);
console.log(`The actual drawing returns after 240 steps. With one flipped bit, ${clean.distance(changed)} / ${seed.length} cells differ on return.`);

// A difference hidden entirely in memory still belongs in the visible counter.
const a = new World(3, 3, new Uint8Array(9));
const b = new World(3, 3, new Uint8Array(9));
b.memory[4] = 1;
assert.equal(a.distance(b), 1);
assert.equal(a.ink.reduce((sum, bit, i) => sum + Number(bit !== b.ink[i]), 0), 0);
assert.throws(() => a.step(0), /Direction/);
assert.throws(() => a.flip(9), /outside/);
assert.throws(() => new World(2, 2, new Uint8Array(4)), /at least/);
console.log('Memory-only differences and input bounds passed.');

const index = await readFile(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(index.includes(fragment), 'The standalone page must contain the exact verified fragment.');
assert.ok(!/<(?:script|link|img)\b[^>]*(?:src|href)=["']https?:/i.test(index), 'The page must not require remote assets.');
console.log('Standalone page contains the same source and has no remote asset dependencies.');
