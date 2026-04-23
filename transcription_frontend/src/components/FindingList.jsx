const LOCATIONS = [
  'cecum', 'ascending_colon', 'hepatic_flexure', 'transverse_colon',
  'splenic_flexure', 'descending_colon', 'sigmoid_colon', 'rectum', 'anus', 'other',
];

function labelFor(value) {
  return value ? value.replace(/_/g, ' ') : '— select —';
}

export default function FindingList({ findings, onChange }) {
  function updateFinding(index, patch) {
    onChange(findings.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeFinding(index) {
    onChange(findings.filter((_, i) => i !== index));
  }

  function addFinding() {
    onChange([
      ...findings,
      { finding_id: findings.length + 1, description: '', location: null, biopsy_taken: null },
    ]);
  }

  return (
    <section className="form-section">
      <div className="section-header">
        <h3>Other Findings ({findings.length})</h3>
        <button type="button" className="btn btn-add" onClick={addFinding}>+ Add Finding</button>
      </div>

      {findings.length === 0 && (
        <p className="empty-msg">No other findings recorded.</p>
      )}

      {findings.map((finding, i) => (
        <div key={i} className="item-card">
          <div className="item-card-header">
            <span>Finding {finding.finding_id ?? i + 1}</span>
            <button type="button" className="btn btn-remove" onClick={() => removeFinding(i)}>
              Remove
            </button>
          </div>
          <div className="two-col">
            <div className="field-group col-span-2">
              <label htmlFor={`finding-desc-${i}`}>Description</label>
              <input
                id={`finding-desc-${i}`}
                type="text"
                value={finding.description ?? ''}
                onChange={(e) => updateFinding(i, { description: e.target.value || null })}
              />
            </div>

            <div className="field-group">
              <label htmlFor={`finding-loc-${i}`}>Location</label>
              <select
                id={`finding-loc-${i}`}
                value={finding.location ?? ''}
                onChange={(e) => updateFinding(i, { location: e.target.value || null })}
              >
                <option value="">— select —</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>{labelFor(l)}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label htmlFor={`finding-biopsy-${i}`}>Biopsy Taken</label>
              <select
                id={`finding-biopsy-${i}`}
                value={finding.biopsy_taken == null ? '' : String(finding.biopsy_taken)}
                onChange={(e) =>
                  updateFinding(i, {
                    biopsy_taken: e.target.value === '' ? null : e.target.value === 'true',
                  })
                }
              >
                <option value="">— select —</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
