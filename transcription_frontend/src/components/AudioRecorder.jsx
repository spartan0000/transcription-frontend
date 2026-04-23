import { useState, useRef } from 'react';

export default function AudioRecorder({ onTranscribed, onError }) {
  const [phase, setPhase] = useState('idle'); // idle | recording | uploading
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

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
    formData.append('audio', blob, 'recording.webm');

    try {
      const res = await fetch('/api/transcribe', {
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
        <button className="btn btn-record" onClick={startRecording}>
          Start Recording
        </button>
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
