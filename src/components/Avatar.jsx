import { avatarClasses, getInitials } from '../utils/misc';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

export default function Avatar({ name, size = 'md' }) {
  return (
    <div
      className={'flex shrink-0 items-center justify-center rounded-full font-semibold ' + SIZES[size] + ' ' + avatarClasses(name)}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
