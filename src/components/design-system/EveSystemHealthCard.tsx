import React from 'react';
import { cn } from '../../lib/utils';
import { EveCard, EveCardContent } from './EveCard';
import { EveStatusBadge } from './EveStatusBadge';
import { SystemServiceHealth } from '../../types/presentationModels';
import { Server, Activity, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

export interface EveSystemHealthCardProps {
  service: SystemServiceHealth;
  onRefresh?: () => void;
  className?: string;
}

export const EveSystemHealthCard: React.FC<EveSystemHealthCardProps> = ({
  service,
  onRefresh,
  className
}) => {
  const isHealthy = service.status === 'HEALTHY';

  return (
    <EveCard className={cn('overflow-hidden', className)}>
      <EveCardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center',
                isHealthy ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
              )}
            >
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                {service.name}
              </h4>
              <p className="text-xs text-slate-400 font-mono truncate max-w-[200px]">
                {service.identifier}
              </p>
            </div>
          </div>

          <EveStatusBadge
            status={service.status === 'HEALTHY' ? 'healthy' : 'failed'}
            label={service.status}
            size="sm"
          />
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Latency</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Activity className="w-3 h-3 text-slate-400" />
              {service.latencyMs > 0 ? `${service.latencyMs} ms` : 'Sub-millisecond'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Verified Status</span>
            <span className={cn('font-medium', service.verified ? 'text-emerald-700' : 'text-amber-700')}>
              {service.verified ? 'Certified Active' : 'Unconfirmed'}
            </span>
          </div>
          {service.memoryMb !== undefined && (
            <div>
              <span className="text-slate-400 block text-[11px] font-sans">Memory</span>
              <span className="text-slate-700">{service.memoryMb} MB</span>
            </div>
          )}
          {service.uptimeSeconds > 0 && (
            <div>
              <span className="text-slate-400 block text-[11px] font-sans">Uptime</span>
              <span className="text-slate-700">{Math.floor(service.uptimeSeconds / 60)} min</span>
            </div>
          )}
        </div>

        {/* URL / Details */}
        <div className="mt-3 flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400 font-mono text-[11px] truncate max-w-[220px]" title={service.url}>
            {service.url}
          </span>
          {service.details && (
            <span className="text-slate-500 text-[11px] truncate">{service.details}</span>
          )}
        </div>
      </EveCardContent>
    </EveCard>
  );
};
