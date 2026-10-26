import { useLocation, useNavigate, useSearchParams } from 'react-router';

/**
 * Открытая задача живёт в адресе: ?task=<id> — ссылкой можно поделиться, F5 её не закроет.
 * Открытие — новая запись в истории (кнопка «Назад» на телефоне закрывает окно);
 * закрытие — шаг назад, если окно открыли здесь же, иначе просто убираем параметр.
 */
export const useTaskParam = () => {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const openTask = (id) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('task', id);
        return next;
      },
      { state: { taskPanel: true }, preventScrollReset: true },
    );

  const closeTask = () => {
    if (location.state?.taskPanel) {
      navigate(-1);
      return;
    }
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('task');
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  };

  return { taskId: params.get('task'), openTask, closeTask };
};
