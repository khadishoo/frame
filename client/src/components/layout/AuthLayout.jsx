import { Link, Outlet } from 'react-router';
import { motion } from 'framer-motion';
import { Logo, ThemeToggle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { PROJECT_TYPES, PROJECT_TYPE_KEYS } from '@/lib/projectTypes';

// Раскладка «карточек» типов на брендовой панели: смещения создают живой коллаж
const collage = [
  'translate-x-6',
  '-translate-x-10',
  'translate-x-14',
  '-translate-x-4',
  'translate-x-2',
  '-translate-x-12',
  'translate-x-8',
];

const corners = [
  'left-6 top-6 rounded-tl-xl border-l-2 border-t-2',
  'right-6 top-6 rounded-tr-xl border-r-2 border-t-2',
  'bottom-6 right-6 rounded-br-xl border-b-2 border-r-2',
  'bottom-6 left-6 rounded-bl-xl border-b-2 border-l-2',
];

function BrandPanel() {
  return (
    <div className="bg-grain relative hidden flex-col justify-between overflow-hidden border-l border-border bg-surface-2 p-20 lg:flex">
      {/* Уголки кадра по краям панели — одинаковые, независимо от размеров */}
      {corners.map((corner) => (
        <span
          key={corner}
          className={cn('pointer-events-none absolute size-12 border-muted/40', corner)}
          aria-hidden="true"
        />
      ))}

      <div className="relative flex flex-1 items-center justify-center">
        <ul className="flex flex-col items-center gap-3" aria-hidden="true">
          {PROJECT_TYPE_KEYS.map((key, index) => {
            const { label, icon: Icon, soft, text } = PROJECT_TYPES[key];
            return (
              <motion.li
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * index, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-soft',
                  collage[index],
                )}
              >
                <span className={cn('flex size-7 items-center justify-center rounded-lg', soft)}>
                  <Icon className={cn('size-4', text)} />
                </span>
                <span className="text-sm font-medium text-fg">{label}</span>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <div className="relative max-w-sm">
        <p className="font-display text-xl font-semibold leading-snug text-fg">
          Собрать. Спланировать. Довести до&nbsp;конца.
        </p>
        <p className="mt-2 text-sm text-muted">
          Все творческие проекты — рисунки, музыка, видео и код — в одной рамке.
        </p>
      </div>
    </div>
  );
}

/** Вход, регистрация, восстановление пароля, приглашение. */
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col px-4 py-6 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="focus-ring rounded-md" aria-label="Frame — на главную">
            <Logo />
          </Link>
          <ThemeToggle variant="icon" />
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </main>

        <footer className="text-center text-xs text-muted">
          © {new Date().getFullYear()} Frame · пространство для творческих проектов
        </footer>
      </div>

      <BrandPanel />
    </div>
  );
}
