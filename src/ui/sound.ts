// Optional ambient sound synthesized in the browser: waves (low noise swelling slowly), breeze (soft high
// noise) and, now and then, a distant cuatro strumming a joropo phrase.
// Nothing loads until the visitor turns it on.
let ctx: AudioContext | null = null, master: GainNode | null = null, cuatroTimer = 0;

function noiseSource(c: AudioContext) {
  const buffer = c.createBuffer(1, c.sampleRate * 4, c.sampleRate), data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) { const white = Math.random() * 2 - 1; last = (last + .02 * white) / 1.02; data[i] = last * 3.5; }
  const src = c.createBufferSource(); src.buffer = buffer; src.loop = true; return src;
}
function layer(c: AudioContext, out: AudioNode, type: BiquadFilterType, freq: number, level: number, swell: number, depth: number) {
  const src = noiseSource(c), filter = c.createBiquadFilter(), gain = c.createGain(), lfo = c.createOscillator(), lfoGain = c.createGain();
  filter.type = type; filter.frequency.value = freq; gain.gain.value = level;
  lfo.frequency.value = swell; lfoGain.gain.value = depth; lfo.connect(lfoGain).connect(gain.gain);
  src.connect(filter).connect(gain).connect(out); src.start(); lfo.start();
}

// Cuatro: four nylon strings, plucked with Karplus-Strong. Each chord is rendered once as a short strum
// (string after string, a few milliseconds apart) and replayed in a 6/8 joropo pattern.
const CHORDS: Record<string, number[]> = { D: [220, 293.66, 369.99, 293.66], G: [246.94, 293.66, 392, 246.94], A: [220, 277.18, 329.63, 220] };
function strum(c: AudioContext, freqs: number[], down: boolean) {
  const sr = c.sampleRate, len = Math.floor(sr * 1.1), buf = c.createBuffer(1, len, sr), out = buf.getChannelData(0);
  (down ? freqs : [...freqs].reverse()).forEach((f, si) => {
    const N = Math.round(sr / f), line = new Float32Array(N), start = Math.floor(si * .011 * sr);
    for (let i = 0; i < N; i++) line[i] = Math.random() * 2 - 1;
    let prev = 0;
    for (let i = 0, k = 0; start + i < len; i++, k = (k + 1) % N) { const v = line[k]; line[k] = .994 * (v + prev) / 2; prev = v; out[start + i] += v * .22; }
  });
  return buf;
}
let strums: Record<string, AudioBuffer[]> | null = null;
function playPhrase(c: AudioContext, out: AudioNode) {
  if (!strums) strums = Object.fromEntries(Object.entries(CHORDS).map(([k, f]) => [k, [strum(c, f, true), strum(c, f, false)]]));
  // Four bars of 6/8: accents on 1 and 4, a quick down-up in between, through D - G - A - D.
  const eighth = .2, bars = ['D', 'G', 'A', 'D'], pattern: [number, boolean, number][] = [[0, true, 1], [2, true, .6], [3, true, .9], [4, false, .5], [5, true, .6]];
  const t0 = c.currentTime + .1, room = c.createBiquadFilter(); room.type = 'lowpass'; room.frequency.value = 2200; room.connect(out);
  bars.forEach((ch, b) => pattern.forEach(([step, down, vel]) => {
    const src = c.createBufferSource(), g = c.createGain(); src.buffer = strums![ch][down ? 0 : 1]; g.gain.value = vel * .22;
    src.connect(g).connect(room); src.start(t0 + (b * 6 + step) * eighth);
  }));
}

export function setAmbientSound(on: boolean) {
  if (on && !ctx) {
    ctx = new AudioContext(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    layer(ctx, master, 'lowpass', 500, .55, .11, .4);
    layer(ctx, master, 'lowpass', 900, .25, .07, .2);
    layer(ctx, master, 'bandpass', 2600, .05, .05, .04);
  }
  if (!ctx || !master) return;
  if (on) ctx.resume();
  master.gain.setTargetAtTime(on ? .5 : 0, ctx.currentTime, .6);
  // The cuatro drifts in from down the beach every half minute or so, never as a constant loop.
  window.clearTimeout(cuatroTimer);
  if (on) { const c = ctx, m = master, next = (first: boolean) => { cuatroTimer = window.setTimeout(() => { playPhrase(c, m); next(false); }, first ? 4000 : 26000 + Math.random() * 14000); }; next(true); }
}
