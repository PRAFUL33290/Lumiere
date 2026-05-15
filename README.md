# Lumière — Lighting Show Manager

A web-based lighting show viewer for managing and consulting stage lighting cue plans (plans d'éclairage) for dance performances.

## Features

- **Show index** — overview cards for each performance with dancer count, duration and summary stats
- **Visual timeline** — colour-coded chronological track showing sections and accent markers for each show
- **Cue list** — filterable list of every lighting cue (sections, accents, *temps forts*) with timing, energy level and colour information
- **Dark console theme** — designed for use in low-light backstage environments

## Spectacles inclus

| ID | Titre | Chanson | Danseurs | Durée |
|----|-------|---------|----------|-------|
| P1.05.1 | LE RÊVE DU PRÉSENT | BOOM PADI | 17 | 04:05 |
| P1.09.1 | LE RÊVE DE L'ÉNERGIE | BOLLYWOOD MASALA | 22 | 04:06 |
| P2.07.1 | LE RÊVE DU MÉTISSAGE INDE/AFRIQUE | OH MAMA TETEMA | 16 | 05:05 |
| P2.09.1 | LE RÊVE DES ORIGINES | UYI AMMA | 18 | 04:09 |
| P2.14.1 | LE RÊVE DU BONHEUR SIMPLE | FINAL BOLLYWOOD | 71 | 07:30 |

## Usage

Open `index.html` directly in a browser (no build step required). All show data is loaded from `data/shows.json`.

## Project structure

```
Lumiere/
├── index.html          # Main application page
├── css/
│   └── styles.css      # Dark console theme
├── js/
│   └── app.js          # Timeline rendering & navigation
└── data/
    └── shows.json      # All show lighting cue definitions
```

## Data model

Each show entry in `data/shows.json` contains:

```jsonc
{
  "id": "P1.05.1",
  "title": "LE RÊVE DU PRÉSENT",
  "song": "BOOM PADI",
  "dancers": 17,
  "color": "#9B59B6",
  "colorLabel": "violet",
  "duration": "04:05",
  "durationSec": 245,
  "cues": [
    {
      "startTime": "00:00",  // MM:SS
      "endTime":   "00:13",
      "startSec":  0,        // seconds
      "endSec":    13,
      "type":      "section" | "accent" | "temps_fort",
      "sectionName": "Intro",
      "description": "...",
      "energy":    "low" | "medium" | "high" | "max",
      "colors":    ["violet", "magenta"]
    }
  ]
}
```