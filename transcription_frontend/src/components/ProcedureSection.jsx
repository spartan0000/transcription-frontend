export default function ProcedureSection({ report, onChange }) {
  return (
    <section className="form-section">
      <h3>Procedure Details</h3>
      <div className="two-col">
        <div className="field-group">
          <label htmlFor="cecum_reached">Cecum Reached</label>
          <select
            id="cecum_reached"
            value={report.cecum_reached == null ? '' : String(report.cecum_reached)}
            onChange={(e) =>
              onChange({
                cecum_reached: e.target.value === '' ? null : e.target.value === 'true',
              })
            }
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
            type="text"
            placeholder="e.g. 09:14:32"
            value={report.cecum_reached_time ?? ''}
            onChange={(e) => onChange({ cecum_reached_time: e.target.value || null })}
          />
        </div>

        <div className="field-group">
          <label htmlFor="procedure_end_time">Procedure End Time</label>
          <input
            id="procedure_end_time"
            type="text"
            placeholder="e.g. 09:28:45"
            value={report.procedure_end_time ?? ''}
            onChange={(e) => onChange({ procedure_end_time: e.target.value || null })}
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
      </div>
    </section>
  );
}
