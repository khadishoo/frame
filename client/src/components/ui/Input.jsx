import { cn } from '@/lib/cn';
import { Field } from './Field';
import { fieldClasses } from './fieldClasses';

/**
 * Текстовое поле с подписью, подсказкой и ошибкой.
 * leftIcon — иконка lucide внутри поля слева.
 */
export function Input({
  label,
  hint,
  error,
  required,
  leftIcon: LeftIcon,
  className,
  inputClassName,
  ...props
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          {LeftIcon && (
            <LeftIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
          )}
          <input
            id={id}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(fieldClasses(invalid), 'h-10 px-3', LeftIcon && 'pl-9', inputClassName)}
            {...props}
          />
        </div>
      )}
    </Field>
  );
}
