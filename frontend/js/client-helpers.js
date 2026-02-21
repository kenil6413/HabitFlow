function startOfDay(date) {
  if (typeof date === 'string') {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
    if (dateOnly) {
      const year = Number(dateOnly[1]);
      const month = Number(dateOnly[2]) - 1;
      const day = Number(dateOnly[3]);
      return new Date(year, month, day);
    }
  }

  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function toDateKey(date) {
  if (typeof date === 'string') {
    const isoPrefix = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(date.trim());
    if (isoPrefix) {
      return `${isoPrefix[1]}-${isoPrefix[2]}-${isoPrefix[3]}`;
    }
  }

  const d = startOfDay(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(dateA, dateB) {
  return toDateKey(dateA) === toDateKey(dateB);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseMongoId(raw) {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && typeof raw.toHexString === 'function') {
    return raw.toHexString();
  }
  if (typeof raw === 'object' && typeof raw.toString === 'function') {
    const asText = raw.toString();
    if (asText && asText !== '[object Object]') return asText;
  }
  if (typeof raw === 'object' && raw.$oid) return raw.$oid;
  if (
    typeof raw === 'object' &&
    raw.id &&
    Array.isArray(raw.id.data) &&
    raw.id.data.length === 12
  ) {
    return raw.id.data.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return String(raw);
}

export { startOfDay, toDateKey, isSameDay, escapeHtml, parseMongoId };
