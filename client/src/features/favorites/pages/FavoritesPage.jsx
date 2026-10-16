import { Star } from 'lucide-react';
import { PageStub } from '@/components/layout';

export default function FavoritesPage() {
  return (
    <PageStub
      title="Избранное"
      description="Проекты и заметки, которые вы отметили звёздочкой."
      stage={8}
      icon={Star}
    />
  );
}
