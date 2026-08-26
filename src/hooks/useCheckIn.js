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
