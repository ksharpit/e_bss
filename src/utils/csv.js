// ============================================
// CSV Export Utility
// ============================================

function escapeCell(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function downloadCsv(filenamePrefix, headers, rows) {
  const lines = [headers.map(escapeCell).join(',')];
  rows.forEach(row => lines.push(row.map(escapeCell).join(',')));
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export multi-section CSV (sections separated by blank rows + title)
 * @param {string} filenamePrefix
 * @param {{ title: string, headers: string[], rows: any[][] }[]} sections
 */
export function downloadMultiSectionCsv(filenamePrefix, sections) {
  const lines = [];
  sections.forEach((section, idx) => {
    if (idx > 0) lines.push('', '');
    lines.push(escapeCell('--- ' + section.title + ' ---'));
    lines.push(section.headers.map(escapeCell).join(','));
    section.rows.forEach(row => lines.push(row.map(escapeCell).join(',')));
  });
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
