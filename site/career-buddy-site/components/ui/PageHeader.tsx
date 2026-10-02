import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-10 border-b border-line pb-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>

          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
