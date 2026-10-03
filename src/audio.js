// Virtual Piano Audio Engine
// Web Audio API driven polyphonic synth with proper note-on/note-off lifecycle

// Global audio context and state
let audioContext = null;
const oscillatorPool = new Map(); // noteName -> OscillatorNode
let gainNode = null;
export const activeNotes = new Set();
export function isAudioRunning() {
  return !!(audioContext && audioContext.state === "running");
}

// Note name to frequency mapping (same as main.js noteApi)
const NOTE_FREQUENCIES = {
  C3: 130.81,
  "C3#": 138.59,
  D3: 146.83,
  "D3#": 155.56,
  E3: 164.81,
  F3: 174.61,
  "F3#": 185,
  G3: 196,
  "G3#": 207.65,
  A3: 220,
  "A3#": 233.08,
  B3: 246.94,
  C4: 261.63,
  "C4#": 277.18,
  D4: 293.66,
  "D4#": 311.13,
  E4: 329.63,
  F4: 349.23,
  "F4#": 369.99,
  G4: 392,
  "G4#": 415.3,
  A4: 440,
  "A4#": 466.16,
  B4: 493.88,
};

/**
 * Initialize the AudioContext on user gesture
 * Must be called after a user interaction (click/touch)
 * Creates the AudioContext exactly once and resumes it.
 */
export function initAudio() {
  if (audioContext) {
    return audioContext.state === "suspended"
      ? audioContext.resume()
      : Promise.resolve();
  }

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioContext.createGain();
  gainNode.gain.value = 0.3;
  gainNode.connect(audioContext.destination);

  // Resume the context if it's suspended (required by Web Audio spec
  // after creation; user gesture already triggered this call)
  return audioContext.state === "suspended"
    ? audioContext.resume()
    : Promise.resolve();
}

/**
 * Play a note by name (e.g., "C3", "A4#")
 * Polyphonic - multiple notes can play simultaneously
 * @param {string} noteName - Note name like "C3", "A4#"
 * Creates a fresh oscillator per note for clean polyphony.
 */
export function playNote(noteName) {
  if (!audioContext) {
    initAudio().then(() => playNote(noteName));
    return;
  }

  // If context is suspended, resume it first, then play the note
  if (audioContext.state === "suspended") {
    audioContext.resume().then(() => playNote(noteName));
    return;
  }

  const frequency = NOTE_FREQUENCIES[noteName];
  if (!frequency) {
    console.error(`Unknown note name: ${noteName}`);
    return;
  }

  // Create a fresh oscillator per note (OscillatorNodes cannot be reliably
  // restarted after stop; polyphony is achieved by multiple concurrent notes)
  const previous = oscillatorPool.get(noteName);
  if (previous?.oscillator?.state === "running") {
    previous.oscillator.stop();
  }

  const oscillator = audioContext.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  // Create gain node for this note's envelope
  const noteGain = audioContext.createGain();

  // Connect oscillator to note gain, then to master gain
  oscillator.connect(noteGain);
  noteGain.gain.value = 0;
  noteGain.connect(gainNode);

  // Note-on: fade in quickly
  noteGain.gain.setValueAtTime(0, audioContext.currentTime);
  noteGain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);

  // Start the oscillator
  oscillator.start(audioContext.currentTime);

  // Track this oscillator in the pool for later cleanup
  oscillatorPool.set(noteName, { oscillator, noteGain });

  // Mark this note as currently playing
  activeNotes.add(noteName);
}

/**
 * Stop a note from playing
 * Called on key release or note-off
 * @param {string} noteName - Note name like "C3", "A4#"
 */
export function stopNote(noteName) {
  if (!audioContext || !gainNode) return;

  // Remove from active set
  activeNotes.delete(noteName);

  // Stop the oscillator for this note and clean up
  const note = oscillatorPool.get(noteName);
  if (note?.noteGain) {
    const now = audioContext.currentTime;
    note.noteGain.gain.cancelScheduledValues(now);
    note.noteGain.gain.setTargetAtTime(0.0001, now, 0.03);
  }
  if (note?.oscillator?.state === "running") {
    note.oscillator.stop(audioContext.currentTime + 0.12);
  }
  oscillatorPool.delete(noteName);
}

// Export note API for MIDI-friendly integration
export const noteApi = {
  frequencies: NOTE_FREQUENCIES,
  getFrequency(note) {
    return NOTE_FREQUENCIES[note] || 0;
  },
  midiToNote(midi) {
    const notes = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const octave = Math.floor((midi - 9) / 12);
    const noteIdx = ((midi % 12) + 12) % 12;
    return `${notes[noteIdx]}${octave}`;
  },
  noteToMidi(note) {
    const noteToSemi = {
      C: 0,
      "C#": 1,
      D: 2,
      "D#": 3,
      E: 4,
      F: 5,
      "F#": 6,
      G: 7,
      "G#": 8,
      A: 9,
      "A#": 10,
      B: 11,
    };
    const match = note.match(/^([A-G])(#|b)?(\d+)$/);
    if (!match) return 0;
    const letter = match[1];
    const accidental = match[2] || "";
    const octave = parseInt(match[3], 10);
    const base = noteToSemi[letter] + (accidental === "#" ? 1 : 0);
    return (octave + 1) * 12 + base;
  },
};
