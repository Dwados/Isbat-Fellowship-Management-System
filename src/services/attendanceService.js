import { supabase } from '../lib/supabase';
import { daysAgoISO, todayISO } from '../utils/dates';
import { getMembers } from './membersService';

const ATTENDANCE_SELECT =
  'id, attendance_date, check_in_time, member:members(id, name, phone, course)';

export async function findAttendance(memberId, dateISO = todayISO()) {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, attendance_date, check_in_time')
    .eq('member_id', memberId)
    .eq('attendance_date', dateISO)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function recordAttendance(memberId, dateISO = todayISO()) {
  const existing = await findAttendance(memberId, dateISO);
  if (existing) return { created: false, record: existing };

  const { data, error } = await supabase
    .from('attendance')
    .insert({ member_id: memberId, attendance_date: dateISO })
    .select('id, attendance_date, check_in_time')
    .single();

  if (error) {
    if (error.code === '23505') return { created: false, record: null };
    throw error;
  }
  return { created: true, record: data };
}

export async function getAttendanceForDate(dateISO) {
  const { data, error } = await supabase
    .from('attendance')
    .select(ATTENDANCE_SELECT)
    .eq('attendance_date', dateISO)
    .order('check_in_time', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getRecentCheckIns(limit = 10) {
  const { data, error } = await supabase
    .from('attendance')
    .select(ATTENDANCE_SELECT)
    .eq('attendance_date', todayISO())
    .order('check_in_time', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** Full roster for a date: every member marked attended/missed. */
export async function getRosterForDate(dateISO = todayISO()) {
  const [members, records] = await Promise.all([
    getMembers(),
    getAttendanceForDate(dateISO),
  ]);
  const checkIns = new Map(records.map((r) => [r.member?.id, r.check_in_time]));
  return members.map((m) => ({
    id: m.id,
    name: m.name,
    course: m.course,
    attended: checkIns.has(m.id),
    checkInTime: checkIns.get(m.id) ?? null,
  }));
}

export async function getAttendanceForMember(memberId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, attendance_date, check_in_time')
    .eq('member_id', memberId)
    .order('attendance_date', { ascending: false })
    .order('check_in_time', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function countAttendanceForDate(dateISO) {
  const { count, error } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('attendance_date', dateISO);
  if (error) throw error;
  return count ?? 0;
}

export async function getAttendanceByDay(days = 14) {
  const { data, error } = await supabase.rpc('attendance_by_day', {
    range_start: daysAgoISO(days - 1),
    range_end: todayISO(),
  });
  if (error) throw error;

  const counts = new Map((data ?? []).map((r) => [r.attendance_date, Number(r.check_ins)]));
  const result = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = daysAgoISO(i);
    result.push({ date, count: counts.get(date) ?? 0 });
  }
  return result;
}

export async function getLastMeetings(n = 7) {
  const { data, error } = await supabase.rpc('last_meetings', { meeting_count: n });
  if (error) throw error;
  return (data ?? [])
    .map((r) => ({ date: r.attendance_date, count: Number(r.check_ins) }))
    .reverse();
}


/** Last n Wednesdays (oldest first) with check-in counts (0 when nobody attended). */
export async function getWednesdayMeetings(n = 6) {
  const diff = (new Date().getDay() - 3 + 7) % 7;
  const dates = [];
  for (let i = 0; i < n; i += 1) dates.push(daysAgoISO(diff + i * 7));
  dates.reverse();
  const { data, error } = await supabase.rpc('attendance_by_day', {
    range_start: dates[0],
    range_end: dates[dates.length - 1],
  });
  if (error) throw error;
  const counts = new Map((data ?? []).map((r) => [r.attendance_date, Number(r.check_ins)]));
  return dates.map((date) => ({ date, count: counts.get(date) ?? 0 }));
}
