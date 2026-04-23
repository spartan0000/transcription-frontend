const LOCATIONS = [
  'cecum', 'ascending_colon', 'hepatic_flexure', 'transverse_colon',
  'splenic_flexure', 'descending_colon', 'sigmoid_colon', 'rectum', 'anus', 'other',
];
const MORPHOLOGIES = ['sessile', 'pedunculated', 'semi_pedunculated', 'flat', 'other'];
const RESECTION_METHODS = ['snare', 'cold_snare', 'hot_snare', 'biopsy_forceps', 'lift_and_resect', 'other'];

function labelFor(value) {
  return value ? value.replace(/_/g, ' ') : '— select —';
}

function SelectField({ id, label, value, options, onChange }) {
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">— select —</option>
        {options.map((o) => (
          <option key={o} value={o}>{labelFor(o)}</option>
        ))}
      </select>
    </div>
  );
}

export default function PolypList({ polyps, onChange }) {
  function updatePolyp(index, patch) {
    const updated = polyps.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange(updated);
  }

  function removePolyp(index) {
    onChange(polyps.filter((_, i) => i !== index));
  }

  function addPolyp() {
    onChange([
      ...polyps,
      {
        polyp_id: polyps.length + 1,
        size_mm: 0,
        location: null,
        morphology: null,
        resection_method: null,
        resection_complete: null,
        retrieved: null,
      },
    ]);
  }

  return (
    <section className="form-section">
      <div className="section-header">
        <h3>Polyps ({polyps.length})</h3>
        <button type="button" className="btn btn-add" onClick={addPolyp}>+ Add Polyp</button>
      </div>

      {polyps.length === 0 && (
        <p className="empty-msg">No polyps recorded.</p>
      )}

      {polyps.map((polyp, i) => (
        <div key={i} className="item-card">
          <div className="item-card-header">
            <span>Polyp {polyp.polyp_id ?? i + 1}</span>
            <button
              type="button"
              className="btn btn-remove"
              onClick={() => removePolyp(i)}
            >
              Remove
            </button>
          </div>
          <div className="two-col">
            <div className="field-group">
              <label htmlFor={`polyp-size-${i}`}>Size (mm)</label>
              <input
                id={`polyp-size-${i}`}
                type="number"
                min="0"
                step="0.1"
                value={polyp.size_mm ?? ''}
                onChange={(e) =>
                  updatePolyp(i, { size_mm: e.target.value === '' ? 0 : Number(e.target.value) })
                }
              />
            </div>

            <SelectField
              id={`polyp-loc-${i}`}
              label="Location"
              value={polyp.location}
              options={LOCATIONS}
              onChange={(v) => updatePolyp(i, { location: v })}
            />

            <SelectField
              id={`polyp-morph-${i}`}
              label="Morphology"
              value={polyp.morphology}
              options={MORPHOLOGIES}
              onChange={(v) => updatePolyp(i, { morphology: v })}
            />

            <SelectField
              id={`polyp-resect-${i}`}
              label="Resection Method"
              value={polyp.resection_method}
              options={RESECTION_METHODS}
              onChange={(v) => updatePolyp(i, { resection_method: v })}
            />

            <div className="field-group">
              <label htmlFor={`polyp-complete-${i}`}>Resection Complete</label>
              <select
                id={`polyp-complete-${i}`}
                value={polyp.resection_complete == null ? '' : String(polyp.resection_complete)}
                onChange={(e) =>
                  updatePolyp(i, {
                    resection_complete: e.target.value === '' ? null : e.target.value === 'true',
                  })
                }
              >
                <option value="">— select —</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="field-group">
              <label htmlFor={`polyp-retrieved-${i}`}>Retrieved</label>
              <select
                id={`polyp-retrieved-${i}`}
                value={polyp.retrieved == null ? '' : String(polyp.retrieved)}
                onChange={(e) =>
                  updatePolyp(i, {
                    retrieved: e.target.value === '' ? null : e.target.value === 'true',
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
