import { useState } from 'react';
import AudioRecorder from './components/AudioRecorder.jsx';
import ReportEditor from './components/ReportEditor.jsx';
import { API_ORIGIN } from './apiConfig.js';
import './App.css';

export default function App() {
  const [phase, setPhase] = useState('record'); // record | review | submitted
  const [reportData, setReportData] = useState(null);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [error, setError] = useState(null);

  function handleTranscribed(data) {
    setReportData(data.report);
    setExtractionFailed(data.status === 'failed');
    setError(null);
    setPhase('review');
  }

  function handleSubmitted(result) {
    setSubmittedResult(result);
    setError(null);
    setPhase('submitted');
  }

  function handleError(msg) {
    setError(msg);
  }

  function reset() {
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
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner" role="alert">
            <strong>Error:</strong> {error}
            <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {phase === 'record' && (
          <AudioRecorder onTranscribed={handleTranscribed} onError={handleError} />
        )}

        {phase === 'review' && reportData && (
          <ReportEditor
            initialData={reportData}
            extractionFailed={extractionFailed}
            onSubmitted={handleSubmitted}
            onError={handleError}
          />
        )}

        {phase === 'submitted' && (
          <div className="submitted-card">
            <h2>Report Submitted</h2>
            <p>The report has been saved and the PDF has been generated.</p>
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
