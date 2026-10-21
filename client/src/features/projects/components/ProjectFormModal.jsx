import { useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { Alert, Button, Input, Modal, Select, Textarea } from '@/components/ui';
import { applyServerError } from '@/features/auth/serverErrors';
import { TagInput } from '@/features/labels/components/TagInput';
import { useCategories, useLabelMutations, useTags } from '@/features/labels/hooks/useLabels';
import { statusOptions } from '@/lib/projectStatuses';
import { toast } from '@/lib/toast';
import { useCreateProject, useUpdateProject } from '../hooks/useProjects';
import { useProjectModal } from '../projectModalStore';
import { emptyProjectForm, projectFormSchema, toFormValues, toPayload } from '../schemas';
import { TypeSelect } from './TypeSelect';

const NEW_CATEGORY = '__new__';

/** Выбор категории + создание новой прямо из формы. */
function CategoryField({ value, onChange, categories }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const { create } = useLabelMutations('categories');

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    try {
      const category = await create.mutateAsync({ name: trimmed });
      onChange(category.id);
      setCreating(false);
      setName('');
    } catch (err) {
      let fieldMessage = null;
      const formMessage = applyServerError(err, (_f, { message }) => {
        fieldMessage = message;
      });
      setError(fieldMessage ?? formMessage);
    }
  };

  if (creating) {
    return (
      <div className="flex flex-col gap-1.5">
        <Input
          label="Новая категория"
          value={name}
          autoFocus
          maxLength={40}
          placeholder="Например, «Конкурсы»"
          error={error ?? undefined}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setCreating(false);
            }
          }}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={submit} loading={create.isPending} disabled={!name.trim()}>
            Создать
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
            Отмена
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Select
      label="Категория"
      value={value}
      onChange={(e) =>
        e.target.value === NEW_CATEGORY ? setCreating(true) : onChange(e.target.value)
      }
      options={[
        { value: '', label: 'Без категории' },
        ...categories.map((c) => ({ value: c.id, label: c.name })),
        { value: NEW_CATEGORY, label: '＋ Создать категорию…' },
      ]}
    />
  );
}

/** Сама форма; монтируется заново при каждом открытии — значения всегда свежие. */
function ProjectForm({ project, onClose, onSubmittingChange }) {
  const navigate = useNavigate();
  const editing = Boolean(project);
  const typeLabelId = useId();
  const [formError, setFormError] = useState(null);
  const { data: categories = [] } = useCategories();
  const { data: workspaceTags = [] } = useTags();
  // Пока список тегов пространства грузится, выбранные теги проекта всё равно видны
  const tags = editing
    ? [...workspaceTags, ...project.tags.filter((t) => !workspaceTags.some((w) => w.id === t.id))]
    : workspaceTags;
  const { create: createTag } = useLabelMutations('tags');
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: editing ? toFormValues(project) : emptyProjectForm,
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    onSubmittingChange(true);
    try {
      if (editing) {
        await updateProject.mutateAsync({
          id: project.id,
          data: toPayload(values),
          // Теги отдельным запросом — только если их меняли
          tagIds: dirtyFields.tagIds ? values.tagIds : undefined,
        });
        toast.success('Проект сохранён');
        onClose();
      } else {
        const created = await createProject.mutateAsync({
          ...toPayload(values),
          tagIds: values.tagIds,
        });
        toast.success('Проект создан', { description: created.title });
        onClose();
        navigate(`/app/projects/${created.id}`);
      }
    } catch (error) {
      setFormError(applyServerError(error, setError));
    } finally {
      onSubmittingChange(false);
    }
  });

  return (
    <form id="project-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError && <Alert variant="danger">{formError}</Alert>}

      <Input
        label="Название"
        required
        autoFocus
        maxLength={120}
        placeholder="Например, «Альбом „Север“»"
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="flex flex-col gap-1.5">
        <span id={typeLabelId} className="text-sm font-medium text-fg">
          Творческий тип
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        </span>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <TypeSelect
              value={field.value}
              onChange={field.onChange}
              error={errors.type?.message}
              labelId={typeLabelId}
            />
          )}
        />
        {errors.type && <p className="text-xs text-danger">{errors.type.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Статус" options={statusOptions} {...register('status')} />
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <CategoryField value={field.value} onChange={field.onChange} categories={categories} />
          )}
        />
      </div>

      <Controller
        name="tagIds"
        control={control}
        render={({ field }) => (
          <TagInput
            value={field.value}
            onChange={field.onChange}
            tags={tags}
            onCreate={(name) => createTag.mutateAsync({ name })}
            hint="Enter — добавить или создать, Backspace — убрать последний"
            error={errors.tagIds?.message}
          />
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Начало"
          type="date"
          error={errors.startDate?.message}
          {...register('startDate')}
        />
        <Input
          label="Дедлайн"
          type="date"
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />
      </div>

      <Textarea
        label="Описание"
        rows={4}
        placeholder="О чём проект, какое настроение, что нужно сделать…"
        error={errors.description?.message}
        {...register('description')}
      />
    </form>
  );
}

/** Окно создания/редактирования проекта. Открывается через useProjectModal. */
export function ProjectFormModal() {
  const { open, project, close } = useProjectModal();
  const [submitting, setSubmitting] = useState(false);
  const editing = Boolean(project);

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={editing ? 'Редактировать проект' : 'Новый проект'}
      description={editing ? project.title : 'Название и тип — обязательно, остальное можно позже.'}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Отмена
          </Button>
          {/* Кнопка в подвале окна отправляет форму по её id */}
          <Button type="submit" form="project-form" loading={submitting}>
            {editing ? 'Сохранить' : 'Создать проект'}
          </Button>
        </>
      }
    >
      <ProjectForm
        key={project?.id ?? 'new'}
        project={project}
        onClose={close}
        onSubmittingChange={setSubmitting}
      />
    </Modal>
  );
}
