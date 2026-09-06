import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

export type BadgeStatus =
  | 'verified'
  | 'clean'
  | 'unverified'
  | 'review_required'
  | 'processing'
  | 'running'
  | 'healthy'
  | 'degraded'
  | 'failed'
  | 'idle'
  | 'cooldown'
  | 'ready'
  | 'draft'
  | 'neutral';

export interface EveStatusBadgeProps {
  status: BadgeStatus | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const EveStatusBadge: React.FC<EveStatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showIcon = true,
  className
}) => {
  const norm = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  let config = {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: Clock,
    defaultLabel: label || status
  };

  if (norm.includes('verified') || norm.includes('clean') || norm.includes('healthy') || norm.includes('pass') || norm.includes('ready')) {
    config = {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700 font-medium',
      border: 'border-emerald-200/80',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
      defaultLabel: label || (norm.includes('clean') ? 'Clean Opinion' : 'Verified')
    };
  } else if (norm.includes('review') || norm.includes('warning') || norm.includes('degraded') || norm.includes('monitor')) {
    config = {
      bg: 'bg-amber-50',
      text: 'text-amber-800 font-medium',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      icon: AlertCircle,
      defaultLabel: label || 'Review Required'
    };
  } else if (norm.includes('failed') || norm.includes('critical') || norm.includes('error') || norm.includes('unavailable')) {
    config = {
      bg: 'bg-rose-50',
      text: 'text-rose-700 font-medium',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      icon: ShieldAlert,
      defaultLabel: label || 'Failed'
    };
  } else if (norm.includes('processing') || norm.includes('running') || norm.includes('active')) {
    config = {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700 font-medium',
      border: 'border-indigo-200',
      dot: 'bg-indigo-500 animate-pulse',
      icon: Sparkles,
      defaultLabel: label || 'Processing'
    };
  } else if (norm.includes('cooldown') || norm.includes('paused')) {
    config = {
      bg: 'bg-sky-50',
      text: 'text-sky-700 font-medium',
      border: 'border-sky-200',
      dot: 'bg-sky-400',
      icon: Clock,
      defaultLabel: label || 'Cooldown'
    };
  }

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border tracking-normal transition-colors select-none whitespace-nowrap',
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5', 'shrink-0')} />}
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};
