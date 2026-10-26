import { FolderTree, Hash } from 'lucide-react';
import { LabelManager } from '@/features/labels/components/LabelManager';
import { useCategories, useTags } from '@/features/labels/hooks/useLabels';
import { SettingsSection } from '../components/SettingsSection';

export default function LabelsSettingsPage() {
  const categories = useCategories();
  const tags = useTags();

  return (
    <>
      <title>Категории и теги · Настройки · Frame</title>
      <SettingsSection
        title="Категории"
        description="У проекта одна категория — например, «Работа» или «Для себя». Кликните по названию, чтобы переименовать."
      >
        <LabelManager
          kind="categories"
          labels={categories.data ?? []}
          isPending={categories.isPending}
          error={categories.error}
          onRetry={categories.refetch}
          retrying={categories.isRefetching}
          texts={{
            loadError: 'Не удалось загрузить категории',
            placeholder: 'Новая категория',
            emptyIcon: FolderTree,
            emptyTitle: 'Категорий нет',
            emptyText: 'Добавьте первую — например, «Учёба».',
            deleted: 'Категория удалена',
            deleteHint: 'Проекты останутся — просто без категории.',
          }}
        />
      </SettingsSection>

      <SettingsSection
        title="Теги"
        description="Тегов у проекта может быть сколько угодно. Новые теги удобно создавать прямо в форме проекта."
      >
        <LabelManager
          kind="tags"
          labels={tags.data ?? []}
          isPending={tags.isPending}
          error={tags.error}
          onRetry={tags.refetch}
          retrying={tags.isRefetching}
          texts={{
            loadError: 'Не удалось загрузить теги',
            placeholder: 'Новый тег',
            emptyIcon: Hash,
            emptyTitle: 'Тегов пока нет',
            emptyText: 'Например: «черновик», «для портфолио», «срочно».',
            deleted: 'Тег удалён',
            deleteHint: 'Тег пропадёт у всех проектов, сами проекты останутся.',
          }}
        />
      </SettingsSection>
    </>
  );
}
