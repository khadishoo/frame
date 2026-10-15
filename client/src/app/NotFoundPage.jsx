import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-zinc-500 dark:text-zinc-400">Такой страницы нет</p>
      <Link to="/" className="text-violet-600 hover:underline dark:text-violet-400">
        На главную
      </Link>
    </main>
  );
}
