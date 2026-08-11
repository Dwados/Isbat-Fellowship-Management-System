export default function EmptyState({ icon: Icon, title, message, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {Icon && (
        <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      {message && <p className="max-w-sm text-sm text-stone-500">{message}</p>}
      {children}
    </div>
  );
}
