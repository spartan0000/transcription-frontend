function calculateAge(dob, procedureDate) {
  if (!dob || !procedureDate) return null;
  const birth = new Date(dob);
  const procedure = new Date(procedureDate);
  if (isNaN(birth) || isNaN(procedure)) return null;
  let age = procedure.getFullYear() - birth.getFullYear();
  const monthDiff = procedure.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && procedure.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

export default function MetadataSection({ metadata, onChange }) {
  const age = calculateAge(metadata.patient_dob, metadata.procedure_date);

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
          <label htmlFor="patient_dob">Date of Birth</label>
          <input
            id="patient_dob"
            type="date"
            value={metadata.patient_dob ?? ''}
            onChange={(e) => onChange({ patient_dob: e.target.value || null })}
            required
          />
        </div>

        <div className="field-group">
          <label>Age at Procedure</label>
          <div className="calculated-value" aria-label="Patient age at time of procedure">
            {age != null ? `${age} years` : '—'}
          </div>
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
            required
          />
        </div>

        <div className="field-group col-span-2">
          <label htmlFor="indication">Indication</label>
          <input
            id="indication"
            type="text"
            value={metadata.indication ?? ''}
            onChange={(e) => onChange({ indication: e.target.value })}
            required
          />
        </div>
      </div>
    </section>
  );
}
