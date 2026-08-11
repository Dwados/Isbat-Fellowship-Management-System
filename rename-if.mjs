// rename-if.mjs — rebrand the app to "IF Management System"
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const edits = {
  'index.html': [
    ['<title>Fellowship Attendance</title>', '<title>IF Management System</title>'],
  ],
  'src/components/Layout.jsx': [
    ['Fellowship Attendance', 'IF Management System'],   // mobile header
    ['>Fellowship</span>', '>IF Management</span>'],      // sidebar line 1
    ['>Attendance</span>', '>System</span>'],             // sidebar line 2
  ],
  'src/pages/KioskPage.jsx': [
    ['Fellowship Attendance', 'IF Management System'],    // kiosk eyebrow text
  ],
  'src/pages/CheckInPage.jsx': [
    ['Fellowship\n', 'IF Management\n'],                  // check-in header word
  ],
  'src/components/AdminGate.jsx': [
    ['fellowship admins', 'IF admins'],                   // admin sign-in wording
  ],
};

let total = 0;
for (const [file, pairs] of Object.entries(edits)) {
  if (!existsSync(file)) { console.log('MISSING:', file); continue; }
  let content = readFileSync(file, 'utf8');
  let changed = 0;
  for (const [from, to] of pairs) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed++;
    } else {
      console.log('  (not found in ' + file + ': "' + from.slice(0, 28) + '...")');
    }
  }
  writeFileSync(file, content);
  console.log((changed ? 'UPDATED  ' : 'NO CHANGE') + ' ' + file + '  (' + changed + ' edits)');
  total += changed;
}
console.log('\nDone! ' + total + ' replacements applied.');
console.log('Hard-refresh the browser (Ctrl+Shift+R) to see the new name.');