export function friendlyError(err) {
  if (!err) return 'Something went wrong. Please try again.';
  if (err.code === '23505') return 'This record already exists (duplicate).';
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You appear to be offline. Check your connection and try again.';
  }
  return err.message || 'Something went wrong. Please try again.';
}
