import { getAttendanceForMember, getLastMeetings } from './attendanceService';

/**
 * Consecutive-meeting streak, counted backwards from the most recent meeting.
 * A "meeting" is any date that has at least one check-in.
 */
export async function getStreakForMember(memberId) {
  const [history, meetings] = await Promise.all([
    getAttendanceForMember(memberId),
    getLastMeetings(20),
  ]);
  const attended = new Set(history.map((h) => h.attendance_date));
  let streak = 0;
  for (let i = meetings.length - 1; i >= 0; i -= 1) {
    if (attended.has(meetings[i].date)) streak += 1;
    else break;
  }
  return streak;
}
