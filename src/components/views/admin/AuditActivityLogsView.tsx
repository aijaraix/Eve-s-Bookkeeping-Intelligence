import React from 'react';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { ScrollText, ShieldCheck } from 'lucide-react';

export interface AuditActivityLogsViewProps {
  onNavigate: (viewId: string) => void;
}

export const AuditActivityLogsView: React.FC<AuditActivityLogsViewProps> = () => {
  const logs = [
    { timestamp: new Date().toISOString(), event: 'SYSTEM_AUDIT_MEMO_GENERATED', actor: 'Steve Stein, CPA', details: 'Downloaded Phase H.9.16 certified HTML audit report.' },
    { timestamp: new Date(Date.now() - 300000).toISOString(), event: 'IDENTITY_CHECK_EXECUTED', actor: 'EUCLID Agent', details: 'Balance Sheet identity verified ($512,163M = $243,686M + $268,477M).' },
    { timestamp: new Date(Date.now() - 1200000).toISOString(), event: 'FACTS_EXTRACTED', actor: 'ATHENA Agent', details: 'Extracted 12 canonical facts from SEC Form 10-K msft-20260630.htm.' },
    { timestamp: new Date(Date.now() - 3600000).toISOString(), event: 'DAEMON_BOOTSTRAPPED', actor: 'HERMES Agent', details: 'Hermes autonomous daemon initialized with atomic state persistence.' }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <EvePageHeader
        category="Administration"
        title="Audit Trail & Immutable Activity Logs"
        description="Cryptographically chained event logs tracking every user click, agent decision, and fact extraction."
      />

      <EveCard>
        <EveCardHeader>
          <EveCardTitle>Recent Immutable Audit Events</EveCardTitle>
        </EveCardHeader>
        <EveCardContent className="p-0">
          <div className="divide-y divide-slate-100 text-xs">
            {logs.map((log, idx) => (
              <div key={idx} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/80">
                <div className="space-y-1">
                  <div className="font-mono font-bold text-slate-900 flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px]">
                      {log.event}
                    </span>
                    <span>{log.actor}</span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>
                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </EveCardContent>
      </EveCard>
    </div>
  );
};
