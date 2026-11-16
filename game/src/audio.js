let audioCtx = null;
let muted = false;

function getAudio() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function playTone(freqs, durations, type = 'sine', gainVal = 0.1) {
  if (muted) return;
  const ctx = getAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  let time = ctx.currentTime;
  for (let i = 0; i < freqs.length; i++) {
    const freq = freqs[i];
    const dur = durations[i] || 0.1;
    if (freq <= 0) {
      time += dur;
      continue;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + dur);
    time += dur;
  }
}

export const sound = {
  clean() {
    playTone([440, 880], [0.05, 0.08], 'triangle', 0.08);
  },
  missionDone() {
    playTone([523, 659, 784, 1046], [0.08, 0.08, 0.08, 0.15], 'sine', 0.1);
  },
  win() {
    playTone([440, 554, 659, 880, 1108], [0.1, 0.1, 0.1, 0.1, 0.3], 'triangle', 0.12);
  },
  lose() {
    playTone([220, 180, 140], [0.15, 0.15, 0.3], 'sawtooth', 0.12);
  },
  eventSting() {
    playTone([300, 600, 450, 750], [0.08, 0.08, 0.08, 0.2], 'square', 0.08);
  },
  douse() {
    playTone([600, 300], [0.06, 0.1], 'sine', 0.1);
  },
  bucket() {
    playTone([200, 400], [0.05, 0.1], 'triangle', 0.1);
  },
  buy() {
    playTone([587, 880], [0.08, 0.12], 'sine', 0.1);
  }
};
