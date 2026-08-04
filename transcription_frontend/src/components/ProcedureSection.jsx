import { toDatetimeLocal, fromDatetimeLocal } from '../utils/datetime.js';
import CecalCriteriaSelect from './CecalCriteriaSelect.jsx';

export default function ProcedureSection({ report, onChange, aiDetected }) {
  const cecumNotReached = report.cecum_reached === false;

  return (
    <section className="form-section">
      <h3>Procedure Details</h3>
      <div className="two-col">
        <div className="field-group">
          <label htmlFor="cecum_reached">Cecum Reached</label>
          <select
            id="cecum_reached"
            value={report.cecum_reached == null ? '' : String(report.cecum_reached)}
            onChange={(e) => {
              const value = e.target.value === '' ? null : e.target.value === 'true';
              // the DB requires cecum_reached_time to be empty when the cecum
              // was not reached
              onChange(value === false
                ? { cecum_reached: false, cecum_reached_time: null }
                : { cecum_reached: value });
            }}
            required
          >
            <option value="">— select —</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="cecum_reached_time">Cecum Reached Time</label>
          <input
            id="cecum_reached_time"
            type="datetime-local"
            step="1"
            value={toDatetimeLocal(report.cecum_reached_time)}
            onChange={(e) => onChange({ cecum_reached_time: fromDatetimeLocal(e.target.value) })}
            disabled={cecumNotReached}
            required={!cecumNotReached}
          />
          {cecumNotReached && (
            <span className="field-note">Not applicable — cecum not reached</span>
          )}
        </div>

        <div className="field-group">
          <label htmlFor="procedure_end_time">Procedure End Time</label>
          <input
            id="procedure_end_time"
            type="datetime-local"
            step="1"
            value={toDatetimeLocal(report.procedure_end_time)}
            onChange={(e) => onChange({ procedure_end_time: fromDatetimeLocal(e.target.value) })}
            required
          />
        </div>

        <div className="field-group">
          <label>Withdrawal Time (min)</label>
          <div className="calculated-value" aria-label="Preliminary withdrawal time in minutes">
            {report.withdrawal_time != null
              ? `${+(report.withdrawal_time / 60).toFixed(2)} min`
              : '—'}
          </div>
          <span className="field-note">Calculated by backend on final submission</span>
        </div>

        <div className="field-group col-span-2">
          <label htmlFor="cecal-criteria">Cecal Intubation Criteria</label>
          <CecalCriteriaSelect report={report} onChange={onChange} aiDetected={aiDetected} />
          <span className="field-note">
            Options detected from the dictation are pre-selected and marked{' '}
            <span className="ai-badge">AI</span>. Select or unselect any that apply.
            {report.cecum_reached === true &&
              ' At least one criterion (terminal ileum, valve + orifice together, tripartite fold, or other) is required when the cecum was reached.'}
          </span>
        </div>
      </div>
    </section>
  );
}
