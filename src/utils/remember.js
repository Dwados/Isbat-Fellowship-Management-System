const STORAGE_KEY = 'if_remembered_member';

/** Save the last member who checked in successfully on this device (session-only, auto-clears on browser close). */
export function saveRememberedMember(member) {
  if (!member?.phone) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      phone: member.phone,
      name: member.name,
      savedAt: new Date().toISOString(),
    }));
  } catch (e) {
    // storage unavailable (private mode etc.) — feature degrades silently
  }
}

/** Returns { phone, name, savedAt } or null. Auto-clears when browser closes. */
export function getRememberedMember() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.phone) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

export function clearRememberedMember() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
}
