import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon, FileText, UploadCloud, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface EveEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: ReactNode;
  variant?: 'neutral' | 'clean_audit' | 'waiting_intake' | 'error';
  className?: string;
}

export const EveEmptyState: React.FC<EveEmptyStateProps> = ({
  icon: CustomIcon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
  variant = 'neutral',
  className
}) => {
  let DefaultIcon = FileText;
  let iconBg = 'bg-slate-100 text-slate-500';

  if (variant === 'clean_audit') {
    DefaultIcon = CheckCircle2;
    iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
  } else if (variant === 'waiting_intake') {
    DefaultIcon = UploadCloud;
    iconBg = 'bg-indigo-50 text-indigo-600 border border-indigo-200';
  } else if (variant === 'error') {
    DefaultIcon = ShieldAlert;
    iconBg = 'bg-rose-50 text-rose-600 border border-rose-200';
  }

  const Icon = CustomIcon || DefaultIcon;

  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-slate-200 bg-white/70 p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6',
        className
      )}
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-2xs', iconBg)}>
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 tracking-tight mb-1.5">
        {title}
      </h3>

      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryAction) && (
        <div className="flex items-center gap-3">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
