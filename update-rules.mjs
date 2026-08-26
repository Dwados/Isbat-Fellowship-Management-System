// update-rules.mjs — Adds Wednesday lock + Semester requirements
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const files = {

'src/services/membersService.js': `
import { supabase } from '../lib/supabase';
import { normalizePhone } from '../utils/phone';

export async function findMemberByPhone(phone) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('phone', normalizePhone(phone))
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMembers(search = '') {
  const q = search.trim().replace(/[%,()]/g, '');
  let query = supabase.from('members').select('*').order('name', { ascending: true });
  if (q) query = query.or('name.ilike.%' + q + '%,phone.ilike.%' + q + '%');
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getMemberById(id) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMember({ name, phone, email, course, semester }) {
  const { data, error } = await supabase
    .from('members')
    .insert({
      name: name.trim(),
      phone: normalizePhone(phone),
      email: email?.trim() || null,
      course: course?.trim() || null,
      semester: semester?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMemberSemester(id, semester) {
  const { data, error } = await supabase
    .from('members')
    .update({ semester: semester.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function countMembers() {
  const { count, error } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function countNewMembersSince(isoDateTime) {
  const { count, error } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', isoDateTime);
  if (error) throw error;
  return count ?? 0;
}
`,

'src/hooks/useCheckIn.js': `
import { useCallback, useState } from 'react';
import { recordAttendance } from '../services/attendanceService';
import { createMember, findMemberByPhone, updateMemberSemester } from '../services/membersService';
import { friendlyError } from '../utils/errors';
import { normalizePhone } from '../utils/phone';

export function useCheckIn() {
  const [step, setStep] = useState('phone');
  const [member, setMember] = useState(null);
  const [record, setRecord] = useState(null);
  const [prefillPhone, setPrefillPhone] = useState('');
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setStep('phone');
    setMember(null);
    setRecord(null);
    setPrefillPhone('');
    setError(null);
  }, []);

  const submitPhone = useCallback(async (rawPhone) => {
    setError(null);
    setStep('checking');
    try {
      const found = await findMemberByPhone(rawPhone);
      if (!found) {
        setPrefillPhone(normalizePhone(rawPhone));
        setStep('not-found');
        return;
      }
      setMember(found);
      
      // NEW: If member exists but has no semester, force update
      if (!found.semester) {
        setStep('update-semester');
        return;
      }

      const result = await recordAttendance(found.id);
      setRecord(result.record);
      setStep(result.created ? 'welcome' : 'already');
    } catch (err) {
      setError(friendlyError(err));
      setStep('error');
    }
  }, []);

  const submitSemester = useCallback(async (semesterValue) => {
    setError(null);
    setStep('updating-semester');
    try {
      const updated = await updateMemberSemester(member.id, semesterValue);
      setMember(updated);
      const result = await recordAttendance(updated.id);
      setRecord(result.record);
      setStep(result.created ? 'welcome' : 'already');
    } catch (err) {
      setError(friendlyError(err));
      setStep('update-semester');
    }
  }, [member]);

  const openRegistration = useCallback(() => {
    setError(null);
    setStep('register');
  }, []);

  const submitRegistration = useCallback(async (form) => {
    setError(null);
    setStep('registering');
    try {
      const created = await createMember(form);
      const result = await recordAttendance(created.id);
      setMember(created);
      setRecord(result.record);
      setStep('registered');
    } catch (err) {
      if (err?.code === '23505') {
        setError('That phone number is already registered. Go back and check in with it instead.');
      } else {
        setError(friendlyError(err));
      }
      setStep('register');
    }
  }, []);

  return {
    step, member, record, prefillPhone, error,
    reset, submitPhone, submitSemester, openRegistration, submitRegistration,
  };
}
`,

'src/pages/CheckInPage.jsx': `
import {
  ArrowLeft, CalendarX, CheckCircle2, Clock3, Phone, QrCode, UserCheck, UserPlus, Users, UserX, XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import Avatar from '../components/Avatar';
import ConfigBanner from '../components/ConfigBanner';
import LoadingBlock from '../components/LoadingBlock';
import Spinner from '../components/Spinner';
import { useCheckIn } from '../hooks/useCheckIn';
import { getRosterForDate } from '../services/attendanceService';
import { getStreakForMember } from '../services/streakService';
import { formatTime } from '../utils/dates';
import { friendlyError } from '../utils/errors';
import { isValidPhone } from '../utils/phone';
import { getRememberedMember, saveRememberedMember } from '../utils/remember';
import { playSuccessChime } from '../utils/sound';

const TONES = {
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-rose-100 text-rose-600',
};

const AUTO_RESET_SECONDS = 8;
const DONE_STEPS = ['welcome', 'already', 'registered', 'error'];

// Allow ?force=true in URL to bypass Wednesday lock for testing
const isWednesday = new Date().getDay() === 3 || new URLSearchParams(window.location.search).get('force') === 'true';

/* ---------- Wednesday Lock Screen ---------- */
function ClosedScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="card max-w-md p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <CalendarX className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-stone-900">Check-in is closed today</h1>
        <p className="mt-3 text-stone-600">
          Fellowship attendance is only recorded on <strong className="text-brand-700">Wednesdays</strong>.
        </p>
        <p className="mt-2 text-sm text-stone-400">
          Please return on Wednesday to check in.
        </p>
        <Link to="/" className="btn-secondary mt-6 w-full">Back to Kiosk</Link>
      </div>
    </div>
  );
}

/* ---------- Today's roster: attended vs missed ---------- */
function TodayRoster({ refreshToken }) {
  const [roster, setRoster] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('attended');

  useEffect(() => {
    let active = true;
    getRosterForDate()
      .then((data) => active && setRoster(data))
      .catch((err) => active && setError(friendlyError(err)));
    return () => { active = false; };
  }, [refreshToken]);

  if (error) return <Alert variant="error" className="mt-6">{error}</Alert>;
  if (!roster) return <div className="mt-6"><LoadingBlock label="Loading members…" /></div>;

  const attended = roster.filter((m) => m.attended);
  const missed = roster.filter((m) => !m.attended);
  const shown = tab === 'attended' ? attended : missed;

  return (
    <section className="card mt-6 overflow-hidden">
      <header className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
        <h3 className="flex items-center gap-2 font-semibold text-stone-900">
          <Users className="h-4 w-4 text-brand-600" /> Today's attendance
        </h3>
        <span className="text-xs text-stone-400">
          {attended.length} attended · {missed.length} missed
        </span>
      </header>

      <div className="grid grid-cols-2 border-b border-stone-200 text-sm font-medium">
        <button
          type="button"
          onClick={() => setTab('attended')}
          className={'flex items-center justify-center gap-2 border-b-2 py-3 transition-colors ' +
            (tab === 'attended' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-transparent text-stone-500 hover:text-stone-700')}
        >
          <UserCheck className="h-4 w-4" /> Attended ({attended.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('missed')}
          className={'flex items-center justify-center gap-2 border-b-2 py-3 transition-colors ' +
            (tab === 'missed' ? 'border-red-500 bg-red-50 text-red-700' : 'border-transparent text-stone-500 hover:text-stone-700')}
        >
          <UserX className="h-4 w-4" /> Missed ({missed.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-stone-400">
          {tab === 'attended' ? 'No one has checked in yet.' : 'Everyone has checked in. 🎉'}
        </p>
      ) : (
        <ul className="max-h-72 divide-y divide-stone-100 overflow-y-auto">
          {shown.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar name={m.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{m.name}</p>
                {m.course && <p className="truncate text-xs text-stone-400">{m.course}</p>}
              </div>
              {m.attended ? (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> {formatTime(m.checkInTime)}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                  Missed
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Result card ---------- */
function ResultCard({ tone = 'success', icon: Icon, title, message, meta, streak = 0, autoResetIn = null, onDone, doneLabel = 'Done' }) {
  const isSuccess = tone === 'success';
  return (
    <div className="card p-8 text-center">
      <div className="relative mx-auto h-16 w-16">
        {isSuccess && (
          <>
            <span className="success-ring" />
            <span className="success-ring success-ring-delay" />
          </>
        )}
        <div className={'relative flex h-16 w-16 items-center justify-center rounded-full ' + TONES[tone] + (isSuccess ? ' animate-pop' : '')}>
          <Icon className="h-8 w-8" />
        </div>
      </div>

      <h2 className="mt-5 text-xl font-bold text-stone-900">{title}</h2>
      {message && <p className="mt-2 text-stone-600">{message}</p>}

      {streak >= 2 && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1.5 text-sm font-semibold text-amber-700">
          🔥 {streak} meetings in a row — keep it up!
        </p>
      )}

      {meta && <p className="mt-2 text-sm text-stone-400">{meta}</p>}

      <button type="button" onClick={onDone} className="btn-primary mt-7 w-full py-3">
        {doneLabel}
      </button>

      {autoResetIn !== null && (
        <p className="mt-3 text-xs text-stone-400">
          Screen resets automatically in {autoResetIn}s
        </p>
      )}
    </div>
  );
}

function buildMeta(member, record) {
  const parts = [];
  if (member?.course) parts.push(member.course);
  if (member?.semester) parts.push(member.semester);
  if (record?.check_in_time) parts.push('Checked in at ' + formatTime(record.check_in_time));
  return parts.length ? parts.join(' · ') : null;
}

/* ---------- Quick Check-in (Remember me) ---------- */
function QuickCheckIn({ remembered, onCheckIn, onSwitch }) {
  const firstName = remembered.name.split(' ')[0];
  return (
    <div className="card p-6 sm:p-8 text-center">
      <div className="mx-auto flex justify-center">
        <Avatar name={remembered.name} size="lg" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-stone-900">Welcome back!</h2>
      <p className="mt-1 text-sm text-stone-500">Is this you?</p>
      <p className="mt-3 text-lg font-semibold text-stone-900">{remembered.name}</p>
      <p className="text-sm text-stone-400">{remembered.phone}</p>

      <button type="button" onClick={onCheckIn} className="btn-primary mt-6 w-full py-3 text-base">
        <CheckCircle2 className="h-4 w-4" /> Check in as {firstName}
      </button>
      <button type="button" onClick={onSwitch} className="btn-secondary mt-3 w-full">
        Use a different number
      </button>
    </div>
  );
}

/* ---------- Flow steps ---------- */
function PhoneStep({ onSubmit }) {
  const [phone, setPhone] = useState('');
  const [fieldError, setFieldError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setFieldError('Please enter a valid phone number (10–15 digits).');
      return;
    }
    setFieldError('');
    onSubmit(phone);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        <Phone className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-center text-xl font-bold text-stone-900">Check in</h2>
      <p className="mt-1 text-center text-sm text-stone-500">
        Enter the phone number you registered with.
      </p>

      <div className="mt-6">
        <label className="label" htmlFor="phone">Phone number</label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          autoFocus
          placeholder="e.g. +234 803 111 0007"
          className="input py-3 text-base"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (fieldError) setFieldError('');
          }}
        />
        {fieldError && <p className="mt-2 text-sm text-red-600" role="alert">{fieldError}</p>}
      </div>

      <button type="submit" className="btn-primary mt-6 w-full py-3 text-base">Check in</button>
    </form>
  );
}

function CheckingCard() {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <Spinner className="h-8 w-8 text-brand-600" />
      <p className="text-sm font-medium text-stone-600">Looking you up…</p>
    </div>
  );
}

function NotFoundCard({ onRegister, onRetry }) {
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <UserX className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-stone-900">
        We couldn't find your phone number.
      </h2>
      <p className="mt-2 text-stone-600">
        Looks like you're new here — register below and you'll be checked in right away.
      </p>
      <button type="button" onClick={onRegister} className="btn-primary mt-7 w-full py-3">
        <UserPlus className="h-4 w-4" /> Register now
      </button>
      <button type="button" onClick={onRetry} className="btn-secondary mt-3 w-full">
        Try another number
      </button>
    </div>
  );
}

/* ---------- NEW: Update Semester Step ---------- */
function UpdateSemesterStep({ member, submitting, onSubmit }) {
  const [semester, setSemester] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!semester) { setError('Please select your semester.'); return; }
    onSubmit(semester);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <UserCheck className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-center text-xl font-bold text-stone-900">Update Profile</h2>
      <p className="mt-1 text-center text-sm text-stone-500">
        Hi {member?.name?.split(' ')[0]}, please select your semester to continue.
      </p>

      <div className="mt-6">
        <label className="label" htmlFor="update-semester">Semester</label>
        <select id="update-semester" className="input" value={semester} onChange={(e) => { setSemester(e.target.value); setError(''); }} disabled={submitting}>
          <option value="">Select semester...</option>
          {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={'Semester ' + n}>{'Semester ' + n}</option>)}
        </select>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>

      <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full py-3 text-base">
        {submitting ? (<><Spinner className="h-4 w-4" /> Updating…</>) : 'Continue & check in'}
      </button>
    </form>
  );
}

function RegisterStep({ prefillPhone, submitting, serverError, onSubmit, onBack }) {
  const [form, setForm] = useState({ name: '', phone: prefillPhone ?? '', email: '', course: '', semester: '' });
  const [errors, setErrors] = useState({});

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Please enter your full name.';
    if (!isValidPhone(form.phone)) nextErrors.phone = 'Enter a valid phone number (10–15 digits).';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.semester) nextErrors.semester = 'Please select your semester.';
    
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <UserPlus className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-center text-xl font-bold text-stone-900">Register</h2>
      <p className="mt-1 text-center text-sm text-stone-500">
        Join the fellowship — it only takes a few seconds.
      </p>

      {serverError && <Alert variant="error" className="mt-5">{serverError}</Alert>}

      <div className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="reg-name">Full name</label>
          <input id="reg-name" className="input" placeholder="e.g. Ada Obi"
            value={form.name} onChange={setField('name')} disabled={submitting} />
          {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor="reg-phone">Phone number</label>
          <input id="reg-phone" type="tel" inputMode="tel" className="input"
            value={form.phone} onChange={setField('phone')} disabled={submitting} />
          {errors.phone && <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <label className="label" htmlFor="reg-email">
            Email <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <input id="reg-email" type="email" className="input" placeholder="you@example.com"
            value={form.email} onChange={setField('email')} disabled={submitting} />
          {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label className="label" htmlFor="reg-course">
            Course <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <input id="reg-course" className="input" placeholder="e.g. Computer Science"
            value={form.course} onChange={setField('course')} disabled={submitting} />
        </div>
        <div>
          <label className="label" htmlFor="reg-semester">Semester</label>
          <select id="reg-semester" className="input" value={form.semester} onChange={setField('semester')} disabled={submitting}>
            <option value="">Select semester...</option>
            {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={'Semester ' + n}>{'Semester ' + n}</option>)}
          </select>
          {errors.semester && <p className="mt-1.5 text-sm text-red-600">{errors.semester}</p>}
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full py-3 text-base">
        {submitting ? (<><Spinner className="h-4 w-4" /> Registering…</>) : 'Register & check in'}
      </button>
      <button type="button" onClick={onBack} disabled={submitting} className="btn-secondary mt-3 w-full">
        Back
      </button>
    </form>
  );
}

/* ---------- Page ---------- */
export default function CheckInPage() {
  const flow = useCheckIn();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RESET_SECONDS);
  const [streak, setStreak] = useState(0);
  const [remembered, setRemembered] = useState(() => getRememberedMember());
  const [manualMode, setManualMode] = useState(false);

  // Block access if not Wednesday
  if (!isWednesday) {
    return <ClosedScreen />;
  }

  // Countdown while a final screen is showing
  useEffect(() => {
    if (DONE_STEPS.indexOf(flow.step) === -1) return undefined;
    setSecondsLeft(AUTO_RESET_SECONDS);
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [flow.step]);

  // Auto-reset when the countdown hits zero
  useEffect(() => {
    if (secondsLeft === 0 && DONE_STEPS.indexOf(flow.step) !== -1) flow.reset();
  }, [secondsLeft, flow.step, flow.reset]);

  // Celebration sound on successful check-in / registration
  useEffect(() => {
    if (flow.step === 'welcome' || flow.step === 'registered') playSuccessChime();
  }, [flow.step]);

  // Streak lookup after a successful check-in
  useEffect(() => {
    setStreak(0);
    if ((flow.step === 'welcome' || flow.step === 'registered') && flow.member?.id) {
      let active = true;
      getStreakForMember(flow.member.id)
        .then((n) => { if (active) setStreak(n); })
        .catch(() => {});
      return () => { active = false; };
    }
    return undefined;
  }, [flow.step, flow.member]);

  // REMEMBER ME: save the member after a successful check-in or registration
  useEffect(() => {
    if ((flow.step === 'welcome' || flow.step === 'registered') && flow.member) {
      saveRememberedMember(flow.member);
      setRemembered({ phone: flow.member.phone, name: flow.member.name });
    }
  }, [flow.step, flow.member]);

  // Back from a result screen → quick check-in becomes available again
  useEffect(() => {
    if (flow.step === 'phone') setManualMode(false);
  }, [flow.step]);

  const showStreak = flow.step === 'welcome' || flow.step === 'registered' ? streak : 0;
  const resetCounter = DONE_STEPS.indexOf(flow.step) !== -1 ? secondsLeft : null;
  const showQuickCheckIn = flow.step === 'phone' && remembered && !manualMode;
  const showPhoneForm = flow.step === 'phone' && (!remembered || manualMode);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800">
          <ArrowLeft className="h-4 w-4" /> Kiosk
        </Link>
        <div className="flex items-center gap-2 text-sm font-bold text-brand-700">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <QrCode className="h-4 w-4" />
          </span>
          IF Management
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 pb-16 pt-4 sm:pt-10">
        <div className="w-full max-w-md">
          <ConfigBanner className="mb-4" />

          {/* Remembered member → one-tap check-in */}
          {showQuickCheckIn && (
            <QuickCheckIn
              remembered={remembered}
              onCheckIn={() => flow.submitPhone(remembered.phone)}
              onSwitch={() => setManualMode(true)}
            />
          )}

          {/* Manual phone entry */}
          {showPhoneForm && (
            <>
              {remembered && manualMode && (
                <button
                  type="button"
                  onClick={() => setManualMode(false)}
                  className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to quick check-in
                </button>
              )}
              <PhoneStep onSubmit={flow.submitPhone} />
            </>
          )}

          {flow.step === 'checking' && <CheckingCard />}

          {/* NEW: Update Semester Step */}
          {(flow.step === 'update-semester' || flow.step === 'updating-semester') && (
            <UpdateSemesterStep
              member={flow.member}
              submitting={flow.step === 'updating-semester'}
              onSubmit={flow.submitSemester}
            />
          )}

          {flow.step === 'welcome' && (
            <ResultCard
              icon={CheckCircle2}
              title={'Welcome back, ' + flow.member.name + '.'}
              message="Attendance recorded."
              meta={buildMeta(flow.member, flow.record)}
              streak={showStreak}
              autoResetIn={resetCounter}
              onDone={flow.reset}
            />
          )}

          {flow.step === 'already' && (
            <ResultCard
              tone="warning"
              icon={Clock3}
              title={'Hi ' + flow.member.name + '.'}
              message="You have already checked in today."
              meta={buildMeta(flow.member, flow.record)}
              autoResetIn={resetCounter}
              onDone={flow.reset}
            />
          )}

          {flow.step === 'not-found' && (
            <NotFoundCard onRegister={flow.openRegistration} onRetry={flow.reset} />
          )}

          {(flow.step === 'register' || flow.step === 'registering') && (
            <RegisterStep
              prefillPhone={flow.prefillPhone}
              submitting={flow.step === 'registering'}
              serverError={flow.error}
              onSubmit={flow.submitRegistration}
              onBack={flow.reset}
            />
          )}

          {flow.step === 'registered' && (
            <ResultCard
              icon={CheckCircle2}
              title={'Welcome, ' + flow.member.name + '!'}
              message="You're registered and today's attendance has been recorded."
              meta={buildMeta(flow.member, flow.record)}
              streak={showStreak}
              autoResetIn={resetCounter}
              onDone={flow.reset}
            />
          )}

          {flow.step === 'error' && (
            <ResultCard
              tone="danger"
              icon={XCircle}
              title="Something went wrong"
              message={flow.error}
              autoResetIn={resetCounter}
              onDone={flow.reset}
              doneLabel="Try again"
            />
          )}

          <TodayRoster refreshToken={flow.step} />
        </div>
      </main>
    </div>
  );
}
`,

};

let count = 0;
for (const [filePath, content] of Object.entries(files)) {
  const full = join(process.cwd(), filePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content.startsWith('\n') ? content.slice(1) : content);
  console.log('updated', filePath);
  count += 1;
}
console.log('');
console.log('Done! ' + count + ' files updated.');
console.log('Now push to GitHub so Vercel redeploys:');
console.log('  git add . && git commit -m "Add Wednesday lock and semester rules" && git push');