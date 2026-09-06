import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';

export interface EvePageHeaderProps {
  category?: string;
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const EvePageHeader: React.FC<EvePageHeaderProps> = ({
  category,
  title,
  description,
  breadcrumbs,
  actions,
  children,
  className
}) => {
  return (
    <div className={cn('mb-6 pb-4 border-b border-slate-200/80', className)}>
      {/* Breadcrumbs / Category */}
      {(breadcrumbs || category) && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium tracking-wide">
          {category && (
            <span className="uppercase text-slate-400 font-semibold tracking-wider text-[10px] bg-slate-100 px-2 py-0.5 rounded">
              {category}
            </span>
          )}
          {breadcrumbs?.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
              {crumb.onClick ? (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-slate-600">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Main Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {actions}
          </div>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
