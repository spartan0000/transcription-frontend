import { useState, useRef } from 'react';
import { API_BASE } from '../apiConfig.js';

// Returns YYYY-MM-DDTHH:MM:SS in local wall-clock time for datetime-local inputs.
function nowAsDatetimeLocal() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffset).toISOString().slice(0, 19);
}

// Converts a datetime-local string (YYYY-MM-DDTHH:MM:SS, no timezone) to a
// full ISO 8601 string with the local UTC offset, e.g. 2026-04-27T09:14:32+12:00.
// This is what Python's datetime / Pydantic expect for unambiguous parsing.
function toISOWithOffset(datetimeLocalStr) {
  if (!datetimeLocalStr) return null;
  const d = new Date(datetimeLocalStr); // JS treats no-tz string as local time
  const offsetMins = -d.getTimezoneOffset(); // positive = east of UTC
  const sign = offsetMins >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMins);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${datetimeLocalStr}${sign}${hh}:${mm}`;
}

export default function AudioRecorder({ onTranscribed, onError }) {
  const [phase, setPhase] = useState('idle'); // idle | recording | uploading
  const [cecumTime, setCecumTime] = useState('');
  const [procedureEndTime, setProcedureEndTime] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);

  async function startRecording() {
    chunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      uploadRecording();
    };

    recorder.start();
    setPhase('recording');
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setPhase('uploading');
  }

  async function uploadRecording() {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    await upload(formData);
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const formData = new FormData();
    formData.append('file', file, file.name);
    setPhase('uploading');
    await upload(formData);
  }

  async function upload(formData) {
    const cecumISO = toISOWithOffset(cecumTime);
    const endISO = toISOWithOffset(procedureEndTime);
    if (cecumISO) formData.append('cecum_reached_time', cecumISO);
    if (endISO) formData.append('procedure_end_time', endISO);

    for (let [k, v] of formData.entries()) {
      console.log(k, v);
    }

    try {
      const res = await fetch(`${API_BASE}/transcribe`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      onTranscribed(data);
    } catch (err) {
      setPhase('idle');
      onError(err.message);
    }
  }

  const showControls = phase === 'idle' || phase === 'recording';

  return (
    <div className="recorder-card">
      <h2>Colonoscopy Transcription</h2>
      <p className="recorder-hint">
        Use the buttons to stamp timestamps at the correct moment, or type a time manually.
      </p>

      {showControls && (
        <div className="timestamp-section">
          <div className="timestamp-row">
            <button
              type="button"
              className="btn btn-timestamp"
              onClick={() => setCecumTime(nowAsDatetimeLocal())}
            >
              Cecum Reached
            </button>
            <input
              type="datetime-local"
              step="1"
              className="timestamp-input"
              value={cecumTime}
              onChange={(e) => setCecumTime(e.target.value)}
            />
          </div>

          <div className="timestamp-row">
            <button
              type="button"
              className="btn btn-timestamp"
              onClick={() => setProcedureEndTime(nowAsDatetimeLocal())}
            >
              Procedure Finished
            </button>
            <input
              type="datetime-local"
              step="1"
              className="timestamp-input"
              value={procedureEndTime}
              onChange={(e) => setProcedureEndTime(e.target.value)}
            />
          </div>
        </div>
      )}

      {phase === 'idle' && (
        <div className="recorder-actions">
          <button className="btn btn-record" onClick={startRecording}>
            Start Recording
          </button>

          <span className="recorder-divider">or</span>

          <button
            className="btn btn-upload"
            onClick={() => fileInputRef.current.click()}
          >
            Upload Audio File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            hidden
            onChange={handleFileSelected}
          />
        </div>
      )}

      {phase === 'recording' && (
        <div className="recording-indicator">
          <span className="pulse-dot" />
          <span>Recording…</span>
          <button className="btn btn-stop" onClick={stopRecording}>
            Stop &amp; Submit
          </button>
        </div>
      )}

      {phase === 'uploading' && (
        <p className="uploading-msg">Uploading and transcribing, please wait…</p>
      )}
    </div>
  );
}
