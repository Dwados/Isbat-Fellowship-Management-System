import { isSupabaseConfigured } from '../lib/supabase';
import Alert from './Alert';

export default function ConfigBanner({ className = 'mb-6' }) {
  if (isSupabaseConfigured) return null;
  return (
    <Alert variant="error" className={className}>
      <strong>Supabase is not configured.</strong> Create a <code>.env</code> file with{' '}
      <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then restart the dev
      server.
    </Alert>
  );
}
