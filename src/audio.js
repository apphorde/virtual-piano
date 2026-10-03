// Virtual Piano Audio Engine
// Web Audio API driven polyphonic synth with proper note-on/note-off lifecycle

// Global audio context and state
let audioContext = null;
const oscillatorPool = new Map(); // noteName -> OscillatorNode
const gainNode = null;
const activeNotes = new Set();

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
 */
export function initAudio() {
  if (audioContext && audioContext.state !== "suspended") {
    return; // Already running
  }

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioContext.createGain();
  gainNode.gain.value = 0.3;
  gainNode.connect(audioContext.destination);

  // We don't resume here - we wait for user gesture if needed
  // The context may start suspended until user interaction
}

/**
 * Play a note by name (e.g., "C3", "A4#")
 * Polyphonic - multiple notes can play simultaneously
 * @param {string} noteName - Note name like "C3", "A4#"
 */
export function playNote(noteName) {
  if (!audioContext) {
    console.warn(
      "AudioContext not initialized. Call initAudio() first or wait for user gesture.",
    );
    // Try to resume if suspended
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().then(() => playNote(noteName));
    }
    return;
  }

  const frequency = NOTE_FREQUENCIES[noteName];
  if (!frequency) {
    console.error(`Unknown note name: ${noteName}`);
    return;
  }

  // Create or reuse oscillator from pool
  let oscillator;
  if (oscillatorPool.has(noteName)) {
    oscillator = oscillatorPool.get(noteName);
    if (oscillator.state === "running") {
      // Stop and restart for proper polyphony with envelope
      oscillator.stop();
    }
  } else {
    oscillator = audioContext.createOscillator();
    oscillatorPool.set(noteName, oscillator);
  }

  // Create gain node for this note's envelope
  const noteGain = audioContext.createGain();

  // Set oscillator parameters
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  oscillator.connect(noteGain);

  // Connect note gain to master gain, then to destination
  noteGain.gain.value = 0;
  noteGain.connect(gainNode);

  // Note-on: fade in quickly
  noteGain.gain.setValueAtTime(0, audioContext.currentTime);
  noteGain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);

  // Start the oscillator
  oscillator.start(audioContext.currentTime);

  // Schedule note-off after a short duration (with release)
  // For a piano-like sound, we use a short decay
  const noteDuration = 0.5; // seconds
  const releaseTime = 0.1; // seconds for fade out

  const startTime = audioContext.currentTime;

  // When note-off comes, fade out then stop
  const stopEnvelope = () => {
    const now = audioContext.currentTime;
    noteGain.gain.linearRampToValueAtTime(
      noteGain.gain.value,
      now + releaseTime,
    );
    noteGain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + releaseTime + 0.05,
    );

    // Stop oscillator after release
    const stopTime = now + releaseTime + 0.05;
    oscillator.stop(stopTime);
  };

  // Store the stop info for when stopNote is called
  const noteData = {
    noteName,
    oscillator,
    noteGain,
    startTime,
    releaseTime,
  };

  // If this note isn't already active, schedule auto-off
  if (!activeNotes.has(noteName)) {
    activeNotes.add(noteName);
    // Schedule automatic note-off after duration
    setTimeout(() => {
      stopEnvelope();
      activeNotes.delete(noteName);
      // Clean up oscillator from pool after some time
      setTimeout(() => {
        if (oscillatorPool.has(noteName)) {
          oscillatorPool.delete(noteName);
        }
      }, 2000);
    }, noteDuration * 1000);
  }

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

  // Find the note's oscillator/gain from the pool
  const noteData = oscillatorPool.get(noteName);
  if (noteData && noteData.noteGain) {
    const now = audioContext.currentTime;
    // Fade out the gain
    noteData.noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  }

  // Remove from active set
  activeNotes.delete(noteName);

  // Clean up oscillator from pool after a grace period
  setTimeout(() => {
    if (oscillatorPool.has(noteName)) {
      const osc = oscillatorPool.get(noteName);
      if (osc && osc.state === "running") {
        osc.stop();
      }
      oscillatorPool.delete(noteName);
    }
  }, 100);
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
