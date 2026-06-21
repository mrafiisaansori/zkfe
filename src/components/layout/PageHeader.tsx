import { ReactNode } from 'react';
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 sm:mb-7 sm:flex sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight text-ink sm:text-[1.7rem] sm:leading-tight">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="mt-4 flex gap-2 sm:mt-0">{action}</div>}
    </div>
  );
}
