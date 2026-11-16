// WebAudio synthesizer sound effects for THE MAZEJANITOR
let audioContext = null;
let audioMuted = false;

function obtainContext() {
  if (!audioContext && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
    }
  }
  return audioContext;
}

export function toggleMute() {
  audioMuted = !audioMuted;
  return audioMuted;
}

export function isMuted() {
  return audioMuted;
}

function playNoteSequence(frequencies, durations, waveType = 'sine', volume = 0.1) {
  if (audioMuted) return;
  const ctx = obtainContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  let startTime = ctx.currentTime;
  for (let i = 0; i < frequencies.length; i++) {
    const freq = frequencies[i];
    const duration = durations[i] || 0.1;
    if (freq <= 0) {
      startTime += duration;
      continue;
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, startTime);

    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
    startTime += duration;
  }
}

export const sound = {
  clean() {
    playNoteSequence([440, 880], [0.05, 0.08], 'triangle', 0.08);
  },
  missionDone() {
    playNoteSequence([523, 659, 784, 1046], [0.08, 0.08, 0.08, 0.15], 'sine', 0.1);
  },
  win() {
    playNoteSequence([440, 554, 659, 880, 1108], [0.1, 0.1, 0.1, 0.1, 0.3], 'triangle', 0.12);
  },
  lose() {
    playNoteSequence([220, 180, 140], [0.15, 0.15, 0.3], 'sawtooth', 0.12);
  },
  eventSting() {
    playNoteSequence([300, 600, 450, 750], [0.08, 0.08, 0.08, 0.2], 'square', 0.08);
  },
  bucket() {
    playNoteSequence([200, 400], [0.05, 0.1], 'triangle', 0.1);
  },
  buy() {
    playNoteSequence([587, 880], [0.08, 0.12], 'sine', 0.1);
  },
};
