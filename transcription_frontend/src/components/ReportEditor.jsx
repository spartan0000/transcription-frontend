import { useState } from 'react';
import { apiRequest } from '../api.js';
import { API_ORIGIN } from '../apiConfig.js';
import MetadataSection from './MetadataSection.jsx';
import ProcedureSection from './ProcedureSection.jsx';
import BBPSSection from './BBPSSection.jsx';
import PolypList from './PolypList.jsx';
import FindingList from './FindingList.jsx';

function getValidationIssues(report) {
  const issues = [];
  if (report.cecum_reached == null) issues.push('Cecum Reached (yes/no)');
  if (!report.cecum_reached_time) issues.push('Cecum Reached Time');
  if (!report.procedure_end_time) issues.push('Procedure End Time');
  if (
    report.bbps_right == null ||
    report.bbps_transverse == null ||
    report.bbps_left == null
  ) {
    issues.push('All three BBPS segment scores');
  }
  (report.polyps ?? []).forEach((p, i) => {
    if (!p.location) issues.push(`Polyp ${i + 1} location`);
  });
  return issues;
}

// morphology/resection_method are strict enums with no null option in the
// backend schema; omit them entirely rather than send an unset value as null.
function sanitizePolyp({ morphology, resection_method, ...rest }) {
  const sanitized = { ...rest };
  if (morphology != null) sanitized.morphology = morphology;
  if (resection_method != null) sanitized.resection_method = resection_method;
  return sanitized;
}

export default function ReportEditor({ token, transcriptId, initialData, extractionFailed, onSubmitted, onError }) {
  const [metadata, setMetadata] = useState(initialData.metadata);
  const [report, setReport] = useState(initialData.report);
  const [submitting, setSubmitting] = useState(false);

  function patchMetadata(patch) {
    setMetadata((prev) => ({ ...prev, ...patch }));
  }

  function patchReport(patch) {
    setReport((prev) => ({ ...prev, ...patch }));
  }

  const issues = getValidationIssues(report);
  const canSubmit = issues.length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      onError(`Please complete the following before submitting: ${issues.join(', ')}.`);
      return;
    }

    // eslint-disable-next-line no-unused-vars
    const { withdrawal_time, polyps, ...reportFields } = report;
    const payload = {
      metadata,
      report: {
        ...reportFields,
        polyps: (polyps ?? []).map(sanitizePolyp),
      },
    };

    setSubmitting(true);
    try {
      const result = await apiRequest(`/write?transcript_id=${transcriptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        token,
      });
      if (result.pdf_url) window.open(`${API_ORIGIN}${result.pdf_url}`, '_blank', 'noopener,noreferrer');
      onSubmitted(result);
    } catch (err) {
      onError(err);
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
        Verify the transcribed data, enter the BBPS scores, then finalize to generate the PDF.
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
          disabled={submitting || !canSubmit}
        >
          {submitting ? 'Finalizing…' : 'Finalize Report'}
        </button>
        {!canSubmit && (
          <span className="submit-hint">Missing: {issues.join(', ')}.</span>
        )}
      </div>
    </form>
  );
}
