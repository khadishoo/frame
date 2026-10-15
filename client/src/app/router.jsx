import { createBrowserRouter } from 'react-router';
import HomePage from '@/features/home/pages/HomePage';
import NotFoundPage from './NotFoundPage';

// Все маршруты MVP появятся на этапе 3
export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '*', element: <NotFoundPage /> },
]);
