import { Link, useParams } from 'react-router';
import {
  Activity,
  ArrowLeft,
  Archive,
  Ellipsis,
  Files,
  Kanban,
  LayoutGrid,
  ListChecks,
  Pencil,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Badge, Button, Dropdown, EmptyState, Tabs } from '@/components/ui';
import { toast } from '@/lib/toast';

// Вкладки страницы проекта и этапы, на которых они появятся
const tabs = [
  { value: 'overview', label: 'Обзор', icon: LayoutGrid, stage: 6 },
  { value: 'board', label: 'Доска', icon: Kanban, stage: 7 },
  { value: 'tasks', label: 'Задачи', icon: ListChecks, stage: 7 },
  { value: 'files', label: 'Файлы', icon: Files, stage: '12 (v1.1)' },
  { value: 'notes', label: 'Заметки', icon: StickyNote, stage: 8 },
  { value: 'activity', label: 'Активность', icon: Activity, stage: '14 (v1.3)' },
];

export default function ProjectPage() {
  const { id } = useParams();
  const soon = (what) => () => toast.info(`${what} — этап 6`);

  return (
    <>
      <Link
        to="/app/projects"
        className="focus-ring mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Проекты
      </Link>

      <PageHeader
        eyebrow={
          <div className="flex flex-wrap gap-2">
            <Badge type="music" />
            <Badge variant="success" dot>
              Активный
            </Badge>
          </div>
        }
        title={`Проект «${id}»`}
        description="Страница-заглушка: шапка, статус, меню действий и вкладки. Данные появятся на этапе 6."
        actions={
          <Dropdown
            trigger={
              <Button variant="secondary" size="icon" aria-label="Действия с проектом">
                <Ellipsis />
              </Button>
            }
            items={[
              { label: 'Редактировать', icon: Pencil, onSelect: soon('Редактирование') },
              { label: 'В архив', icon: Archive, onSelect: soon('Архивирование') },
              { type: 'separator' },
              { label: 'Удалить', icon: Trash2, danger: true, onSelect: soon('Удаление') },
            ]}
          />
        }
      />

      <Tabs
        label="Разделы проекта"
        items={tabs.map((tab) => ({
          ...tab,
          content: (
            <EmptyState
              icon={tab.icon}
              title={`Вкладка «${tab.label}»`}
              description={`Появится на этапе ${tab.stage}.`}
            />
          ),
        }))}
      />
    </>
  );
}
