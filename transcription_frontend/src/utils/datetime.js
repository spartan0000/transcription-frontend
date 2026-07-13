export function toDatetimeLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d)) return '';
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffset).toISOString().slice(0, 19);
}

export function fromDatetimeLocal(datetimeLocalStr) {
  if (!datetimeLocalStr) return null;
  const d = new Date(datetimeLocalStr);
  const offsetMins = -d.getTimezoneOffset();
  const sign = offsetMins >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMins);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${datetimeLocalStr}${sign}${hh}:${mm}`;
}

export function nowAsDatetimeLocal() {
  return toDatetimeLocal(new Date());
}
