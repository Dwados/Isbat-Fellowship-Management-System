import { useCallback, useState } from 'react';
import { recordAttendance } from '../services/attendanceService';
import { createMember, findMemberByPhone } from '../services/membersService';
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
      const result = await recordAttendance(found.id);
      setRecord(result.record);
      setStep(result.created ? 'welcome' : 'already');
    } catch (err) {
      setError(friendlyError(err));
      setStep('error');
    }
  }, []);

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
    reset, submitPhone, openRegistration, submitRegistration,
  };
}
