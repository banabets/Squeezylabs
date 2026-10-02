// Optional ambient sound synthesized in the browser: waves (low noise swelling slowly) and breeze (soft high noise).
// Nothing loads until the visitor turns it on.
let ctx: AudioContext | null = null, master: GainNode | null = null;

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
}
