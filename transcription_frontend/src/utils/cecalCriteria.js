export const CRITERIA_KEYS = [
  'terminal_ileum_intubated',
  'ileocecal_valve_identified',
  'appendiceal_orifice_identified',
  'tripartite_fold_identified',
  'other_landmarks_identified',
];

// At least one of these must hold when cecum_reached is true (mirrors the
// procedures table check constraint: valve + orifice only count as a pair).
export function criteriaSatisfied(report) {
  return (
    report.terminal_ileum_intubated === true ||
    (report.ileocecal_valve_identified === true && report.appendiceal_orifice_identified === true) ||
    report.tripartite_fold_identified === true ||
    report.other_landmarks_identified === true
  );
}
