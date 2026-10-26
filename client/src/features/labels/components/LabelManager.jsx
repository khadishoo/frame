import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog, Dropdown, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { applyServerError } from '@/features/auth/serverErrors';
import { cn } from '@/lib/cn';
import { plural } from '@/lib/dates';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { LABEL_COLORS, LABEL_COLOR_KEYS, labelColor } from '@/lib/labelColors';
import { toast } from '@/lib/toast';
import { useLabelMutations } from '../hooks/useLabels';

const fieldError = (error) => {
  let message = null;
  const formMessage = applyServerError(error, (_f, { message: m }) => {
    message = m;
  });
  return message ?? formMessage;
};

// Кружок цвета как «иконка» пункта меню. Компоненты создаются один раз на модуль,
// а не при каждой отрисовке (иначе React пересоздавал бы их и терял состояние)
const ColorDots = Object.fromEntries(
  LABEL_COLOR_KEYS.map((key) => [
    key,
    function ColorDot({ className }) {
      return <span className={cn('rounded-full', className, LABEL_COLORS[key].dot)} />;
    },
  ]),
);

/** Кнопка-точка цвета с меню палитры. */
function ColorPicker({ value, onChange, label }) {
  return (
    <Dropdown
      align="start"
      menuClassName="min-w-44"
      trigger={
        <button
          type="button"
          aria-label={`${label}: цвет ${LABEL_COLORS[value]?.label.toLowerCase() ?? ''}`}
          className="focus-ring flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-surface-2"
        >
          <span className={cn('size-3.5 rounded-full', labelColor(value).dot)} />
        </button>
      }
      items={LABEL_COLOR_KEYS.map((key) => ({
        label: LABEL_COLORS[key].label,
        checked: key === value,
        icon: ColorDots[key],
        onSelect: () => onChange(key),
      }))}
    />
  );
}

/** Название с редактированием по клику: Enter — сохранить, Esc — отменить. */
function EditableName({ value, onSave, prefix = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState(null);

  const save = async () => {
    const name = draft.trim();
    if (!name || name === value) {
      setEditing(false);
      setDraft(value);
      return;
    }
    try {
      await onSave(name);
      setEditing(false);
      setError(null);
    } catch (err) {
      setError(fieldError(err));
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        title="Переименовать"
        className="focus-ring min-w-0 truncate rounded px-1 text-left text-sm font-medium text-fg hover:bg-surface-2"
      >
        {prefix}
        {value}
      </button>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <input
        autoFocus
        value={draft}
        maxLength={40}
        aria-label="Новое название"
        aria-invalid={Boolean(error) || undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === 'Escape') {
            setDraft(value);
            setError(null);
            setEditing(false);
          }
        }}
        className={cn(
          'h-8 rounded-md border bg-surface px-2 text-sm text-fg outline-none focus-visible:ring-2',
          error
            ? 'border-danger focus-visible:ring-danger/30'
            : 'border-ring focus-visible:ring-ring/25',
        )}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

/**
 * Управление категориями или тегами: список со счётчиком проектов, переименование,
 * цвет, удаление и создание новой метки.
 */
export function LabelManager({ kind, labels, isPending, error, onRetry, retrying, texts }) {
  const { create, update, remove } = useLabelMutations(kind);
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const prefix = kind === 'tags' ? '#' : '';

  const onUpdate = (id, data) =>
    update.mutateAsync({ id, data }).catch((err) => {
      if (data.color) toast.error('Цвет не сохранился', { description: getErrorMessage(err) });
      throw err;
    });

  const onCreate = async (event) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreateError(null);
    try {
      await create.mutateAsync({ name });
      setNewName('');
    } catch (err) {
      setCreateError(fieldError(err));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {isPending ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState title={texts.loadError} error={error} onRetry={onRetry} retrying={retrying} />
      ) : labels.length === 0 ? (
        <EmptyState icon={texts.emptyIcon} title={texts.emptyTitle} description={texts.emptyText} />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {labels.map((label) => (
            <li key={label.id} className="flex items-center gap-2 px-2 py-1.5">
              <ColorPicker
                value={label.color}
                label={label.name}
                onChange={(color) => onUpdate(label.id, { color }).catch(() => {})}
              />
              <div className="flex min-w-0 flex-1 items-center">
                <EditableName
                  value={label.name}
                  prefix={prefix}
                  onSave={(name) => onUpdate(label.id, { name })}
                />
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {label.projectCount ?? 0}{' '}
                {plural(label.projectCount ?? 0, ['проект', 'проекта', 'проектов'])}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Удалить ${prefix}${label.name}`}
                className="text-muted hover:text-danger"
                onClick={() => setToDelete(label)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onCreate} className="flex items-start gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <input
            value={newName}
            maxLength={40}
            onChange={(e) => {
              setNewName(e.target.value);
              setCreateError(null);
            }}
            placeholder={texts.placeholder}
            aria-label={texts.placeholder}
            aria-invalid={Boolean(createError) || undefined}
            className={cn(
              'h-9 w-full rounded-lg border bg-surface px-3 text-sm text-fg shadow-soft outline-none placeholder:text-muted/70 focus-visible:ring-2',
              createError
                ? 'border-danger focus-visible:ring-danger/30'
                : 'border-border focus-visible:border-ring focus-visible:ring-ring/25',
            )}
          />
          {createError && <p className="text-xs text-danger">{createError}</p>}
        </div>
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          leftIcon={<Plus />}
          loading={create.isPending}
          className="h-9"
        >
          Добавить
        </Button>
      </form>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          await remove.mutateAsync(toDelete.id);
          toast.success(texts.deleted);
        }}
        danger
        title={toDelete ? `Удалить ${prefix}${toDelete.name}?` : ''}
        description={texts.deleteHint}
        confirmText="Удалить"
      />
    </div>
  );
}
