import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { m } from 'framer-motion';
import { buttonVariants } from '@/components/ui';
import { cn } from '@/lib/cn';
import { PROJECT_TYPES, PROJECT_TYPE_KEYS } from '@/lib/projectTypes';

const steps = [
  { title: 'Собрать', text: 'Идеи, заметки, референсы и файлы — в одном месте.' },
  { title: 'Спланировать', text: 'Проекты, задачи с дедлайнами, доска и календарь.' },
  { title: 'Довести до конца', text: 'Видимый прогресс, статистика и история работы.' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] },
});

/** Временный лендинг (полноценный — после дизайна в Figma). */
export default function LandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 sm:px-6 sm:py-20">
      <title>Frame — пространство для творческих проектов</title>

      <section className="flex flex-col items-center gap-6 text-center">
        <m.ul className="flex flex-wrap justify-center gap-2" {...fadeUp()}>
          {PROJECT_TYPE_KEYS.map((key) => {
            const { label, icon: Icon, soft, text } = PROJECT_TYPES[key];
            return (
              <li
                key={key}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                  soft,
                )}
              >
                <Icon className={cn('size-3.5', text)} aria-hidden="true" />
                <span className="text-fg">{label}</span>
              </li>
            );
          })}
        </m.ul>

        <m.h1
          className="max-w-3xl text-balance text-2xl font-semibold leading-tight text-fg sm:text-3xl"
          {...fadeUp(0.05)}
        >
          Все творческие проекты&nbsp;— в&nbsp;одной рамке
        </m.h1>

        <m.p className="max-w-xl text-balance text-base text-muted sm:text-lg" {...fadeUp(0.1)}>
          Рисунки, музыка, видео, фото, сценарии и код. Собирайте идеи, планируйте задачи и доводите
          начатое до конца.
        </m.p>

        <m.div className="flex flex-col gap-2 xs:flex-row" {...fadeUp(0.15)}>
          <Link to="/register" className={buttonVariants({ size: 'lg' })}>
            Начать бесплатно
            <ArrowRight />
          </Link>
          <Link to="/login" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
            У меня есть аккаунт
          </Link>
        </m.div>
      </section>

      <m.ol className="mt-16 grid gap-3 sm:mt-24 sm:grid-cols-3 sm:gap-4" {...fadeUp(0.2)}>
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-xl border border-border bg-surface p-5 shadow-soft"
          >
            <span className="font-display text-sm font-medium text-muted">0{index + 1}</span>
            <h2 className="mt-2 text-lg font-semibold text-fg">{step.title}</h2>
            <p className="mt-1 text-sm text-muted">{step.text}</p>
          </li>
        ))}
      </m.ol>
    </div>
  );
}
