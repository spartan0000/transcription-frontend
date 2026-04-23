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
          <label htmlFor="withdrawal_time">Withdrawal Time (min)</label>
          <input
            id="withdrawal_time"
            type="number"
            min="0"
            step="0.1"
            value={report.withdrawal_time ?? ''}
            onChange={(e) =>
              onChange({ withdrawal_time: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
        </div>
      </div>
    </section>
  );
}
