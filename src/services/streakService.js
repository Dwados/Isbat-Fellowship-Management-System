import { getAttendanceForMember, getWednesdayMeetings } from './attendanceService';

/**
 * Consecutive-Wednesday streak, counted backwards from the most recent meeting.
 */
export async function getStreakForMember(memberId) {
  const [history, meetings] = await Promise.all([
    getAttendanceForMember(memberId),
    getWednesdayMeetings(20),
  ]);
  let list = meetings;
  // Ignore this week's Wednesday if nobody has checked in yet
  if (list.length && list[list.length - 1].count === 0) list = list.slice(0, -1);
  const attended = new Set(history.map((h) => h.attendance_date));
  let streak = 0;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (attended.has(list[i].date)) streak += 1;
    else break;
  }
  return streak;
}
