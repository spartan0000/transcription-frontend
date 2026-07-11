import { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm.jsx';
import AudioRecorder from './components/AudioRecorder.jsx';
import ReportEditor from './components/ReportEditor.jsx';
import { apiRequest } from './api.js';
import { API_ORIGIN } from './apiConfig.js';
import './App.css';

const STORAGE_KEY = 'pending_transcript_id';

function draftToReportData(draft) {
  return {
    metadata: {
      patient_name: draft.patient_name,
      patient_NHI: draft.patient_id,
      patient_dob: draft.patient_dob,
      procedure_date: draft.procedure_date,
      endoscopist_id: draft.endoscopist_id,
      indication: draft.indication,
    },
    report: {
      cecum_reached: draft.cecum_reached,
      cecum_reached_time: draft.cecum_reached_time,
      procedure_end_time: draft.procedure_end_time,
      bbps_right: draft.bbps_right,
      bbps_transverse: draft.bbps_transverse,
      bbps_left: draft.bbps_left,
      polyps: draft.polyps ?? [],
      findings: draft.findings ?? [],
    },
  };
}

export default function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [phase, setPhase] = useState('record'); // record | review | submitted
  const [reportData, setReportData] = useState(null);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [error, setError] = useState(null);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!token) return;

    const transcriptId = localStorage.getItem(STORAGE_KEY);
    if (!transcriptId) return;

    setRecovering(true);
    apiRequest(`/transcripts/${transcriptId}/draft`, { token })
      .then((data) => {
        setReportData(draftToReportData(data));
        setExtractionFailed(data.status === 'failed');
        setPhase('review');
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setRecovering(false));
  }, [token]);

  function handleLogin(newToken, loggedInAs) {
    setToken(newToken);
    setUsername(loggedInAs);
    setError(null);
  }

  function handleLogout() {
    setToken(null);
    setUsername(null);
    setPhase('record');
    setReportData(null);
    setExtractionFailed(false);
    setSubmittedResult(null);
    setError(null);
  }

  function handleTranscribed(data) {
    if (data.transcript_id) {
      localStorage.setItem(STORAGE_KEY, data.transcript_id);
    }
    setReportData(data.report);
    setExtractionFailed(data.status === 'failed');
    setError(null);
    setPhase('review');
  }

  function handleSubmitted(result) {
    localStorage.removeItem(STORAGE_KEY);
    setSubmittedResult(result);
    setError(null);
    setPhase('submitted');
  }

  function handleError(err) {
    const message = err instanceof Error ? err.message : err;
    const status = err instanceof Error ? err.status : null;
    if (status === 401) {
      handleLogout();
      setError('Your session has expired. Please log in again.');
      return;
    }
    setError(message);
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setPhase('record');
    setReportData(null);
    setExtractionFailed(false);
    setSubmittedResult(null);
    setError(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Colonoscopy Report</h1>
        {token && (
          <div className="header-user">
            <span>{username}</span>
            <button className="btn btn-logout" onClick={handleLogout}>Log Out</button>
          </div>
        )}
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner" role="alert">
            <strong>Error:</strong> {error}
            <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {!token && <AuthForm onLogin={handleLogin} />}

        {token && recovering && (
          <p className="uploading-msg">Restoring your previous session…</p>
        )}

        {token && !recovering && phase === 'record' && (
          <AudioRecorder token={token} onTranscribed={handleTranscribed} onError={handleError} />
        )}

        {token && !recovering && phase === 'review' && reportData && (
          <ReportEditor
            token={token}
            initialData={reportData}
            extractionFailed={extractionFailed}
            onSubmitted={handleSubmitted}
            onError={handleError}
          />
        )}

        {token && !recovering && phase === 'submitted' && (
          <div className="submitted-card">
            <h2>Report Submitted</h2>
            <p>The report has been saved and the PDF has been generated.</p>
            {submittedResult?.procedure_id != null && (
              <p className="procedure-id">Procedure ID: <strong>{submittedResult.procedure_id}</strong></p>
            )}
            {submittedResult?.pdf_url && (
              <a
                className="btn btn-record"
                href={`${API_ORIGIN}${submittedResult.pdf_url}`}
                target="_blank"
                rel="noreferrer"
              >
                Download PDF
              </a>
            )}
            <button className="btn btn-secondary" onClick={reset}>
              Start New Recording
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
