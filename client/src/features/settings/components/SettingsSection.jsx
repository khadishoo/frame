/** Карточка-раздел на страницах настроек. */
export function SettingsSection({ title, description, children }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-soft sm:p-6">
      <title>{`${title} · Настройки · Frame`}</title>
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}
