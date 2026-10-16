import { cn } from '@/lib/cn';
import { Field } from './Field';
import { fieldClasses } from './fieldClasses';

export function Textarea({
  label,
  hint,
  error,
  required,
  rows = 4,
  className,
  inputClassName,
  ...props
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          rows={rows}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(fieldClasses(invalid), 'min-h-20 resize-y px-3 py-2.5', inputClassName)}
          {...props}
        />
      )}
    </Field>
  );
}
