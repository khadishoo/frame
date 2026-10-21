import { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  Copy,
  FolderPlus,
  Kanban,
  LayoutGrid,
  ListChecks,
  Mail,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from 'lucide-react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  Input,
  Logo,
  LogoMark,
  Modal,
  PasswordInput,
  Select,
  Skeleton,
  Spinner,
  Tabs,
  Textarea,
  ThemeToggle,
} from '@/components/ui';
import ApiStatus from '@/features/health/components/ApiStatus';
import { PROJECT_TYPES, PROJECT_TYPE_KEYS } from '@/lib/projectTypes';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/cn';

const sections = [
  ['tokens', 'Цвета'],
  ['typography', 'Типографика'],
  ['buttons', 'Button'],
  ['forms', 'Поля форм'],
  ['badges', 'Badge и Avatar'],
  ['tabs', 'Tabs'],
  ['overlays', 'Dropdown, Modal, Confirm'],
  ['toasts', 'Toast и Alert'],
  ['loading', 'Skeleton и Spinner'],
  ['empty', 'EmptyState'],
  ['brand', 'Логотип'],
];

const colorTokens = [
  ['bg', 'bg-bg'],
  ['surface', 'bg-surface'],
  ['surface-2', 'bg-surface-2'],
  ['border', 'bg-border'],
  ['text', 'bg-fg'],
  ['text-muted', 'bg-muted'],
  ['accent', 'bg-accent'],
  ['danger', 'bg-danger'],
  ['success', 'bg-success'],
  ['warning', 'bg-warning'],
];

const typeScale = [
  ['3xl · 48', 'text-3xl font-display font-semibold'],
  ['2xl · 32', 'text-2xl font-display font-semibold'],
  ['xl · 24', 'text-xl font-display font-semibold'],
  ['lg · 20', 'text-lg font-semibold'],
  ['base · 16', 'text-base'],
  ['sm · 14', 'text-sm'],
  ['xs · 12', 'text-xs'],
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 text-lg font-semibold text-fg">{title}</h2>
      <div className="rounded-xl border border-border bg-surface p-5 shadow-soft sm:p-6">
        {children}
      </div>
    </section>
  );
}

function Row({ label, children, className }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
      {label && (
        <span className="text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      )}
      <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>
    </div>
  );
}

function OverlaysDemo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Row label="Dropdown">
        <Dropdown
          align="start"
          trigger={<Button variant="secondary">Открыть меню</Button>}
          items={[
            { type: 'label', label: 'Проект' },
            { label: 'Редактировать', icon: Pencil, shortcut: 'E' },
            { label: 'Дублировать', icon: Copy },
            { label: 'Недоступно', icon: Settings, disabled: true },
            { type: 'separator' },
            {
              label: 'Удалить',
              icon: Trash2,
              danger: true,
              onSelect: () => toast.error('Удалено (понарошку)'),
            },
          ]}
        />
      </Row>
      <Row label="Modal и ConfirmDialog">
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          Открыть модалку
        </Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          Удалить проект
        </Button>
      </Row>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Новый проект"
        description="Фокус заперт внутри окна. Esc или клик по фону — закрыть."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                toast.success('Проект создан', { description: 'Это демо — ничего не сохранено' });
              }}
            >
              Создать
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Название" placeholder="Альбом «Север»" required />
          <Select
            label="Тип"
            defaultValue="music"
            options={PROJECT_TYPE_KEYS.map((key) => ({
              value: key,
              label: PROJECT_TYPES[key].label,
            }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        danger
        title="Удалить проект?"
        description="Проект «Альбом „Север“» и все его задачи будут удалены. Это действие нельзя отменить."
        confirmText="Удалить"
        onConfirm={async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          toast.success('Проект удалён');
        }}
      />
    </>
  );
}

