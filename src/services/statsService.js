import { isWednesdayToday, lastMeetingDateISO, startOfDayISO } from '../utils/dates';
import { countAttendanceForDate } from './attendanceService';
import { countMembers, countNewMembersSince } from './membersService';

export async function getDashboardStats() {
  const meetingDate = lastMeetingDateISO();
  const isMeetingToday = isWednesdayToday();
  const [attendanceToday, totalMembers, newMembersToday] = await Promise.all([
    countAttendanceForDate(meetingDate),
    countMembers(),
    countNewMembersSince(startOfDayISO(meetingDate)),
  ]);
  return {
    meetingDate,
    isMeetingToday,
    attendanceToday,
    totalMembers,
    newMembersToday,
    missedToday: Math.max(totalMembers - attendanceToday, 0),
  };
}
