import { Link } from 'react-router';
import { FolderKanban, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Badge, Button, EmptyState, buttonVariants } from '@/components/ui';
import { PROJECT_TYPE_KEYS } from '@/lib/projectTypes';
import { toast } from '@/lib/toast';

export default function ProjectsPage() {
  const create = () => toast.info('Создание проектов — этап 6');

  return (
    <>
      <PageHeader
        title="Проекты"
        description="Все творческие проекты пространства: сетка или список, фильтры и сортировка."
        actions={
          <Button leftIcon={<Plus />} onClick={create}>
            Новый проект
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2" aria-label="Творческие типы">
        {PROJECT_TYPE_KEYS.map((type) => (
          <Badge key={type} type={type} />
        ))}
      </div>

      <EmptyState
        icon={FolderKanban}
        title="Проектов пока нет"
        description="Список, фильтры и карточки проектов появятся на этапе 6."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={create}>
              Создать проект
            </Button>
            <Link to="/app/projects/demo" className={buttonVariants({ variant: 'ghost' })}>
              Открыть пример страницы проекта
            </Link>
          </div>
        }
      />
    </>
  );
}
