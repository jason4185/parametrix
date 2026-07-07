type PageHeaderProps = {
  actions?: React.ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: React.ReactNode;
};

export function PageHeader({
  actions,
  eyebrow,
  subtitle,
  title,
}: PageHeaderProps) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan/80">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-text sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 text-base leading-7 text-slate-300">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
