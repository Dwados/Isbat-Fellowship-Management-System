import { startOfTodayISO, todayISO } from '../utils/dates';
import { countAttendanceForDate } from './attendanceService';
import { countMembers, countNewMembersSince } from './membersService';

export async function getDashboardStats() {
  const [attendanceToday, totalMembers, newMembersToday] = await Promise.all([
    countAttendanceForDate(todayISO()),
    countMembers(),
    countNewMembersSince(startOfTodayISO()),
  ]);
  return {
    attendanceToday,
    totalMembers,
    newMembersToday,
    missedToday: Math.max(totalMembers - attendanceToday, 0),
  };
}
