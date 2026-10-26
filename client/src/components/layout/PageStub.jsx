import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { PageHeader } from './PageHeader';

/**
 * Временная страница-заглушка: заголовок раздела и версия, в которой он появится.
 * Удаляется по мере реализации разделов.
 */
export function PageStub({ title, description, version, icon = Construction, actions, children }) {
  return (
    <>
      <PageHeader title={title} description={description} actions={actions} />
      {children ?? (
        <EmptyState
          icon={icon}
          title="Раздел в разработке"
          description={`Появится в версии ${version}.`}
        />
      )}
    </>
  );
}
