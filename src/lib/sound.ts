let ctx: AudioContext | null = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; }
  }
  return ctx;
}

function beep(freq: number, dur: number, type: OscillatorType = "square", vol = 0.08) {
  const c = getCtx(); if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g).connect(c.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.stop(c.currentTime + dur);
}

export const sound = {
  hit: () => beep(880, 0.08, "square"),
  combo: (n: number) => beep(440 + Math.min(n, 20) * 60, 0.12, "sawtooth"),
  error: () => { beep(120, 0.18, "sawtooth", 0.12); setTimeout(() => beep(80, 0.2, "sawtooth", 0.1), 60); },
  chaos: () => { beep(200, 0.05, "square"); setTimeout(() => beep(600, 0.05, "square"), 50); setTimeout(() => beep(300, 0.08, "square"), 100); },
  death: () => { beep(400, 0.15, "sawtooth", 0.15); setTimeout(() => beep(200, 0.2, "sawtooth", 0.15), 150); setTimeout(() => beep(100, 0.4, "sawtooth", 0.15), 300); },
  start: () => { beep(523, 0.08); setTimeout(() => beep(659, 0.08), 80); setTimeout(() => beep(784, 0.12), 160); },
};
