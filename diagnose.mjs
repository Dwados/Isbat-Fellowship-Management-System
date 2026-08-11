// diagnose.mjs — finds out exactly why the dashboard is empty
import { existsSync, readFileSync } from 'node:fs';

console.log('=== DIAGNOSIS — Fellowship Attendance ===');
console.log('Node:', process.version);
console.log('Folder:', process.cwd());

if (!existsSync('package.json')) {
  console.log('WRONG FOLDER : no package.json here — cd into fellowship-attendance first!');
  process.exit(0);
}

// 1. Are the right files in place?
const checks = [
  ['src/pages/DashboardPage.jsx', 'MeetingTrendCard'],
  ['src/pages/DashboardPage.jsx', 'RosterCard'],
  ['src/components/RosterCard.jsx', 'getRosterForDate'],
  ['src/components/AdminGate.jsx', 'VITE_ADMIN_PASSWORD'],
  ['src/services/statsService.js', 'missedToday'],
  ['src/App.jsx', 'AdminGate'],
];
for (const [file, marker] of checks) {
  if (!existsSync(file)) { console.log('MISSING FILE : ' + file); continue; }
  const okFile = readFileSync(file, 'utf8').includes(marker);
  console.log((okFile ? 'OK FILE      : ' : 'OUTDATED FILE: ') + file + (okFile ? '' : '  (missing "' + marker + '")'));
}

// 2. Is .env configured?
let URL_ = '';
let KEY_ = '';
if (!existsSync('.env')) {
  console.log('MISSING FILE : .env');
} else {
  const env = {};
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
  URL_ = env.VITE_SUPABASE_URL || '';
  KEY_ = env.VITE_SUPABASE_ANON_KEY || '';
  console.log(URL_ ? 'OK ENV       : VITE_SUPABASE_URL = ' + URL_.slice(0, 34) + '...' : 'MISSING ENV  : VITE_SUPABASE_URL');
  console.log(KEY_ ? 'OK ENV       : anon key present (' + KEY_.length + ' chars)' : 'MISSING ENV  : VITE_SUPABASE_ANON_KEY');
  if (URL_.includes('your-project-ref') || KEY_.includes('your-anon')) {
    console.log('WARNING      : .env still has PLACEHOLDER values — replace them!');
  }
  console.log(env.VITE_ADMIN_PASSWORD ? 'OK ENV       : admin password set' : 'NOTE         : no VITE_ADMIN_PASSWORD in .env');
}

// 3. Can we reach the database, and does it have data?
if (URL_ && KEY_) {
  const sb = async (path, headers = {}) => fetch(URL_ + '/rest/v1/' + path, {
    headers: { apikey: KEY_, Authorization: 'Bearer ' + KEY_, ...headers },
  });
  const total = (r) => {
    const cr = r.headers.get('content-range');
    return cr ? cr.split('/')[1] : '?';
  };
  try {
    const m = await sb('members?select=id', { Prefer: 'count=exact', Range: '0-0' });
    if (m.ok) console.log('OK DB        : members rows = ' + total(m));
    else console.log('DB ERROR     : members -> ' + m.status + ' ' + (await m.text()).slice(0, 180));

    const d = new Date();
    const today = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const a = await sb('attendance?select=id&attendance_date=eq.' + today, { Prefer: 'count=exact', Range: '0-0' });
    if (a.ok) console.log('OK DB        : today attendance rows = ' + total(a));
    else console.log('DB ERROR     : attendance -> ' + a.status);

    const rpc = await sb('rpc/last_meetings?meeting_count=7');
    if (rpc.ok) console.log('OK DB        : last_meetings RPC works (' + (await rpc.json()).length + ' meetings found)');
    else console.log('DB ERROR     : last_meetings RPC -> ' + rpc.status + '  (schema.sql probably not fully run)');
  } catch (e) {
    console.log('NETWORK ERROR: ' + e.message + '  (check the URL, or your internet)');
  }
} else {
  console.log('SKIPPED DB   : no env values to test with');
}

console.log('=== END — paste everything above into the chat ===');