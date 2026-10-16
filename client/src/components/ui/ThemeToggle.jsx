import { Monitor, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useId } from 'react';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/lib/theme';
import { Button } from './Button';

const options = [
  { value: 'light', label: 'Светлая', Icon: Sun },
  { value: 'dark', label: 'Тёмная', Icon: Moon },
  { value: 'system', label: 'Как в системе', Icon: Monitor },
];

/**
 * Переключатель темы.
 * variant="segmented" — три кнопки (светлая / тёмная / системная), для настроек;
 * variant="icon" — одна кнопка-иконка, по клику по кругу: светлая → тёмная → системная.
 */
export function ThemeToggle({ variant = 'segmented', showLabels = false, className }) {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const id = useId();

  if (variant === 'icon') {
    const index = options.findIndex((option) => option.value === preference);
    const current = options[index];
    const next = options[(index + 1) % options.length];
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setPreference(next.value)}
        aria-label={`Тема: ${current.label.toLowerCase()}. Переключить на «${next.label.toLowerCase()}»`}
        title={`Тема: ${current.label.toLowerCase()}`}
        className={cn('text-muted hover:text-fg', className)}
      >
        <current.Icon />
      </Button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Тема оформления"
      className={cn('inline-flex rounded-lg bg-surface-2 p-1', className)}
    >
      {options.map(({ value, label, Icon }) => {
        const checked = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={showLabels ? undefined : label}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              'focus-ring relative flex h-8 items-center gap-2 rounded-md px-2.5 text-sm font-medium transition-colors',
              checked ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {checked && (
              <motion.span
                layoutId={`${id}-theme`}
                className="absolute inset-0 rounded-md bg-surface shadow-soft"
                transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
              />
            )}
            <Icon className="relative size-4" aria-hidden="true" />
            {showLabels && <span className="relative">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
