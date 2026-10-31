# Montessori Home

A home Montessori Elementary app for a parent-guide and a child: the eight AMI Elementary albums as a
browsable, trackable curriculum, the printables library, and digital versions of the core materials.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. `npm run build` produces a static site in `dist/` (installable as a web app).

## What is where

- `source-material/` – the original album PDFs and printable zips (not committed).
- `tools/` – Python scripts that turn the source material into app data:
  - `extract_albums.py` – album PDFs → `src/data/albums/*.json` plus pictures in `public/images/albums/`.
  - `index_printables.py` – unpacked printables → `src/data/printables.json`, thumbnails, and compression of oversized PDFs.
  - `extract_extras.py` – etymological dictionary, experiments and word problems → `src/data/*.json`.
- `src/features/guide/` – the guide side: overview, album trees, lesson pages, weekly planner, printables, search, settings.
- `src/features/learn/` – the child's corner: digital materials (golden beads, stamp game, bead bars, fraction circles,
  grammar symbols, movable alphabet), word-origin flashcards, story problems, experiments and the work journal.

Progress, notes, the plan and the journal are stored in the browser (localStorage). Settings → Export backup moves them
between devices.

## Regenerating the data

Requires Python 3.11 with `pypdf`, `pymupdf` and `Pillow`, and `pdftotext` (xpdf) on the PATH.

```bash
python -I tools/extract_albums.py
python -I tools/index_printables.py
python -I tools/extract_extras.py
```

## Deploying

`.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages on every push to `main`,
using the repository name as the base path. For a root-path host (Netlify, Vercel, a custom domain) build without
`VITE_BASE`.
