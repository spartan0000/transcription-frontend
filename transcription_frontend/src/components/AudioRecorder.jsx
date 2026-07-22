import { useState, useRef } from 'react';
import { apiRequest } from '../api.js';
import { nowAsDatetimeLocal, fromDatetimeLocal } from '../utils/datetime.js';

export default function AudioRecorder({ token, onTranscribed, onError }) {
  const [phase, setPhase] = useState('pre-start'); // pre-start | starting | idle | recording | uploading
  const [transcriptId, setTranscriptId] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [cecumTime, setCecumTime] = useState('');
  const [procedureEndTime, setProcedureEndTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientDob, setPatientDob] = useState('');
  const [patientNhi, setPatientNhi] = useState('');

  const canStart = patientName.trim() !== '' && patientDob !== '' && patientNhi.trim() !== '';

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');   // stable ref for use inside event handlers
  const shouldUploadRef = useRef(false);
  const fileInputRef = useRef(null);

  async function startProcedure() {
    if (!canStart) {
      onError('Please enter patient name, date of birth, and NHI number before starting.');
      return;
    }
    setPhase('starting');
    try {
      const data = await apiRequest('/transcripts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName.trim(),
          patient_dob: patientDob,
          patient_nhi: patientNhi.trim(),
        }),
        token,
      });
      setTranscriptId(data.transcript_id);
      setPhase('idle');
    } catch (err) {
      setPhase('pre-start');
      onError(err);
    }
  }

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
    const cecumISO = fromDatetimeLocal(cecumTime);
    const endISO = fromDatetimeLocal(procedureEndTime);
    if (cecumISO) formData.append('cecum_reached_time', cecumISO);
    if (endISO) formData.append('procedure_end_time', endISO);

    try {
      const data = await apiRequest(`/transcribe/${transcriptId}`, {
        method: 'POST',
        body: formData,
        token,
      });
      onTranscribed(data);
    } catch (err) {
      setPhase('idle');
      onError(err);
    }
  }

  const showTimestamps = phase === 'idle' || phase === 'recording';

  return (
    <div className="recorder-card">
      <h2>Colonoscopy Transcription</h2>
      <p className="recorder-hint">
        Use the buttons to stamp timestamps at the correct moment, or type a time manually.
      </p>

      {phase === 'pre-start' && (
        <div className="pre-start-section">
          <div className="two-col">
            <div className="field-group">
              <label htmlFor="patient_name">Patient Name</label>
              <input
                id="patient_name"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="patient_dob">Date of Birth</label>
              <input
                id="patient_dob"
                type="date"
                value={patientDob}
                onChange={(e) => setPatientDob(e.target.value)}
                required
              />
            </div>

            <div className="field-group col-span-2">
              <label htmlFor="patient_nhi">NHI Number</label>
              <input
                id="patient_nhi"
                type="text"
                value={patientNhi}
                onChange={(e) => setPatientNhi(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="recorder-actions">
            <button className="btn btn-record" onClick={startProcedure} disabled={!canStart}>
              Start Procedure
            </button>
          </div>
          {!canStart && (
            <span className="submit-hint">
              Patient name, date of birth, and NHI number are required to start.
            </span>
          )}
        </div>
      )}

      {phase === 'starting' && (
        <p className="uploading-msg">Starting procedure…</p>
      )}

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
