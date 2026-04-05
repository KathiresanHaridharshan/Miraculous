// Utility functions
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

/** Format a Firestore Timestamp or Date or string to a display string */
export function formatDate(date, fmt = 'dd MMM yyyy') {
  if (!date) return '—';
  let d;
  if (date?.toDate) d = date.toDate();
  else if (typeof date === 'string') d = parseISO(date);
  else d = new Date(date);
  return format(d, fmt);
}

export function formatRelative(date) {
  if (!date) return '';
  let d;
  if (date?.toDate) d = date.toDate();
  else if (typeof date === 'string') d = parseISO(date);
  else d = new Date(date);
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatCurrency(amount, symbol = '₹') {
  if (amount == null) return `${symbol}0`;
  return `${symbol}${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatPercent(value, total) {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export function isDateToday(date) {
  if (!date) return false;
  let d;
  if (date?.toDate) d = date.toDate();
  else if (typeof date === 'string') d = parseISO(date);
  else d = new Date(date);
  return isToday(d);
}

export function isDatePast(date) {
  if (!date) return false;
  let d;
  if (date?.toDate) d = date.toDate();
  else if (typeof date === 'string') d = parseISO(date);
  else d = new Date(date);
  return isPast(d);
}

/** Convert seconds to HH:MM:SS or MM:SS */
export function secsToDisplay(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Convert seconds to hours (float) */
export function secsToHours(seconds) {
  return Math.round((seconds / 3600) * 100) / 100;
}

/** Get goal status color */
export function getStatusColor(status) {
  const colors = {
    active: 'var(--color-primary)',
    completed: 'var(--color-accent)',
    paused: 'var(--color-warning)',
    missed: 'var(--color-danger)',
  };
  return colors[status] || 'var(--text-muted)';
}

/** Get status badge css class */
export function getStatusBadgeClass(status) {
  const classes = {
    active: 'badge-primary',
    completed: 'badge-success',
    paused: 'badge-warning',
    missed: 'badge-danger',
    pending: 'badge-muted',
  };
  return classes[status] || 'badge-muted';
}

/** Get priority badge class */
export function getPriorityBadgeClass(priority) {
  const classes = {
    high: 'badge-danger',
    medium: 'badge-warning',
    low: 'badge-success',
  };
  return classes[priority] || 'badge-muted';
}

/** Calculate goal progress percentage */
export function calcProgress(current, target) {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

/** Generate initials from name */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Get current month key "yyyy-MM" */
export function getCurrentMonthKey() {
  return format(new Date(), 'yyyy-MM');
}

/** Truncate text */
export function truncate(str, length = 60) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '…' : str;
}

/** Group array of objects by a key */
export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const val = item[key];
    if (!acc[val]) acc[val] = [];
    acc[val].push(item);
    return acc;
  }, {});
}

/** Export data as CSV */
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}
