import { useState, useRef } from 'react';
import { API_BASE } from '../apiConfig.js';

function nowAsDatetimeLocal() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffset).toISOString().slice(0, 19);
}

function toISOWithOffset(datetimeLocalStr) {
  if (!datetimeLocalStr) return null;
  const d = new Date(datetimeLocalStr);
  const offsetMins = -d.getTimezoneOffset();
  const sign = offsetMins >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMins);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${datetimeLocalStr}${sign}${hh}:${mm}`;
}

export default function AudioRecorder({ onTranscribed, onError }) {
  const [phase, setPhase] = useState('idle'); // idle | recording | uploading
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [cecumTime, setCecumTime] = useState('');
  const [procedureEndTime, setProcedureEndTime] = useState('');

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');   // stable ref for use inside event handlers
  const shouldUploadRef = useRef(false);
  const fileInputRef = useRef(null);

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    transcriptRef.current = '';
    setTranscript('');
    setInterimText('');
    shouldUploadRef.current = false;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-NZ';
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let newFinal = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += text;
        } else {
          interim += text;
        }
      }
      if (newFinal) {
        transcriptRef.current += newFinal;
        setTranscript(transcriptRef.current);
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        onError(`Speech recognition error: ${event.error}`);
        setPhase('idle');
      }
    };

    recognition.onend = () => {
      setInterimText('');
      if (shouldUploadRef.current) {
        shouldUploadRef.current = false;
        uploadTranscript();
      }
    };

    recognition.start();
    setPhase('recording');
  }

  function stopRecording() {
    shouldUploadRef.current = true;
    setPhase('uploading');
    recognitionRef.current?.stop();
  }

  async function uploadTranscript() {
    const text = transcriptRef.current.trim();
    const blob = new Blob([text], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'transcript.txt');
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

  const showTimestamps = phase === 'idle' || phase === 'recording';

  return (
    <div className="recorder-card">
      <h2>Colonoscopy Transcription</h2>
      <p className="recorder-hint">
        Use the buttons to stamp timestamps at the correct moment, or type a time manually.
      </p>

      {showTimestamps && (
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

      {phase === 'recording' && (
        <div className="transcript-preview">
          <span className="transcript-final">{transcript}</span>
          <span className="transcript-interim">{interimText}</span>
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
            Send Test File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            hidden
            onChange={handleFileSelected}
          />
        </div>
      )}

      {phase === 'recording' && (
        <div className="recording-indicator">
          <span className="pulse-dot" />
          <span>Listening…</span>
          <button className="btn btn-stop" onClick={stopRecording}>
            Stop &amp; Submit
          </button>
        </div>
      )}

      {phase === 'uploading' && (
        <p className="uploading-msg">Sending transcript for processing, please wait…</p>
      )}
    </div>
  );
}
