const SCORES = [0, 1, 2, 3];
const SEGMENTS = [
  { key: 'bbps_right', label: 'Right Colon' },
  { key: 'bbps_transverse', label: 'Transverse Colon' },
  { key: 'bbps_left', label: 'Left Colon' },
];

export default function BBPSSection({ report, onChange }) {
  const total =
    (report.bbps_right ?? 0) +
    (report.bbps_transverse ?? 0) +
    (report.bbps_left ?? 0);

  const allSelected =
    report.bbps_right != null &&
    report.bbps_transverse != null &&
    report.bbps_left != null;

  return (
    <section className="form-section">
      <h3>Boston Bowel Preparation Scale</h3>
      <div className="bbps-grid">
        {SEGMENTS.map(({ key, label }) => (
          <div key={key} className="field-group">
            <label htmlFor={key}>{label}</label>
            <select
              id={key}
              value={report[key] ?? ''}
              onChange={(e) =>
                onChange({ [key]: e.target.value === '' ? null : Number(e.target.value) })
              }
              required
            >
              <option value="">— select —</option>
              {SCORES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="field-group bbps-total">
          <label>Total Score</label>
          <div className="bbps-total-value" aria-label="BBPS total score">
            {allSelected ? total : '—'}
          </div>
        </div>
      </div>
    </section>
  );
}
