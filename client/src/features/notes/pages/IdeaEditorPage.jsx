import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Ellipsis,
  NotebookPen,
  Palette,
  Pin,
  PinOff,
  Rocket,
  Trash2,
} from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  ErrorState,
  Modal,
  SaveStatus,
  Select,
  Skeleton,
  Tabs,
  buttonVariants,
} from '@/components/ui';
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { TypeSelect } from '@/features/projects/components/TypeSelect';
import { useProjectOptions } from '@/features/projects/hooks/useProjects';
import { useCurrentWorkspace } from '@/features/workspaces/workspaceStore';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { PROJECT_TYPES } from '@/lib/projectTypes';
import { toast } from '@/lib/toast';
import { MarkdownView } from '../components/MarkdownView';
import { useConvertNote, useDeleteNote, useNote, useUpdateNote } from '../hooks/useNotes';
import { noteColorOptions, NOTE_CARD_COLORS, noteTitle } from '../noteColors';

export const AUTOSAVE_DELAY = 800;

// Кружки цветов для меню — компоненты создаём один раз, а не при каждом рендере
const SWATCHES = Object.fromEntries(
  noteColorOptions.map((option) => [
    option.value ?? 'none',
    function Swatch({ className }) {
      return <span className={cn(className, 'rounded-full', option.dot)} aria-hidden="true" />;
    },
  ]),
);

const BackLink = () => (
  <Link
    to="/app/ideas"
    className="focus-ring mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-muted transition-colors hover:text-fg"
  >
    <ArrowLeft className="size-4" aria-hidden="true" />
    Идеи
  </Link>
);

