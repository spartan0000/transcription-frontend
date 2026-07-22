# Colonoscopy Transcription Frontend

A React + Vite single-page application that transcribes colonoscopy procedure dictation live in the browser using the Web Speech API, then presents the structured result to the endoscopist for review, editing, and submission.

## Authentication

The app is gated behind login — nothing else is usable until the endoscopist signs in.

- **Register** — create an account with username, email, and password.
- **Log In** — signs the user in. There are no persistent sessions: logging in only lasts for the current browser tab/session, so a refresh or closed tab requires logging in again.
- **Log Out** — available in the header once signed in.

The image-capture flow (a separate standalone script with its own login, used to photograph findings during the procedure) is independent of this frontend and isn't part of it.

## Workflow

1. **Start procedure** — the endoscopist enters the patient's name, date of birth, and NHI number (all required) and clicks **Start Procedure** to create a new transcript record for the session.
2. **Transcribe** — the browser's built-in Web Speech API (`webkitSpeechRecognition`) captures and transcribes the procedure dictation in real time. The endoscopist stamps **Cecum Reached** and **Procedure Finished** timestamps during the procedure. On stop, the transcript is sent for structured data extraction.
3. **Review & complete** — the extracted report is rendered as an editable form for the endoscopist to verify and complete before finalizing. If extraction failed, a warning banner is shown and all fields must be entered manually.
4. **Submit** — finalizing the report writes it to the database and generates a PDF, which opens automatically in a new tab.

If the browser closes or the tab is lost mid-procedure, the endoscopist can log back in and resume the in-progress draft rather than starting over.

## Recording page

- **Patient Name / Date of Birth / NHI Number** — required before a procedure can be started.
- **Start Procedure** — creates the transcript record for the session. The timestamp controls and recording buttons only appear after this step succeeds.
- **Start Recording** — activates the microphone and begins live speech-to-text. Finalised words appear in solid text; words still being processed appear greyed and italic.
- **Stop & Submit** — stops recognition and sends the full transcript for processing.
- **Cecum Reached / Procedure Finished** buttons — stamp the current local time into editable timestamp fields. Fields can also be set manually if a button was missed.
- **Send Test File** — opens a file picker (`.txt` only) for development and demo use, sent through the same flow as a live transcript.

> Speech recognition requires Chrome or another browser that implements `webkitSpeechRecognition`. The app shows an error if the API is unavailable.

The review form covers patient/procedure details, the Boston Bowel Preparation Scale, polyps, and other findings, and won't let the endoscopist finalize until the required fields for each are filled in.

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
