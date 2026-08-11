import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

const VARIANTS = {
  success: { classes: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: CheckCircle2 },
  error: { classes: 'border-red-200 bg-red-50 text-red-800', Icon: XCircle },
  warning: { classes: 'border-amber-200 bg-amber-50 text-amber-800', Icon: AlertTriangle },
  info: { classes: 'border-sky-200 bg-sky-50 text-sky-800', Icon: Info },
};

export default function Alert({ variant = 'info', className = '', children }) {
  const { classes, Icon } = VARIANTS[variant] ?? VARIANTS.info;
  return (
    <div role="alert" className={'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ' + classes + ' ' + className}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