/** Превратить идею в проект: выбрать тип → проект создаётся, заметка к нему привязывается. */
function ConvertDialog({ open, onClose, note, beforeConvert }) {
  const [type, setType] = useState('other');
  const convert = useConvertNote();
  const navigate = useNavigate();
  const labelId = useId();

  const submit = async () => {
    try {
      await beforeConvert(); // сначала дописанное в редакторе — иначе описание будет старым
      const { project } = await convert.mutateAsync({ id: note.id, type });
      onClose();
      toast.success('Проект создан', { description: project.title });
      navigate(`/app/projects/${project.id}`);
    } catch (err) {
      toast.error('Не удалось создать проект', { description: getErrorMessage(err) });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Превратить в проект"
      description={`Название — «${noteTitle(note)}», описание — текст идеи. Заметка останется и будет привязана к проекту.`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button leftIcon={<Rocket />} onClick={submit} loading={convert.isPending}>
            Создать проект
          </Button>
        </>
      }
    >
      <p id={labelId} className="mb-2 text-sm font-medium text-fg">
        Творческий тип
      </p>
      <TypeSelect value={type} onChange={setType} labelId={labelId} />
    </Modal>
  );
}

/**
 * Редактор: заголовок и Markdown. Текст сохраняется сам — через AUTOSAVE_DELAY мс после
 * последнего изменения; при уходе со страницы недописанное сохраняется сразу.
 */
function NoteEditor({ note, readOnly }) {
  const [draft, setDraft] = useState({ title: note.title, content: note.content });
  const [mode, setMode] = useState(note.content ? 'preview' : 'edit');
  const [saveState, setSaveState] = useState('idle');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [converting, setConverting] = useState(false);
  // Что последним ушло на сервер — с ним сравниваем черновик («есть несохранённое?»)
  const [sent, setSent] = useState({ title: note.title, content: note.content });
  // Копия для сохранения при уходе со страницы (в момент размонтирования state уже не прочитать)
  const latest = useRef({ draft, sent });

  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const { data: projects = [] } = useProjectOptions();
  const navigate = useNavigate();

  const dirty = draft.title !== sent.title || draft.content !== sent.content;
  const toData = (value) => ({ title: value.title.trim(), content: value.content });

  const save = (data) => {
    setSaveState('saving');
    return updateNote.mutateAsync({ id: note.id, data }).then(
      (saved) => {
        setSaveState('saved');
        return saved;
      },
      (err) => {
        setSaveState('error');
        toast.error('Изменения не сохранились', { description: getErrorMessage(err) });
        throw err;
      },
    );
  };

  const saveDraft = (value) => {
    setSent(value);
    return save(toData(value));
  };

  useEffect(() => {
    latest.current = { draft, sent, mutate: updateNote.mutate };
  });

  // Автосохранение: каждое изменение откладывает сохранение ещё на 800 мс (debounce)
  useEffect(() => {
    if (!dirty || readOnly) return undefined;
    const timer = setTimeout(() => saveDraft(draft).catch(() => {}), AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
    // saveDraft пересоздаётся каждый рендер — таймер перезапускаем только от правок текста
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty, readOnly]);

  // Ушли со страницы, не дождавшись 800 мс, — сохраняем сразу (без индикатора: страницы уже нет)
  useEffect(
    () => () => {
      const { draft: value, sent: last, mutate } = latest.current;
      const unsaved = value.title !== last.title || value.content !== last.content;
      if (unsaved && !readOnly) mutate?.({ id: note.id, data: toData(value) });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при уходе со страницы
    [],
  );

  // Закрывают вкладку с несохранённым — браузер переспросит
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (event) => event.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const flush = () => (dirty ? saveDraft(draft) : Promise.resolve());

  const remove = async () => {
    try {
      await deleteNote.mutateAsync(note.id);
    } catch (err) {
      toast.error('Идея не удалена', { description: getErrorMessage(err) });
      throw err;
    }
    latest.current.sent = latest.current.draft; // удалена — сохранять при уходе нечего
    toast.success('Идея удалена', { description: noteTitle(note) });
    navigate('/app/ideas', { replace: true });
  };

  const projectOptions = [
    { value: '', label: 'Без проекта' },
    ...projects.map((p) => ({ value: p.id, label: p.title })),
    // Архивный проект в общем списке не приходит — показываем текущий, чтобы select не «сбросился»
    ...(note.project && !projects.some((p) => p.id === note.project.id)
      ? [{ value: note.project.id, label: `${note.project.title} (в архиве)` }]
      : []),
  ];
  const projectType = note.project ? PROJECT_TYPES[note.project.type] : null;

  return (
    <>
      <title>{`${noteTitle({ title: draft.title })} · Идеи · Frame`}</title>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SaveStatus state={dirty && saveState !== 'saving' ? 'idle' : saveState} />
        <div className="flex items-center gap-1">
          {!readOnly && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-pressed={note.isPinned}
                aria-label={note.isPinned ? 'Открепить' : 'Закрепить'}
                title={note.isPinned ? 'Открепить' : 'Закрепить наверху'}
                onClick={() => save({ isPinned: !note.isPinned }).catch(() => {})}
                className={note.isPinned ? 'text-fg' : 'text-muted'}
              >
                {note.isPinned ? <PinOff /> : <Pin />}
              </Button>
              <Dropdown
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Цвет карточки"
                    className="text-muted"
                  >
                    <Palette />
                  </Button>
                }
                items={[
                  { type: 'label', label: 'Цвет карточки' },
                  ...noteColorOptions.map((option) => ({
                    label: option.label,
                    icon: SWATCHES[option.value ?? 'none'],
                    checked: note.color === option.value,
                    onSelect: () => save({ color: option.value }).catch(() => {}),
                  })),
                ]}
              />
            </>
          )}
          <FavoriteButton type="note" item={note} />
          {!readOnly && (
            <Dropdown
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ещё действия"
                  className="text-muted"
                >
                  <Ellipsis />
                </Button>
              }
              items={[
                { label: 'Превратить в проект', icon: Rocket, onSelect: () => setConverting(true) },
                { type: 'separator' },
                {
                  label: 'Удалить',
                  icon: Trash2,
                  danger: true,
                  onSelect: () => setConfirmDelete(true),
                },
              ]}
            />
          )}
        </div>
      </div>

      <article
        className={cn(
          'flex flex-col gap-4 rounded-xl border p-4 shadow-soft sm:p-6',
          note.color ? NOTE_CARD_COLORS[note.color] : 'border-border bg-surface',
        )}
      >
        <textarea
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value.replace(/\n/g, ' ') }))}
          placeholder="Без названия"
          aria-label="Заголовок"
          rows={1}
          maxLength={200}
          readOnly={readOnly}
          className="w-full resize-none bg-transparent font-display text-xl font-semibold text-fg outline-none [field-sizing:content] placeholder:text-muted/70 sm:text-2xl"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Проект"
            value={note.project?.id ?? ''}
            options={projectOptions}
            onChange={(e) => save({ projectId: e.target.value || null }).catch(() => {})}
            disabled={readOnly}
            className="w-full sm:w-64"
            inputClassName="h-9 bg-surface/70"
          />
          {note.project && (
            <Link
              to={`/app/projects/${note.project.id}`}
              className="focus-ring inline-flex items-center gap-1.5 rounded text-sm text-muted hover:text-fg"
            >
              <span className={cn('size-2 rounded-full', projectType.dot)} aria-hidden="true" />
              Открыть проект
            </Link>
          )}
        </div>

        <Tabs
          variant="pills"
          label="Режим"
          value={readOnly ? 'preview' : mode}
          onValueChange={setMode}
          items={[
            ...(readOnly ? [] : [{ value: 'edit', label: 'Редактор' }]),
            { value: 'preview', label: 'Просмотр' },
          ]}
        />

        {mode === 'edit' && !readOnly ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={draft.content}
              onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
              placeholder={
                'Пишите здесь…\n\n# Заголовок\n- список\n**жирный**, [ссылка](https://…)'
              }
              aria-label="Текст идеи (Markdown)"
              maxLength={50000}
              className="min-h-[40vh] w-full resize-y rounded-lg border border-border bg-surface/70 p-3 font-mono text-sm leading-relaxed text-fg outline-none [field-sizing:content] placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted">
              Markdown: <code># заголовок</code>, <code>**жирный**</code>, <code>- список</code>,{' '}
              <code>- [ ] задача</code>, <code>[ссылка](https://…)</code>. Сохраняется само.
            </p>
          </div>
        ) : draft.content.trim() ? (
          <MarkdownView className="min-h-[20vh]">{draft.content}</MarkdownView>
        ) : (
          <p className="min-h-[20vh] text-sm text-muted">Текста пока нет.</p>
        )}
      </article>

      <p className="mt-3 text-xs text-muted">
        Создано {new Date(note.createdAt).toLocaleDateString('ru-RU')} · изменено{' '}
        {new Date(note.updatedAt).toLocaleString('ru-RU', {
          dateStyle: 'short',
          timeStyle: 'short',
        })}
      </p>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        danger
        title="Удалить идею?"
        description={`«${noteTitle(note)}» исчезнет без возможности восстановления.`}
        confirmText="Удалить"
      />
      <ConvertDialog
        open={converting}
        onClose={() => setConverting(false)}
        note={{ ...note, title: draft.title }}
        beforeConvert={flush}
      />
    </>
  );
}

export default function IdeaEditorPage() {
  const { id } = useParams();
  const { data: note, isPending, error, refetch, isRefetching } = useNote(id);
  const { workspace } = useCurrentWorkspace();

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" aria-hidden="true">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (error) {
    const toIdeas = (
      <Link to="/app/ideas" className={buttonVariants({ variant: 'secondary' })}>
        Ко всем идеям
      </Link>
    );
    return (
      <>
        <BackLink />
        {error.response?.status === 404 ? (
          <EmptyState
            icon={NotebookPen}
            title="Идея не найдена"
            description="Возможно, её удалили или ссылка ведёт в чужое пространство."
            action={toIdeas}
          />
        ) : (
          <ErrorState
            title="Не удалось открыть идею"
            error={error}
            onRetry={refetch}
            retrying={isRefetching}
            action={toIdeas}
          />
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink />
      {/* key — новая заметка получает свежий черновик, а не текст предыдущей */}
      <NoteEditor key={note.id} note={note} readOnly={workspace?.role === 'viewer'} />
    </div>
  );
}
