import Spinner from './Spinner';

export default function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-stone-200 bg-white py-14 text-sm text-stone-500">
      <Spinner className="h-4 w-4 text-brand-700" />
      {label}
    </div>
  );
}
