import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

const sizes = { sm: 'size-4', md: 'size-5', lg: 'size-8' };

export function Spinner({ size = 'md', label = 'Загрузка', className }) {
  return (
    <span role="status" className={cn('inline-flex', className)}>
      <LoaderCircle className={cn('animate-spin', sizes[size])} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