/** Витрина UI-кита. Доступна только в режиме разработки: /dev/ui */
export default function UiKitPage() {
  const [loading, setLoading] = useState(false);

  const fakeLoad = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="min-h-dvh bg-bg">
      <title>UI-кит · Frame</title>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="focus-ring rounded-md">
            <Logo />
          </Link>
          <Badge variant="outline" className="hidden xs:inline-flex">
            UI-кит · dev
          </Badge>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-4 py-8 sm:px-6">
        <nav
          aria-label="Разделы витрины"
          className="sticky top-20 hidden h-fit w-48 shrink-0 lg:block"
        >
          <ul className="flex flex-col gap-0.5">
            {sections.map(([id, title]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="focus-ring block rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex min-w-0 flex-1 flex-col gap-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-fg">UI-кит</h1>
              <p className="mt-1 text-muted">
                Все компоненты во всех вариантах. Переключите тему сверху.
              </p>
            </div>
            <ApiStatus />
          </div>

          <Section id="tokens" title="Цвета">
            <Row
              label="Токены интерфейса"
              className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-5"
            >
              {colorTokens.map(([name, className]) => (
                <div key={name} className="flex flex-col gap-1.5">
                  <span
                    className={cn('h-12 rounded-lg ring-1 ring-inset ring-border', className)}
                  />
                  <code className="text-xs text-muted">--{name}</code>
                </div>
              ))}
            </Row>
            <Row
              label="Творческие типы"
              className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-7"
            >
              {PROJECT_TYPE_KEYS.map((key) => {
                const { label, icon: Icon, dot, soft, text } = PROJECT_TYPES[key];
                return (
                  <div key={key} className="flex flex-col gap-1.5">
                    <span className={cn('flex h-12 items-center justify-center rounded-lg', soft)}>
                      <Icon className={cn('size-5', text)} aria-hidden="true" />
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <span className={cn('size-2 rounded-full', dot)} />
                      {label}
                    </span>
                  </div>
                );
              })}
            </Row>
          </Section>

          <Section id="typography" title="Типографика">
            <Row
              label="Space Grotesk — заголовки, Inter — текст"
              className="flex-col items-start gap-2"
            >
              {typeScale.map(([label, className]) => (
                <div key={label} className="flex w-full items-baseline gap-4">
                  <code className="w-20 shrink-0 text-xs text-muted">{label}</code>
                  <span className={cn('truncate text-fg', className)}>Творить в рамке</span>
                </div>
              ))}
            </Row>
          </Section>

          <Section id="buttons" title="Button">
            <Row label="Варианты">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </Row>
            <Row label="Размеры">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Row>
            <Row label="С иконками и иконки">
              <Button leftIcon={<Plus />}>Новый проект</Button>
              <Button variant="secondary" rightIcon={<ArrowRight />}>
                Далее
              </Button>
              <Button variant="secondary" size="icon" aria-label="Поиск">
                <Search />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Настройки">
                <Settings />
              </Button>
            </Row>
            <Row label="Состояния">
              <Button loading={loading} onClick={fakeLoad}>
                {loading ? 'Сохраняю…' : 'Нажми — loading'}
              </Button>
              <Button variant="secondary" loading>
                Загрузка
              </Button>
              <Button disabled>Disabled</Button>
              <Button variant="danger" disabled>
                Disabled
              </Button>
            </Row>
          </Section>

          <Section id="forms" title="Поля форм">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Название проекта"
                placeholder="Например, «Короткий метр»"
                hint="До 120 символов"
              />
              <Input
                label="Email"
                type="email"
                leftIcon={Mail}
                placeholder="you@example.com"
                required
              />
              <Input label="С ошибкой" defaultValue="ab" error="Минимум 3 символа" />
              <Input label="Отключено" defaultValue="Только чтение" disabled />
              <PasswordInput
                label="Пароль"
                placeholder="Минимум 8 символов"
                hint="С кнопкой «показать»"
              />
              <PasswordInput
                label="Пароль с ошибкой"
                defaultValue="short"
                error="Пароль — минимум 8 символов"
              />
              <Select
                label="Творческий тип"
                placeholder="Выберите тип"
                defaultValue=""
                options={PROJECT_TYPE_KEYS.map((key) => ({
                  value: key,
                  label: PROJECT_TYPES[key].label,
                }))}
              />
              <Select
                label="Приоритет"
                defaultValue="medium"
                options={[
                  { value: 'low', label: 'Низкий' },
                  { value: 'medium', label: 'Средний' },
                  { value: 'high', label: 'Высокий' },
                  { value: 'urgent', label: 'Срочный' },
                ]}
              />
              <Textarea
                label="Описание"
                placeholder="О чём проект, какое настроение, что нужно сделать…"
                className="sm:col-span-2"
              />
              <div className="flex flex-col gap-3 sm:col-span-2">
                <Checkbox label="Закрепить заметку" defaultChecked />
                <Checkbox
                  label="Уведомлять о дедлайнах"
                  description="За день до срока и в день дедлайна"
                />
                <Checkbox label="Отключено" disabled />
              </div>
            </div>
          </Section>

          <Section id="badges" title="Badge и Avatar">
            <Row label="Статусы">
              <Badge>Neutral</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success" dot>
                Активный
              </Badge>
              <Badge variant="warning" dot>
                На паузе
              </Badge>
              <Badge variant="danger" dot>
                Просрочено
              </Badge>
              <Badge variant="accent">Новое</Badge>
            </Row>
            <Row label="Творческие типы">
              {PROJECT_TYPE_KEYS.map((key) => (
                <Badge key={key} type={key} />
              ))}
            </Row>
            <Row label="Avatar: размеры, инициалы, картинка, ошибка загрузки">
              <Avatar name="Анна Ким" size="xs" />
              <Avatar name="Анна Ким" size="sm" />
              <Avatar name="Борис Лев" size="md" />
              <Avatar name="Вера Мир" size="lg" />
              <Avatar name="Глеб" size="xl" />
              <Avatar
                name="Фото"
                size="lg"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cdefs%3E%3ClinearGradient id='g' x2='1' y2='1'%3E%3Cstop stop-color='%23f4634f'/%3E%3Cstop offset='1' stop-color='%238b5cf6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='40' height='40' fill='url(%23g)'/%3E%3C/svg%3E"
              />
              <Avatar name="Битая ссылка" size="lg" src="/does-not-exist.png" />
            </Row>
          </Section>

          <Section id="tabs" title="Tabs">
            <Row label="Underline (←/→ — переключение с клавиатуры)" className="block">
              <Tabs
                label="Демо-вкладки"
                items={[
                  {
                    value: 'overview',
                    label: 'Обзор',
                    icon: LayoutGrid,
                    content: <p className="text-sm text-muted">Содержимое вкладки «Обзор».</p>,
                  },
                  {
                    value: 'board',
                    label: 'Доска',
                    icon: Kanban,
                    content: <p className="text-sm text-muted">Здесь будет Kanban.</p>,
                  },
                  {
                    value: 'tasks',
                    label: 'Задачи',
                    icon: ListChecks,
                    count: 12,
                    content: <p className="text-sm text-muted">Таблица задач.</p>,
                  },
                ]}
              />
            </Row>
            <Row label="Pills" className="block">
              <Tabs
                variant="pills"
                label="Вид списка"
                items={[
                  { value: 'grid', label: 'Сетка' },
                  { value: 'list', label: 'Список' },
                  { value: 'archive', label: 'Архив' },
                ]}
              />
            </Row>
          </Section>

          <Section id="overlays" title="Dropdown, Modal, ConfirmDialog">
            <OverlaysDemo />
          </Section>

          <Section id="toasts" title="Toast и Alert">
            <Row>
              <Button variant="secondary" onClick={() => toast.success('Проект создан')}>
                Success
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  toast.error('Не удалось сохранить', {
                    description: 'Проверьте соединение и попробуйте ещё раз',
                  })
                }
              >
                Error
              </Button>
              <Button variant="secondary" onClick={() => toast.warning('Дедлайн завтра')}>
                Warning
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast.info('Изменения сохранены автоматически')}
              >
                Info
              </Button>
            </Row>
            <Row
              label="Alert — сообщение внутри страницы или формы"
              className="flex-col items-stretch"
            >
              <Alert variant="danger">Неверный email или пароль</Alert>
              <Alert variant="warning" title="Дедлайн завтра">
                Осталось 3 задачи в проекте «Альбом»
              </Alert>
              <Alert variant="success">Изменения сохранены</Alert>
              <Alert variant="info">Сброс пароля по email появится позже</Alert>
            </Row>
          </Section>

          <Section id="loading" title="Skeleton и Spinner">
            <Row label="Карточка проекта (скелетон)">
              <div className="w-full max-w-xs rounded-xl border border-border p-4">
                <Skeleton className="mb-4 h-28 w-full" />
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-4 h-3 w-1/2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="size-6 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </Row>
            <Row label="Spinner">
              <Spinner size="sm" />
              <Spinner />
              <Spinner size="lg" />
            </Row>
          </Section>

          <Section id="empty" title="EmptyState">
            <EmptyState
              icon={FolderPlus}
              title="Пока ни одного проекта"
              description="Соберите идеи, референсы и задачи в одном месте."
              action={<Button leftIcon={<Plus />}>Создать проект</Button>}
            />
          </Section>

          <Section id="brand" title="Логотип">
            <Row>
              <Logo />
              <LogoMark className="size-12 text-fg" />
              <span className="flex size-12 items-center justify-center rounded-xl bg-accent">
                <LogoMark className="size-8 text-accent-fg" />
              </span>
              <LogoMark className="size-12 text-type-music" />
            </Row>
          </Section>
        </main>
      </div>
    </div>
  );
}
