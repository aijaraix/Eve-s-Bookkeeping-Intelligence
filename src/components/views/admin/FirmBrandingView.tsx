import React, { useState } from 'react';
import { EvePageHeader } from '../../design-system/EvePageHeader';
import { EveCard, EveCardHeader, EveCardTitle, EveCardContent } from '../../design-system/EveCard';
import { Settings, Building, Save } from 'lucide-react';

export interface FirmBrandingViewProps {
  onNavigate: (viewId: string) => void;
}

export const FirmBrandingView: React.FC<FirmBrandingViewProps> = () => {
  const [firmName, setFirmName] = useState('Stein & Associates CPA LLP');
  const [license, setLicense] = useState('CPA-NY-098234 / PCAOB-Registered');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <EvePageHeader
        category="Administration"
        title="Firm Profile & Statutory Branding"
        description="Configure firm license credentials, letterheads, and partner signature attestations for audit deliverables."
      />

      <EveCard>
        <EveCardHeader>
          <EveCardTitle>Firm Identity Settings</EveCardTitle>
        </EveCardHeader>
        <EveCardContent className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">CPA Firm Legal Name</label>
            <input
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">PCAOB / State Board Registration</label>
            <input
              type="text"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Firm Profile
            </button>
          </div>
        </EveCardContent>
      </EveCard>
    </div>
  );
};
