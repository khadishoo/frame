import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listLabels } from '@/api/labels';
import { createProject, setProjectTags, updateProject } from '@/api/projects';
import { listWorkspaces } from '@/api/workspaces';
import { useAuthStore } from '@/features/auth/authStore';
import { demoWorkspace, makeProject, renderWithProviders } from '@/test/utils';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { useProjectModal } from '../projectModalStore';

vi.mock('@/api/workspaces', () => ({ listWorkspaces: vi.fn() }));
vi.mock('@/api/labels', () => ({ listLabels: vi.fn(), createLabel: vi.fn() }));
vi.mock('@/api/projects', () => ({
  createProject: vi.fn(),
  updateProject: vi.fn(),
  setProjectTags: vi.fn(),
  getProject: vi.fn(),
}));

const categories = [{ id: 'c-1', name: 'Работа', color: 'blue', projectCount: 0 }];
const tags = [{ id: 't-1', name: 'лофи', color: 'teal', projectCount: 0 }];

const renderModal = () =>
  renderWithProviders(
    [
      { path: '/app', element: <ProjectFormModal /> },
      { path: '/app/projects/:id', element: <p>Страница проекта</p> },
    ],
    { url: '/app' },
  );

// input type=date в jsdom заполняем напрямую (без календаря браузера)
const setDate = (label, value) => {
  const input = within(screen.getByRole('dialog')).getByLabelText(label);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};

const submit = (ui) => ui.click(screen.getByRole('button', { name: /Создать проект|Сохранить/ }));

describe('Окно проекта', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listWorkspaces).mockResolvedValue({ items: [demoWorkspace] });
    vi.mocked(listLabels).mockImplementation(async (kind) => (kind === 'tags' ? tags : categories));
    useAuthStore.setState({ status: 'authenticated', user: { id: 'u-1' }, accessToken: 'jwt' });
  });

  it('пустая форма: название и тип обязательны, запрос не уходит', async () => {
    useProjectModal.getState().openCreate();
    const ui = userEvent.setup();
    renderModal();

    await submit(ui);

    expect(await screen.findByText('Введите название')).toBeInTheDocument();
    expect(screen.getByText('Выберите творческий тип')).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it('дедлайн раньше даты начала — ошибка у поля «Дедлайн»', async () => {
    useProjectModal.getState().openCreate();
    const ui = userEvent.setup();
    renderModal();

    await ui.type(screen.getByLabelText(/Название/), 'Клип');
    await ui.click(screen.getByRole('radio', { name: 'Видео' }));
    setDate('Начало', '2026-12-10');
    setDate('Дедлайн', '2026-12-01');
    await submit(ui);

    expect(await screen.findByText('Дедлайн не может быть раньше даты начала')).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it('создание: правильное тело запроса, переход на страницу проекта', async () => {
    vi.mocked(createProject).mockResolvedValue(makeProject({ id: 'new-1', title: 'Клип' }));
    useProjectModal.getState().openCreate();
    const ui = userEvent.setup();
    const { router } = renderModal();
    await screen.findByRole('option', { name: 'Работа' });

    await ui.type(screen.getByLabelText(/Название/), '  Клип  ');
    await ui.click(screen.getByRole('radio', { name: 'Видео' }));
    await ui.selectOptions(screen.getByLabelText('Статус'), 'idea');
    await ui.selectOptions(screen.getByLabelText('Категория'), 'c-1');
    // <select> тоже «combobox» — поле тегов ищем по подписи
    await ui.type(screen.getByRole('combobox', { name: 'Теги' }), 'лоф{Enter}');
    setDate('Дедлайн', '2026-12-24');
    await submit(ui);

    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/app/projects/new-1'));
    expect(createProject).toHaveBeenCalledWith(demoWorkspace.id, {
      title: 'Клип',
      description: null,
      type: 'video',
      status: 'idea',
      categoryId: 'c-1',
      startDate: null,
      dueDate: '2026-12-24',
      tagIds: ['t-1'],
    });
    expect(useProjectModal.getState().open).toBe(false);
  });

  it('редактирование: поля заполнены; теги не трогали — отдельный запрос тегов не уходит', async () => {
    const project = makeProject({
      title: 'Альбом',
      category: categories[0],
      tags: [tags[0]],
      dueDate: '2026-12-31',
    });
    vi.mocked(updateProject).mockResolvedValue({ ...project, title: 'Альбом (ремастер)' });
    useProjectModal.getState().openEdit(project);
    const ui = userEvent.setup();
    renderModal();

    const title = screen.getByLabelText(/Название/);
    expect(title).toHaveValue('Альбом');
    expect(screen.getByRole('radio', { name: 'Музыка' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('button', { name: 'Убрать тег лофи' })).toBeInTheDocument();

    await ui.clear(title);
    await ui.type(title, 'Альбом (ремастер)');
    await submit(ui);

    await vi.waitFor(() => expect(updateProject).toHaveBeenCalled());
    expect(updateProject.mock.calls[0][1]).toMatchObject({
      title: 'Альбом (ремастер)',
      categoryId: 'c-1',
      dueDate: '2026-12-31',
    });
    expect(setProjectTags).not.toHaveBeenCalled();
  });
});
