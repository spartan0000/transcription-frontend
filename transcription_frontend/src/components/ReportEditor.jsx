import { useState } from 'react';
import { API_BASE, API_ORIGIN } from '../apiConfig.js';
import MetadataSection from './MetadataSection.jsx';
import ProcedureSection from './ProcedureSection.jsx';
import BBPSSection from './BBPSSection.jsx';
import PolypList from './PolypList.jsx';
import FindingList from './FindingList.jsx';

export default function ReportEditor({ initialData, extractionFailed, onSubmitted, onError }) {
  const [metadata, setMetadata] = useState(initialData.metadata);
  const [report, setReport] = useState(initialData.report);
  const [submitting, setSubmitting] = useState(false);

  function patchMetadata(patch) {
    setMetadata((prev) => ({ ...prev, ...patch }));
  }

  function patchReport(patch) {
    setReport((prev) => ({ ...prev, ...patch }));
  }

  const bbpsComplete =
    report.bbps_right != null &&
    report.bbps_transverse != null &&
    report.bbps_left != null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!bbpsComplete) {
      onError('Please enter all three BBPS segment scores before submitting.');
      return;
    }

    // eslint-disable-next-line no-unused-vars
    const { withdrawal_time, ...reportFields } = report;
    const payload = {
      metadata,
      report: reportFields,
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const result = await res.json();
      if (result.pdf_url) window.open(`${API_ORIGIN}${result.pdf_url}`, '_blank', 'noopener,noreferrer');
      onSubmitted(result);
    } catch (err) {
      onError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="report-form" onSubmit={handleSubmit} noValidate>
      <h2>Review &amp; Complete Report</h2>

      {extractionFailed && (
        <div className="extraction-failed-banner" role="alert">
          <strong>Transcription failed.</strong> The AI was unable to extract data from the
          recording. All fields must be entered manually before submitting.
        </div>
      )}

      <p className="review-hint">
        Verify the transcribed data, enter the BBPS scores, then submit to generate the PDF.
      </p>

      <MetadataSection metadata={metadata} onChange={patchMetadata} />
      <ProcedureSection report={report} onChange={patchReport} />
      <BBPSSection report={report} onChange={patchReport} />
      <PolypList polyps={report.polyps ?? []} onChange={(p) => patchReport({ polyps: p })} />
      <FindingList findings={report.findings ?? []} onChange={(f) => patchReport({ findings: f })} />

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-submit"
          disabled={submitting || !bbpsComplete}
        >
          {submitting ? 'Submitting…' : 'Submit and Generate PDF'}
        </button>
        {!bbpsComplete && (
          <span className="submit-hint">All BBPS segment scores are required to submit.</span>
        )}
      </div>
    </form>
  );
}
