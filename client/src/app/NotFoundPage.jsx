import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { m } from 'framer-motion';
import { Button, Logo, buttonVariants } from '@/components/ui';

/** Общий вид для 404 и ошибок роутера: «пустой кадр». */
export function ErrorScreen({ code, title, description }) {
  const navigate = useNavigate();

  return (
    <main className="bg-grain flex min-h-dvh flex-col items-center px-4 py-8">
      <title>{`${title} · Frame`}</title>
      <Link to="/" className="focus-ring rounded-md" aria-label="Frame — на главную">
        <Logo />
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12 text-center">
        <m.div
          className="relative flex h-40 w-56 items-center justify-center sm:h-48 sm:w-72"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Уголки видоискателя вокруг кода ошибки */}
          <svg
            className="absolute inset-0 size-full text-muted/50"
            viewBox="0 0 288 192"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M2 34V14A12 12 0 0 1 14 2h20M254 2h20a12 12 0 0 1 12 12v20M286 158v20a12 12 0 0 1-12 12h-20M34 190H14A12 12 0 0 1 2 178v-20"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span className="font-display text-[4.5rem] font-semibold leading-none tracking-tighter text-fg sm:text-[6rem]">
            {code}
          </span>
          <span className="absolute left-4 top-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-danger">
            <span className="size-1.5 animate-pulse rounded-full bg-danger" aria-hidden="true" />
            rec
          </span>
        </m.div>

        <div className="flex max-w-sm flex-col gap-2">
          <h1 className="text-xl font-semibold text-fg">{title}</h1>
          <p className="text-sm text-muted">{description}</p>
        </div>

        <div className="flex flex-col gap-2 xs:flex-row">
          <Button variant="secondary" leftIcon={<ArrowLeft />} onClick={() => navigate(-1)}>
            Назад
          </Button>
          <Link to="/app" className={buttonVariants()}>
            На дашборд
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function NotFoundPage() {
  return (
    <ErrorScreen
      code="404"
      title="Кадр не найден"
      description="Такой страницы нет — возможно, ссылка устарела или в адресе опечатка."
    />
  );
}
