import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Field } from './Field';
import { fieldClasses } from './fieldClasses';

/**
 * Нативный <select> со стилями: доступен с клавиатуры и привычно работает на телефонах.
 * options — [{ value, label, disabled? }]
 */
export function Select({
  label,
  hint,
  error,
  required,
  options = [],
  placeholder,
  className,
  inputClassName,
  ...props
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <select
            id={id}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(
              fieldClasses(invalid),
              'h-10 cursor-pointer appearance-none pl-3 pr-9',
              inputClassName,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </div>
      )}
    </Field>
  );
}
