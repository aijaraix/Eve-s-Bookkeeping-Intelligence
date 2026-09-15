import React from 'react';
import type { ReportDataContract } from '../types/reportDataContract';

interface ReportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportGenerated?: (report: ReportDataContract) => void;
}

// Historical entry points remain informative and cannot compile or download artifacts.
export const ReportWizardModal: React.FC<ReportWizardModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="legacy-report-title" className="max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 id="legacy-report-title" className="text-lg font-semibold">Use the existing draft review package</h2>
        <p className="mt-3 text-sm text-slate-600">
          Legacy issuance is disabled. Open Company 1 in Engagements and use its existing draft review package; professional release requires the authorized human approval workflow.
        </p>
        <button type="button" onClick={onClose} className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Close</button>
      </section>
    </div>
  );
};
