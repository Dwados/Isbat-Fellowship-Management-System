const TONES = {
  brand: { card: 'border-brand-100 bg-brand-50', chip: 'bg-white text-brand-700' },
  red: { card: 'border-red-100 bg-red-50', chip: 'bg-white text-red-600' },
  white: { card: 'border-stone-200 bg-white', chip: 'bg-brand-50 text-brand-700' },
};

export default function StatCard({ icon: Icon, label, value, tone = 'brand', loading = false }) {
  const t = TONES[tone] ?? TONES.brand;
  return (
    <div className={'flex items-start gap-4 rounded-2xl border p-5 shadow-sm ' + t.card}>
      <div className={'rounded-xl p-2.5 shadow-sm ' + t.chip}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-stone-500">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-8 w-16 animate-pulse rounded-md bg-stone-200" />
        ) : (
          <p className="mt-0.5 truncate text-2xl font-bold text-stone-900">{value ?? 0}</p>
        )}
      </div>
    </div>
  );
}
