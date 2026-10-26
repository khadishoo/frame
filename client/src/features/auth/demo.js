/**
 * Публичный демо-аккаунт (создаёт сид сервера: npm run seed). Пароль известен всем — поэтому
 * на сервере его нельзя сменить, а аккаунт нельзя удалить (403 DEMO_ACCOUNT).
 * VITE_DEMO_LOGIN=false скрывает кнопку «Войти как демо».
 */
export const DEMO_CREDENTIALS = { email: 'demo@frame.local', password: 'demo-password' };

export const demoLoginEnabled = import.meta.env.VITE_DEMO_LOGIN !== 'false';
