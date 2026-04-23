export default function MetadataSection({ metadata, onChange }) {
  return (
    <section className="form-section">
      <h3>Patient &amp; Procedure Details</h3>
      <div className="two-col">
        <div className="field-group">
          <label htmlFor="patient_name">Patient Name</label>
          <input
            id="patient_name"
            type="text"
            value={metadata.patient_name ?? ''}
            onChange={(e) => onChange({ patient_name: e.target.value })}
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="patient_NHI">NHI Number</label>
          <input
            id="patient_NHI"
            type="text"
            value={metadata.patient_NHI ?? ''}
            onChange={(e) => onChange({ patient_NHI: e.target.value })}
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="procedure_date">Procedure Date</label>
          <input
            id="procedure_date"
            type="date"
            value={metadata.procedure_date ?? ''}
            onChange={(e) => onChange({ procedure_date: e.target.value })}
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="endoscopist_id">Endoscopist ID</label>
          <input
            id="endoscopist_id"
            type="number"
            value={metadata.endoscopist_id ?? ''}
            onChange={(e) =>
              onChange({ endoscopist_id: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
        </div>
      </div>
    </section>
  );
}
