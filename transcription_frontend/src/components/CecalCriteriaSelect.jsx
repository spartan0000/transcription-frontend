import { useState, useRef, useEffect } from 'react';
import { CRITERIA_KEYS } from '../utils/cecalCriteria.js';

const COMBO_KEYS = ['ileocecal_valve_identified', 'appendiceal_orifice_identified'];

const OPTIONS = [
  { id: 'terminal_ileum_intubated', label: 'Terminal ileum intubated' },
  { id: 'combo', label: 'Ileocecal valve + appendiceal orifice identified', keys: COMBO_KEYS },
  { id: 'ileocecal_valve_identified', label: 'Ileocecal valve identified' },
  { id: 'appendiceal_orifice_identified', label: 'Appendiceal orifice identified' },
  { id: 'tripartite_fold_identified', label: 'Tripartite fold identified' },
  { id: 'other_landmarks_identified', label: 'Other landmarks identified' },
];

function shortLabel(key) {
  return {
    terminal_ileum_intubated: 'terminal ileum',
    ileocecal_valve_identified: 'ileocecal valve',
    appendiceal_orifice_identified: 'appendiceal orifice',
    tripartite_fold_identified: 'tripartite fold',
    other_landmarks_identified: 'other landmarks',
  }[key];
}

export default function CecalCriteriaSelect({ report, onChange, aiDetected }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function isChecked(option) {
    if (option.keys) return option.keys.every((k) => report[k] === true);
    return report[option.id] === true;
  }

  function isAiDetected(option) {
    if (option.keys) return option.keys.every((k) => aiDetected.has(k));
    return aiDetected.has(option.id);
  }

  function toggle(option) {
    if (option.keys) {
      const allOn = option.keys.every((k) => report[k] === true);
      onChange(Object.fromEntries(option.keys.map((k) => [k, allOn ? null : true])));
    } else {
      onChange({ [option.id]: report[option.id] === true ? null : true });
    }
  }

  const selected = CRITERIA_KEYS.filter((k) => report[k] === true);
  const summary =
    selected.length === 0 ? '— none selected —' : selected.map(shortLabel).join(', ');

  return (
    <div className="criteria-select" ref={wrapperRef}>
      <button
        type="button"
        className={`criteria-toggle${selected.length === 0 ? ' criteria-toggle-empty' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="criteria-summary">{summary}</span>
        <span className="criteria-caret">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <ul className="criteria-menu" role="listbox" aria-multiselectable="true">
          {OPTIONS.map((option) => {
            const checked = isChecked(option);
            const ai = isAiDetected(option);
            return (
              <li key={option.id}>
                <label
                  className={
                    'criteria-option' +
                    (checked ? ' criteria-option-checked' : '') +
                    (ai ? ' criteria-option-ai' : '')
                  }
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(option)}
                  />
                  <span>{option.label}</span>
                  {ai && <span className="ai-badge" title="Detected from the dictation">AI</span>}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
