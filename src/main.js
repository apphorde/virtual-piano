// Virtual Piano - Web Audio API driven piano
// Two octaves: C3 to B4 (24 notes)
// Polyphonic, keyboard+mouse support, visual feedback, octave labeling

import {
  initAudio,
  playNote,
  stopNote,
  activeNotes,
  isAudioRunning,
} from "./audio.js";

// Wait for user gesture before starting AudioContext
const audioStatusText = document.getElementById("audio-status-text");
document.body.addEventListener(
  "click",
  () => {
    initAudio().then(() => {
      audioStatusText.textContent = isAudioRunning() ? "running" : "suspended";
    });
  },
  { once: true },
);

// Select all piano keys
const whiteKeys = document.querySelectorAll(".key.white");
const blackKeys = document.querySelectorAll(".key.black");

// Keyboard key mapping (natural + sharp notes)
// Mapping: key -> note name (e.g., 'a' -> C3, 's' -> C#3, etc.)
const keyMap = {
  // C3 octave (white: a, s, d, f, g; black: w, e, t, y, o)
  KeyA: "C3",
  KeyW: "C3#",
  KeyS: "D3",
  KeyE: "D3#",
  KeyD: "E3",
  KeyF: "F3",
  KeyT: "F3#",
  KeyG: "G3",
  KeyY: "G3#",
  KeyH: "A3",
  KeyU: "A3#",
  KeyJ: "B3",

  // C4 octave (white: k, l, ;, '; black: i, o, p, [, ])
  KeyK: "C4",
  KeyO: "C4#",
  KeyL: "D4",
  KeyP: "D4#",
  // Semicolon/colon maps to E4
  Semicolon: "E4",
  KeyQ: "F4",
  KeyI: "F4#",
  KeyAmpersand: "G4", // press-9 / &
  KeyZ: "A4",
  KeyX: "A4#",
  KeyC: "B4",
};

// Initialize the piano when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Attach click handlers to white keys
  whiteKeys.forEach((key) => {
    const note = key.dataset.note;
    key.addEventListener("click", () => handleNoteOn(note));
    key.addEventListener("mouseover", () => {
      if (activeNotes.has(note)) key.classList.add("active");
    });
    key.addEventListener("mouseout", () => {
      if (!activeNotes.has(note)) key.classList.remove("active");
    });
  });

  // Attach click handlers to black keys
  blackKeys.forEach((key) => {
    const note = key.dataset.note;
    key.addEventListener("click", () => handleNoteOn(note));
    key.addEventListener("mouseover", () => {
      if (activeNotes.has(note)) key.classList.add("active");
    });
    key.addEventListener("mouseout", () => {
      if (!activeNotes.has(note)) key.classList.remove("active");
    });
  });

  // Keyboard support
  document.addEventListener("keydown", (e) => {
    const noteName = keyMap[e.code];
    if (noteName) {
      e.preventDefault();
      handleNoteOn(noteName);
    }
  });

  document.addEventListener("keyup", (e) => {
    const noteName = keyMap[e.code];
    if (noteName) {
      handleNoteOff(noteName);
    }
  });
});

// Note-on handler
function handleNoteOn(noteName) {
  initAudio();
  playNote(noteName);
  activeNotes.add(noteName);
  updateKeyVisual(noteName, true);
}

// Note-off handler
function handleNoteOff(noteName) {
  stopNote(noteName);
  activeNotes.delete(noteName);
  updateKeyVisual(noteName, false);
}

// Update visual state of keys
function updateKeyVisual(noteName, isActive) {
  const key = document.querySelector(`[data-note="${noteName}"]`);
  if (key) {
    key.classList.toggle("active", isActive);
  }
}

// Export a simple MIDI-friendly note API
// This module boundary exposes note frequencies and naming useful for MIDI integration
export const noteApi = {
  // Note name to frequency (Hz), standard tuning A4=440
  frequencies: {
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
  },

  // Get frequency by note name
  getFrequency(note) {
    return this.frequencies[note] || 0;
  },

  // Get note name from MIDI number (0-127)
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

  // Get MIDI number from note name (returns closest MIDI note)
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
    // A4 = midi 69 = 440Hz
    return (octave + 1) * 12 + base;
  },
};
