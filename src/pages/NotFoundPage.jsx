import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-brand-700">404</p>
      <h1 className="text-2xl font-bold text-stone-900">Page not found</h1>
      <p className="text-sm text-stone-500">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
    </div>
  );
}
