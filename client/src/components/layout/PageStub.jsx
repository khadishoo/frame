import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { PageHeader } from './PageHeader';

/**
 * Временная страница-заглушка: заголовок раздела и этап плана, на котором он появится.
 * Удаляется по мере реализации разделов.
 */
export function PageStub({ title, description, stage, icon = Construction, actions, children }) {
  return (
    <>
      <PageHeader title={title} description={description} actions={actions} />
      {children ?? (
        <EmptyState
          icon={icon}
          title="Раздел в разработке"
          description={`Появится на этапе ${stage} по плану разработки.`}
        />
      )}
    </>
  );
}
