import { useState } from 'react';
import { apiRequest } from '../api.js';
import { API_ORIGIN } from '../apiConfig.js';
import MetadataSection from './MetadataSection.jsx';
import ProcedureSection from './ProcedureSection.jsx';
import BBPSSection from './BBPSSection.jsx';
import PolypList from './PolypList.jsx';
import FindingList from './FindingList.jsx';
import { CRITERIA_KEYS, criteriaSatisfied } from '../utils/cecalCriteria.js';

function getValidationIssues(metadata, report) {
  const issues = [];
  if (!metadata.patient_name) issues.push('Patient name');
  if (!metadata.patient_NHI) issues.push('NHI number');
  if (!metadata.patient_dob) issues.push('Date of birth');
  if (!metadata.procedure_date) issues.push('Procedure date');
  if (metadata.endoscopist_id == null) issues.push('Endoscopist ID');
  if (report.cecum_reached == null) issues.push('Cecum Reached (yes/no)');
  if (report.cecum_reached === true && !report.cecum_reached_time) issues.push('Cecum Reached Time');
  if (report.cecum_reached === true && !criteriaSatisfied(report)) {
    issues.push('At least one cecal intubation criterion');
  }
  if (!report.procedure_end_time) issues.push('Procedure End Time');
  if (
    report.cecum_reached_time &&
    report.procedure_end_time &&
    new Date(report.procedure_end_time) < new Date(report.cecum_reached_time)
  ) {
    issues.push('Procedure End Time must not be before Cecum Reached Time');
  }
  if (
    report.bbps_right == null ||
    report.bbps_transverse == null ||
    report.bbps_left == null
  ) {
    issues.push('All three BBPS segment scores');
  }
  (report.polyps ?? []).forEach((p, i) => {
    if (p.size_mm == null) issues.push(`Polyp ${i + 1} size`);
    if (!p.location) issues.push(`Polyp ${i + 1} location`);
  });
  return issues;
}

// morphology/resection_method are strict enums with no null option in the
// backend schema; omit them entirely rather than send an unset value as null.
// polyp_id is required, but extraction can return it as null — fall back to
// position order.
function sanitizePolyp({ morphology, resection_method, ...rest }, index) {
  const sanitized = { ...rest, polyp_id: rest.polyp_id ?? index + 1 };
  if (morphology != null) sanitized.morphology = morphology;
  if (resection_method != null) sanitized.resection_method = resection_method;
  return sanitized;
}

function sanitizeFinding(finding, index) {
  return { ...finding, finding_id: finding.finding_id ?? index + 1 };
}

// indication is a non-nullable optional string in the final schema — omit
// rather than send null.
function sanitizeMetadata({ indication, ...rest }) {
  const sanitized = { ...rest };
  if (indication != null) sanitized.indication = indication;
  return sanitized;
}

export default function ReportEditor({ token, transcriptId, initialData, extractionFailed, onSubmitted, onError }) {
  const [metadata, setMetadata] = useState(initialData.metadata);
  const [report, setReport] = useState(initialData.report);
  const [submitting, setSubmitting] = useState(false);
  // criteria the LLM extracted as true, frozen at mount so the AI badges don't
  // follow the user's own edits
  const [aiDetected] = useState(
    () => new Set(CRITERIA_KEYS.filter((k) => initialData.report?.[k] === true)),
  );

  function patchMetadata(patch) {
    setMetadata((prev) => ({ ...prev, ...patch }));
  }

  function patchReport(patch) {
    setReport((prev) => ({ ...prev, ...patch }));
  }

  const issues = getValidationIssues(metadata, report);
  const canSubmit = issues.length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      onError(`Please complete the following before submitting: ${issues.join(', ')}.`);
      return;
    }

    // eslint-disable-next-line no-unused-vars
    const { withdrawal_time, polyps, findings, ...reportFields } = report;
    const payload = {
      metadata: sanitizeMetadata(metadata),
      report: {
        ...reportFields,
        // DB constraint: cecum_reached_time must be empty when cecum not reached
        cecum_reached_time: report.cecum_reached === false ? null : report.cecum_reached_time,
        polyps: (polyps ?? []).map(sanitizePolyp),
        findings: (findings ?? []).map(sanitizeFinding),
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
      <ProcedureSection report={report} onChange={patchReport} aiDetected={aiDetected} />
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
