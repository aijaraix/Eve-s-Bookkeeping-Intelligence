import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Award,
  Save,
  CheckCircle2,
  Server,
  Lock,
  HardDrive,
  FileCheck
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';

export const FirmSettingsView: React.FC = () => {
  const { firmBranding, updateFirmBranding } = usePractice();

  const [firmName, setFirmName] = useState(firmBranding?.firmName || "Eve's CPA & Advisory LLP");
  const [partnerName, setPartnerName] = useState(firmBranding?.partnerName || 'Managing Partner, CPA / CA');
  const [licenseNumber, setLicenseNumber] = useState(firmBranding?.licenseNumber || 'CPA-PCAOB-982410');
  const [address, setAddress] = useState(firmBranding?.address || '100 Financial Center Blvd, Suite 4000, New York, NY 10005');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateFirmBranding) {
      updateFirmBranding({
        firmName,
        partnerName,
        licenseNumber,
        address
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>FIRM GOVERNANCE & CPA REGISTRATION</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 font-mono">
          CPA Practice Branding & Audit Firm Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure CPA practice credentials, partner signature blocks, and working paper header branding for formal deliverables.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 uppercase mb-1.5">
              CPA Firm Legal Entity Name
            </label>
            <input
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 uppercase mb-1.5">
              CPA License / Registration #
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 uppercase mb-1.5">
              Managing Engagement Partner
            </label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-700 uppercase mb-1.5">
              Principal Office Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Applies to all generated audit memoranda and deliverable packages</span>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-mono rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Settings Saved' : 'Save Firm Credentials'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
