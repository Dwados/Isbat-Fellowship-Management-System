import { format, parseISO } from 'date-fns';

export function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** Absolute instant of local midnight for a given YYYY-MM-DD date. */
export function startOfDayISO(dateISO) {
  const d = new Date(dateISO + 'T00:00:00');
  return d.toISOString();
}

export function isWednesdayToday() {
  return new Date().getDay() === 3;
}

/** Today if today is Wednesday, otherwise the most recent past Wednesday. */
export function lastMeetingDateISO() {
  const diff = (new Date().getDay() - 3 + 7) % 7;
  return daysAgoISO(diff);
}

export function formatDate(isoDate) {
  if (!isoDate) return '—';
  return format(parseISO(isoDate), 'EEE, MMM d, yyyy');
}

export function formatDateShort(isoDate) {
  if (!isoDate) return '';
  return format(parseISO(isoDate), 'MMM d');
}

export function formatTime(isoDateTime) {
  if (!isoDateTime) return '—';
  return format(new Date(isoDateTime), 'h:mm a');
}
