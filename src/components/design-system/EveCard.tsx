import React, { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface EveCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'subtle' | 'highlight';
}

export const EveCard = React.forwardRef<HTMLDivElement, EveCardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border transition-all duration-150',
          variant === 'default' && 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300',
          variant === 'flat' && 'bg-slate-50/50 border-slate-200/60',
          variant === 'subtle' && 'bg-white border-slate-100 shadow-2xs',
          variant === 'highlight' && 'bg-indigo-50/30 border-indigo-200/80 shadow-xs',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
EveCard.displayName = 'EveCard';

export const EveCardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn('px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const EveCardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3
      className={cn('text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </h3>
  );
};

export const EveCardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p className={cn('text-xs text-slate-500 mt-0.5', className)} {...props}>
      {children}
    </p>
  );
};

export const EveCardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
};
