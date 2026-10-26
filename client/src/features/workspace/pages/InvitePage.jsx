import { Mail } from 'lucide-react';
import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui';

export default function InvitePage() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <title>Приглашение · Frame</title>
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-2">
        <Mail className="size-5 text-muted" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold text-fg">Приглашение в пространство</h1>
        <p className="text-sm text-muted">Принятие приглашений появится в версии 1.2.</p>
      </div>
      <Link to="/" className={buttonVariants({ variant: 'secondary', className: 'w-full' })}>
        На главную
      </Link>
    </div>
  );
}
