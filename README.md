# Colonoscopy Transcription Frontend

A React + Vite single-page application that transcribes colonoscopy procedure dictation live in the browser using the Web Speech API, then presents the structured result to the endoscopist for review, editing, and submission.

## Workflow

1. **Transcribe** — the browser's built-in Web Speech API (`webkitSpeechRecognition`) captures and transcribes the procedure dictation in real time. The endoscopist stamps **Cecum Reached** and **Procedure Finished** timestamps during the procedure. On stop, the transcript text and timestamps are uploaded as `multipart/form-data` to `/api/transcribe`, which passes them to an LLM for structured data extraction.
2. **Review & complete** — the backend returns a `{ report, status }` envelope. If `status` is `'failed'`, a warning banner is shown and all fields must be entered manually. Otherwise the extracted `ColonoscopyReportWithMetadata` is rendered as an editable form for the endoscopist to verify and complete.
3. **Submit** — the completed report is POSTed to `/api/write`, which writes to the database and generates a PDF. The PDF opens automatically in a new tab and a procedure ID is shown on the success screen.

## Recording page

- **Start Recording** — activates the microphone and begins live speech-to-text. Finalised words appear in solid text; words still being processed appear greyed and italic.
- **Stop & Submit** — stops recognition and sends the full transcript to the backend.
- **Cecum Reached / Procedure Finished** buttons — stamp the current local time into editable datetime fields. Fields can also be typed into manually if a button was missed.
- **Send Test File** — opens a file picker (`.txt` only) for development and demo use. The selected file is sent to the same endpoint as a live transcript.

> Speech recognition requires Chrome or another browser that implements `webkitSpeechRecognition`. The app shows an error if the API is unavailable.

## Review form sections

| Section | Fields |
|---|---|
| Patient & Procedure Details | Patient name, NHI number, date of birth, age at procedure (auto-calculated, read-only), procedure date, endoscopist ID, indication |
| Procedure Details | Cecum reached, cecum reached time, procedure end time, withdrawal time (preliminary, read-only — recalculated by backend on submission) |
| Boston Bowel Preparation Scale | Right colon (0–3), transverse colon (0–3), left colon (0–3); total is auto-calculated and read-only |
| Polyps | Size (mm), location, morphology, resection method, resection complete, retrieved — add/remove rows |
| Other Findings | Description, location, biopsy taken — add/remove rows |

The submit button is disabled until all three BBPS segment scores have been selected.

## API endpoints expected

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/transcribe` | `multipart/form-data`: `file` (text/plain transcript), optional `cecum_reached_time` and `procedure_end_time` (ISO 8601 with offset) | `{ report: ColonoscopyReportWithMetadata, status: "success" \| "failed" }` |
| `POST` | `/write` | `ColonoscopyReportWithMetadataFinal` JSON | `{ procedure_id, pdf_url }` |

Timestamps are sent as full ISO 8601 strings with local UTC offset (e.g. `2026-04-28T09:14:32+12:00`) so Python's `datetime` / Pydantic parse them unambiguously.

The withdrawal time in the review form is display-only (seconds converted to minutes). It is stripped from the submission payload — the backend recalculates it from `cecum_reached_time` and `procedure_end_time`.

The Vite dev server proxies `/api/*` to the configured backend URL, stripping the `/api` prefix (see Environment variables below). Static file URLs (e.g. `pdf_url`) are constructed using `VITE_API_ORIGIN` so they resolve to the correct backend host in all environments.

## Stack

- **React 19** with `useState` only — no Redux, no form libraries
- **Vite 8** for dev server and bundling
- **Web Speech API** (`webkitSpeechRecognition`) for live in-browser transcription
- **Native `fetch`** for all HTTP — no Axios or other HTTP libraries
- No additional runtime dependencies beyond `react` and `react-dom`

## Environment variables

Defaults live in `transcription_frontend/.env`; override by creating `transcription_frontend/.env.local` (gitignored, never committed).

| Variable | Used by | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | Browser (build-time) | `/api` | URL prefix for all `fetch` calls. Keep as `/api` for dev; set to the full backend URL for production. |
| `VITE_API_ORIGIN` | Browser (build-time) | `http://127.0.0.1:8000` | Bare backend origin prepended to static file paths such as `pdf_url`. Must match `API_PROXY_TARGET` in dev and `VITE_API_BASE_URL` in production. |
| `API_PROXY_TARGET` | Vite dev server only | `http://127.0.0.1:8000` | Where `/api/*` requests are forwarded during `npm run dev`. Ignored in production builds. |

### Local development (defaults work out of the box)

```bash
npm run dev   # proxies /api/* → http://127.0.0.1:8000
```

### Pointing at a different local port

Create `transcription_frontend/.env.local`:

```
API_PROXY_TARGET=http://localhost:9000
VITE_API_ORIGIN=http://localhost:9000
```

### Production build targeting a deployed backend

```
VITE_API_BASE_URL=https://api.yourserver.com
VITE_API_ORIGIN=https://api.yourserver.com
```

The proxy is not involved in production builds — the browser calls the backend directly.

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
