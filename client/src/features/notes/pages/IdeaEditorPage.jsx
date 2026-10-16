import { Link, useParams } from 'react-router';
import { ArrowLeft, NotebookPen } from 'lucide-react';
import { PageStub } from '@/components/layout';

export default function IdeaEditorPage() {
  const { id } = useParams();

  return (
    <>
      <Link
        to="/app/ideas"
        className="focus-ring mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Идеи
      </Link>
      <PageStub
        title={`Заметка «${id}»`}
        description="Редактор: заголовок и Markdown с превью, автосохранение."
        stage={8}
        icon={NotebookPen}
      />
    </>
  );
}
