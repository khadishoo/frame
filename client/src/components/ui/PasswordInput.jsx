import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Field } from './Field';
import { fieldClasses } from './fieldClasses';

/** Поле пароля с кнопкой «показать / скрыть». Принимает те же props, что и Input. */
export function PasswordInput({
  label,
  hint,
  error,
  required,
  className,
  inputClassName,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(fieldClasses(invalid), 'h-10 pl-3 pr-10', inputClassName)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={visible}
            className="focus-ring absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:text-fg"
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </Field>
  );
}
