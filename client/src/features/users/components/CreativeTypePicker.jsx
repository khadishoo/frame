import { Check } from 'lucide-react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { PROJECT_TYPES, PROJECT_TYPE_KEYS } from '@/lib/projectTypes';

const hints = {
  art: 'Иллюстрации, скетчи, живопись',
  music: 'Треки, альбомы, сведение',
  video: 'Клипы, монтаж, короткий метр',
  photo: 'Съёмки, ретушь, серии',
  script: 'Сценарии, рассказы, тексты',
  dev: 'Приложения, сайты, игры',
  other: 'Всё, что не влезло в рамки',
};

function TypeCard({ type, selected, onToggle, index }) {
  const { label, icon: Icon, soft, text, dot } = PROJECT_TYPES[type];

  return (
    <m.button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.03 * index }}
      className={cn(
        'focus-ring group relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-[border-color,background-color,box-shadow]',
        selected
          ? cn('border-transparent shadow-soft ring-2 ring-inset', soft, `ring-current ${text}`)
          : 'border-border bg-surface hover:border-muted/40 hover:shadow-soft',
      )}
    >
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-lg transition-colors',
          selected ? 'bg-surface' : soft,
        )}
      >
        <Icon className={cn('size-5', text)} aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-fg">{label}</span>
        <span className="text-xs text-muted">{hints[type]}</span>
      </span>
      <span
        className={cn(
          'absolute right-3 top-3 flex size-5 items-center justify-center rounded-full transition-all',
          selected ? cn(dot, 'scale-100 opacity-100') : 'scale-75 opacity-0',
        )}
        aria-hidden="true"
      >
        <Check className="size-3 text-bg" strokeWidth={3} />
      </span>
    </m.button>
  );
}

/**
 * Выбор творческих типов карточками (онбординг, профиль).
 * value — массив ключей ('art', 'music'…), onChange получает новый массив.
 */
export function CreativeTypePicker({
  value,
  onChange,
  label = 'Творческие направления',
  className,
}) {
  const toggle = (type) =>
    onChange(value.includes(type) ? value.filter((t) => t !== type) : [...value, type]);

  return (
    <fieldset className={className}>
      <legend className="sr-only">{label}</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {PROJECT_TYPE_KEYS.map((type, index) => (
          <TypeCard
            key={type}
            type={type}
            index={index}
            selected={value.includes(type)}
            onToggle={() => toggle(type)}
          />
        ))}
      </div>
    </fieldset>
  );
}
