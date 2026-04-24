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

The Vite dev server proxies `/api/*` to the configured backend URL, stripping the `/api` prefix (see Environment variables below).

## Stack

- **React 19** with `useState` only — no Redux, no form libraries
- **Vite 8** for dev server and bundling
- **Native `fetch`** for all HTTP — no Axios or other HTTP libraries
- No additional runtime dependencies beyond `react` and `react-dom`

## Environment variables

Two variables control where the app sends API requests. Defaults live in `.env` inside the project directory; override them by creating a `.env.local` file alongside it (gitignored, never committed).

| Variable | Used by | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | Browser (build-time) | `/api` | URL prefix for all `fetch` calls. Keep as `/api` for dev; set to the full backend URL for production. |
| `API_PROXY_TARGET` | Vite dev server only | `http://localhost:8000` | Where `/api/*` requests are forwarded during `npm run dev`. Ignored in production builds. |

### Local development (defaults work out of the box)

```bash
npm run dev   # proxies /api/* → http://localhost:8000
```

### Pointing at a different local port

Create `transcription_frontend/.env.local`:

```
API_PROXY_TARGET=http://localhost:9000
```

### Production build targeting a deployed backend

Set `VITE_API_BASE_URL` in your deployment environment (or in `.env.local` before building):

```
VITE_API_BASE_URL=https://api.yourserver.com
```

The proxy is not involved in production builds — the browser will call `https://api.yourserver.com/transcribe` and `https://api.yourserver.com/submit-report` directly.

## Development

```bash
cd transcription_frontend
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
