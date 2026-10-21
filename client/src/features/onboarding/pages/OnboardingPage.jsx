import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { updateMe } from '@/api/users';
import { Alert, Button, Input, Logo } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { PROJECT_TYPES, PROJECT_TYPE_KEYS } from '@/lib/projectTypes';
import { toast } from '@/lib/toast';

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
    <motion.button
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
    </motion.button>
  );
}

/** Онбординг после регистрации: имя и творческие типы → PATCH /users/me. */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.name ?? '');
  const [types, setTypes] = useState(user?.creativeTypes ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const toggle = (type) =>
    setTypes((current) =>
      current.includes(type) ? current.filter((t) => t !== type) : [...current, type],
    );

  const nameError = name.trim() ? null : 'Введите имя';

  const save = async () => {
    if (nameError) return;
    setSaving(true);
    setError(null);
    try {
      const { user: updated } = await updateMe({ name: name.trim(), creativeTypes: types });
      useAuthStore.getState().setUser(updated);
      toast.success('Профиль готов', { description: 'Самое время создать первый проект' });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="bg-grain flex min-h-dvh flex-col items-center px-4 py-6 sm:py-10">
      <title>Знакомство · Frame</title>
      <Logo />

      <main className="flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 py-10">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm font-medium text-muted">Шаг 1 из 1 · можно изменить позже</p>
          <h1 className="text-2xl font-semibold text-fg sm:text-3xl">
            Добро пожаловать{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-muted">
            Чем вы занимаетесь? Так мы подберём цвета и подсказки для ваших проектов.
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <Input
            label="Как к вам обращаться"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            error={nameError ?? undefined}
          />
        </div>

        <fieldset>
          <legend className="sr-only">Творческие направления</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {PROJECT_TYPE_KEYS.map((type, index) => (
              <TypeCard
                key={type}
                type={type}
                index={index}
                selected={types.includes(type)}
                onToggle={() => toggle(type)}
              />
            ))}
          </div>
        </fieldset>

        {error && <Alert variant="danger">{error}</Alert>}

        <div className="flex flex-col-reverse items-center justify-center gap-2 sm:flex-row">
          <Button variant="ghost" onClick={() => navigate('/app', { replace: true })}>
            Пропустить
          </Button>
          <Button size="lg" onClick={save} loading={saving} disabled={Boolean(nameError)}>
            {types.length > 0 ? `Продолжить · выбрано ${types.length}` : 'Продолжить'}
          </Button>
        </div>
      </main>
    </div>
  );
}
