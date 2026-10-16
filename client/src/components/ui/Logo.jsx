import { cn } from '@/lib/cn';

/** Знак Frame: буква F в уголках кадра. Цвет — currentColor. */
export function LogoMark({ className, title = 'Frame' }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn('size-8', className)}
      role="img"
      aria-label={title}
    >
      {/* Уголки видоискателя */}
      <path
        d="M3 10V6.5A3.5 3.5 0 0 1 6.5 3H10M22 3h3.5A3.5 3.5 0 0 1 29 6.5V10M29 22v3.5a3.5 3.5 0 0 1-3.5 3.5H22M10 29H6.5A3.5 3.5 0 0 1 3 25.5V22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Буква F */}
      <path
        d="M12.5 22.5V9.5h8M12.5 16h6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Логотип: знак + надпись. */
export function Logo({ className, markClassName }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-fg', className)}>
      <LogoMark className={markClassName} title="" />
      <span className="font-display text-lg font-semibold tracking-tight">Frame</span>
    </span>
  );
}
