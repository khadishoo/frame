import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Input, Modal, Select, Textarea } from '@/components/ui';
import { useProjectOptions } from '@/features/projects/hooks/useProjects';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { toast } from '@/lib/toast';
import { useCreateNote } from '../hooks/useNotes';
import { isQuickIdeaHotkey, useQuickIdea } from '../quickIdeaStore';

function QuickIdeaForm({ projectId: initialProjectId, onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [projectId, setProjectId] = useState(initialProjectId ?? '');
  const [error, setError] = useState(null);
  const createNote = useCreateNote();
  const { data: projects = [] } = useProjectOptions();
  const navigate = useNavigate();

  const submit = (event) => {
    event?.preventDefault();
    if (!title.trim() && !content.trim()) {
      setError('Напишите заголовок или текст идеи');
      return;
    }
    createNote.mutate(
      { title: title.trim(), content, projectId: projectId || null },
      {
        onSuccess: (note) => {
          onClose();
          toast.success('Идея сохранена', {
            description: note.title || undefined,
            action: { label: 'Открыть', onClick: () => navigate(`/app/ideas/${note.id}`) },
          });
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <form id="quick-idea-form" onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label="Заголовок"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setError(null);
        }}
        maxLength={200}
        placeholder="Например: комикс про кота-почтальона"
        error={error}
        // Окно открыли, чтобы печатать — фокус сразу в поле
        autoFocus
      />
      <Textarea
        label="Текст"
        hint="Можно Markdown: **жирный**, списки, ссылки. Ctrl+Enter — сохранить."
        rows={5}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e);
        }}
      />
      <Select
        label="Проект"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        options={[
          { value: '', label: 'Без проекта' },
          ...projects.map((p) => ({ value: p.id, label: p.title })),
        ]}
      />
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" loading={createNote.isPending}>
          Сохранить идею
        </Button>
      </div>
    </form>
  );
}

/**
 * «Быстрая идея» — одно окно на приложение (в AppLayout). Клавиша N в любом месте,
 * если фокус не в поле ввода и не открыто другое окно.
 */
export function QuickIdeaModal() {
  const { open, projectId, openQuickIdea, close } = useQuickIdea();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isQuickIdeaHotkey(event)) return;
      event.preventDefault(); // иначе «н» напечатается в автофокусное поле окна
      openQuickIdea();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openQuickIdea]);

  return (
    <Modal open={open} onClose={close} title="Быстрая идея" closeOnBackdrop={false}>
      {open && <QuickIdeaForm projectId={projectId} onClose={close} />}
    </Modal>
  );
}
