# Colonoscopy Transcription Frontend

A React + Vite single-page application that records colonoscopy procedure audio, sends it to a FastAPI backend for transcription, and presents the structured result to the endoscopist for review, editing, and submission.

## Workflow

1. **Record** — the browser's built-in `MediaRecorder` API captures procedure audio. The recording is uploaded as a `multipart/form-data` POST to `/api/transcribe`.
2. **Review & complete** — the transcribed `ColonoscopyReportWithMetadata` is rendered as an editable form. The endoscopist verifies the auto-transcribed data and enters the required Boston Bowel Preparation Scale (BBPS) segment scores.
3. **Submit** — the completed report is POSTed to `/api/submit-report`, which writes to the database and generates a PDF. A download link is shown on success.

## Form sections

| Section | Fields |
|---|---|
| Patient & Procedure Details | Patient name, NHI number, procedure date, endoscopist ID |
| Procedure Details | Cecum reached, cecum reached time, procedure end time, withdrawal time |
| Boston Bowel Preparation Scale | Right colon (0–3), transverse colon (0–3), left colon (0–3); total is auto-calculated and read-only |
| Polyps | Size (mm), location, morphology, resection method, resection complete, retrieved — add/remove rows |
| Other Findings | Description, location, biopsy taken — add/remove rows |

The submit button is disabled until all three BBPS segment scores have been selected.

## API endpoints expected

| Method | Path | Description |
|---|---|---|
| `POST` | `/transcribe` | Accepts `multipart/form-data` with an `audio` file; returns `ColonoscopyReportWithMetadata` JSON |
| `POST` | `/submit-report` | Accepts `ColonoscopyReportWithMetadata` JSON; writes to DB, generates PDF, returns `{ pdf_url }` |

The Vite dev server proxies `/api/*` to `http://localhost:8000`, stripping the `/api` prefix.

## Stack

- **React 19** with `useState` only — no Redux, no form libraries
- **Vite 8** for dev server and bundling
- **Native `fetch`** for all HTTP — no Axios or other HTTP libraries
- No additional runtime dependencies beyond `react` and `react-dom`

## Development

```bash
npm install
npm run dev
```

The backend FastAPI service must be running on `http://localhost:8000`. To change the proxy target, edit `server.proxy` in `vite.config.js`.

## Build

```bash
npm run build
npm run preview
```
