let ctx = null;

function getCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, duration, type = 'sine', vol = 0.25) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

export function sfxCorrect() {
  tone(523, 0.12);
  setTimeout(() => tone(659, 0.12), 80);
  setTimeout(() => tone(784, 0.25), 160);
}

export function sfxWrong() {
  tone(220, 0.25, 'triangle', 0.15);
  setTimeout(() => tone(196, 0.3, 'triangle', 0.12), 120);
}

export function sfxStar() {
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => tone(f, 0.2, 'sine', 0.2), i * 90);
  });
}

export function sfxPop() {
  tone(900, 0.06, 'sine', 0.12);
}

export function sfxComplete() {
  const notes = [523, 659, 784, 1047, 784, 1047, 1319];
  notes.forEach((f, i) => {
    setTimeout(() => tone(f, i === notes.length - 1 ? 0.4 : 0.15, 'sine', 0.2), i * 100);
  });
}
