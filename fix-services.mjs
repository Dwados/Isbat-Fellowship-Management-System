// fix-services.mjs — creates the two missing files (streak + sound)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const files = {

'src/services/streakService.js': `
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
`,

'src/utils/sound.js': `
let audioCtx = null;

/** Soft three-note success chime (synthesized — no audio file needed). */
export function playSuccessChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch (e) {
    // sound is a nice-to-have; never block the check-in flow
  }
}
`,

};

for (const [filePath, content] of Object.entries(files)) {
  const full = join(process.cwd(), filePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content.startsWith('\n') ? content.slice(1) : content);
  console.log('created', filePath);
}
console.log('');
console.log('Done! Vite should recover automatically — if not, restart the dev server.');