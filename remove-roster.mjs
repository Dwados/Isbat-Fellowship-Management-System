// remove-roster.mjs — removes the attended/missed list from the student check-in page
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/pages/CheckInPage.jsx';
const content = readFileSync(file, 'utf8');
const lines = content.split('\n');
const filtered = lines.filter((line) => !line.includes('<TodayRoster'));
writeFileSync(file, filtered.join('\n'));
console.log('Done! The student check-in page now shows only the sign-in (no member list).');