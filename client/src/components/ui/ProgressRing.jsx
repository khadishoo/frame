import { cn } from '@/lib/cn';

const sizes = {
  sm: { box: 24, stroke: 3, text: null },
  md: { box: 36, stroke: 3.5, text: 'text-[10px]' },
  lg: { box: 64, stroke: 5, text: 'text-sm' },
};

/**
 * Кольцо прогресса 0–100. Цвет — текущий цвет текста (className="text-type-music").
 * Для скринридеров — role="progressbar" с aria-valuenow.
 */
export function ProgressRing({ value = 0, size = 'md', label = 'Прогресс', className }) {
  const { box, stroke, text } = sizes[size];
  const percent = Math.min(100, Math.max(0, Math.round(value)));
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: box, height: box }}
    >
      <svg
        width={box}
        height={box}
        viewBox={`0 0 ${box} ${box}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      {text && (
        <span className={cn('absolute font-medium tabular-nums text-fg', text)} aria-hidden="true">
          {percent}%
        </span>
      )}
    </span>
  );
}
