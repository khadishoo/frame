import { Lightbulb } from 'lucide-react';
import { PageStub } from '@/components/layout';

export default function IdeasPage() {
  return (
    <PageStub
      title="Идеи"
      description="Быстрые заметки, наброски и референсы. Любую идею можно превратить в проект."
      stage={8}
      icon={Lightbulb}
    />
  );
}
