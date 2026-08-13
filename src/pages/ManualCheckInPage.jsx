import {
  ArrowLeft, CheckCircle2, Clock3, Phone, UserCheck, UserPlus, UserX, XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import Avatar from '../components/Avatar';
import LoadingBlock from '../components/LoadingBlock';
import Spinner from '../components/Spinner';
import { useCheckIn } from '../hooks/useCheckIn';
import { getStreakForMember } from '../services/streakService';
import { formatTime } from '../utils/dates';
import { friendlyError } from '../utils/errors';
import { isValidPhone } from '../utils/phone';

const TONES = {
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-rose-100 text-rose-600',
};

const AUTO_RESET_SECONDS = 10;
const DONE_STEPS = ['welcome', 'already', 'registered', 'error'];

/* ---------- Result card: animation + streak + auto-reset countdown ---------- */

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
  if (record?.check_in_time) parts.push('Checked in at ' + formatTime(record.check_in_time));
  return parts.length ? parts.join(' · ') : null;
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
      <h2 className="mt-4 text-center text-xl font-bold text-stone-900">Manual Check-in</h2>
      <p className="mt-1 text-center text-sm text-stone-500">
        Enter the phone number of the member to sign in or register.
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

      <button type="submit" className="btn-primary mt-6 w-full py-3 text-base">Process</button>
    </form>
  );
}

function CheckingCard() {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <Spinner className="h-8 w-8 text-brand-600" />
      <p className="text-sm font-medium text-stone-600">Processing request…</p>
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
        Member not found.
      </h2>
      <p className="mt-2 text-stone-600">
        Member does not exist in the system. Register the member below.
      </p>
      <button type="button" onClick={onRegister} className="btn-primary mt-7 w-full py-3">
        <UserPlus className="h-4 w-4" /> Register new member
      </button>
      <button type="button" onClick={onRetry} className="btn-secondary mt-3 w-full">
        Try another number
      </button>
    </div>
  );
}

function RegisterStep({ prefillPhone, submitting, serverError, onSubmit, onBack }) {
  const [form, setForm] = useState({ name: '', phone: prefillPhone ?? '', email: '', course: '' });
  const [errors, setErrors] = useState({});

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Please enter the full name.';
    if (!isValidPhone(form.phone)) nextErrors.phone = 'Enter a valid phone number (10–15 digits).';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <UserPlus className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-center text-xl font-bold text-stone-900">Register Member</h2>
      <p className="mt-1 text-center text-sm text-stone-500">
        Add a new member to the system.
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

export default function ManualCheckInPage() {
  const flow = useCheckIn();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RESET_SECONDS);
  const [streak, setStreak] = useState(0);
  const navigate = useNavigate();

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

  const showStreak = flow.step === 'welcome' || flow.step === 'registered' ? streak : 0;
  const resetCounter = DONE_STEPS.indexOf(flow.step) !== -1 ? secondsLeft : null;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
        <button 
          type="button" 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2 text-sm font-bold text-brand-700">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <UserCheck className="h-4 w-4" />
          </span>
          Manual Check-in
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 pb-16 pt-4 sm:pt-10">
        <div className="w-full max-w-md">
          {/* Main check-in flow */}
          {flow.step === 'phone' && (
            <PhoneStep onSubmit={flow.submitPhone} />
          )}

          {flow.step === 'checking' && <CheckingCard />}

          {flow.step === 'welcome' && (
            <ResultCard
              icon={CheckCircle2}
              title={'Successfully checked in ' + flow.member.name + '.'}
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
              message="Already checked in today."
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
              title={'New member ' + flow.member.name + ' registered!'}
              message="Member added and attendance recorded."
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
        </div>
      </main>
    </div>
  );
}