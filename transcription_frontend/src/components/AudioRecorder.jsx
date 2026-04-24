import { useState, useRef } from 'react';
import { API_BASE } from '../apiConfig.js';

export default function AudioRecorder({ onTranscribed, onError }) {
  const [phase, setPhase] = useState('idle'); // idle | recording | uploading
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
    // Reset so selecting the same file again still fires onChange
    e.target.value = '';
    const formData = new FormData();
    formData.append('file', file, file.name);
    setPhase('uploading');
    await upload(formData);
  }

  async function upload(formData) {
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

  return (
    <div className="recorder-card">
      <h2>Colonoscopy Transcription</h2>
      <p className="recorder-hint">
        Record the procedure audio, then review and complete the structured report.
      </p>

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
