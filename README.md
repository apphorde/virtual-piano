# Virtual Piano

A browser-based virtual piano built with Web Audio API, HTML, and CSS.

## Features

- **Two octaves** (C3 to B4, 24 notes)
- **Keyboard keypress mapping** - play with computer keyboard
- **Clickable piano keys** - mouse/touch support
- **Polyphonic** - multiple notes can play simultaneously
- **No stuck notes** - note-on/note-off lifecycle guarantees
- **Visual active states** - keys light up when played
- **Octave labeling** - C3 and C4 labels
- **Responsive UI** - works at mobile viewport sizes
- **MIDI-friendly note API** - note frequencies and conversion utilities

## Project Structure

```
virtual-piano/
├── Dockerfile          # Nginx-based container for static serving
├── docker-compose.yml  # Run with `docker compose up --build`
├── package.json        # Project metadata and dev dependencies
├── README.md           # This file
├── src/
│   ├── main.js         # Keyboard/click handlers, DOM setup
│   ├── audio.js        # Web Audio API engine, polyphonic synth
│   └── piano.css       # Responsive piano key styling
└── index.html          # Entry point
```

## Running locally

### Development (hot-reload not needed - static files)

```bash
# Option 1: Using docker compose (recommended)
docker compose up --build

# Option 2: Serve static files directly
npx serve -l 3000     # or python -m http.server 3000
# Or simply open index.html in any browser
```

### Without Docker

```bash
# Using python http server
python3 -m http.server 8080

# Or using node
npx serve .

# Then open http://localhost:8080 in your browser
```

## Keyboard Mapping

### C3 Octave (lower octave, keys near QWERTY home row)

| Key | Note |
| --- | ---- |
| `A` | C3   |
| `W` | C3#  |
| `S` | D3   |
| `E` | D3#  |
| `D` | E3   |
| `F` | F3   |
| `T` | F3#  |
| `G` | G3   |
| `Y` | G3#  |
| `H` | A3   |
| `U` | A3#  |
| `J` | B3   |

### C4 Octave (upper octave, top row of QWERTY)

| Key     | Note |
| ------- | ---- |
| `K`     | C4   |
| `O`     | C4#  |
| `L`     | D4   |
| `P`     | D4#  |
| `;`     | E4   |
| `Q`     | F4   |
| `I`     | F4#  |
| `9`/`&` | G4   |
| `Z`     | A4   |
| `X`     | A4#  |
| `C`     | B4   |

### Additional

- Press and hold keys to sustain notes
- Release keys to stop notes (no stuck notes)
- Click piano keys with mouse/touch for the same mapping

## Docker

```bash
docker compose up --build
# Then visit http://localhost:8080
```

## License

MIT
