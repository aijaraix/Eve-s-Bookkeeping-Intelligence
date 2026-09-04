import React, { useState } from 'react';
import { usePractice } from '../context/PracticeContext';
import { FileText, X, CheckCircle2, Download, Printer } from 'lucide-react';

export const ReportWizardModal: React.FC = () => {
  const { isReportWizardOpen, setIsReportWizardOpen, selectedCompany } = usePractice();
  const [selectedFormat, setSelectedFormat] = useState('board_memo');

  if (!isReportWizardOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Generate Audit Deliverable</h3>
          </div>
          <button
            onClick={() => setIsReportWizardOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Select standard working paper or presentation deliverable for {selectedCompany.name}:
        </p>

        <div className="space-y-2">
          {[
            { id: 'board_memo', title: 'Audit Committee Executive Memorandum', desc: 'Formal memorandum detailing mathematical checks, restatements, and opinion recommendation.' },
            { id: 'wp401', title: 'Working Paper 401: Mathematical & Footnote Review', desc: 'Granular tabular cross-check between published primary tables and notes 1-32.' },
            { id: 'covenants', title: 'Debt Covenant & Liquidity Compliance Certificate', desc: 'Net debt, interest coverage ratio (17.0x), and solvency certifications.' },
          ].map((item) => (
            <label
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                selectedFormat === item.id
                  ? 'bg-slate-800 border-cyan-500 text-white'
                  : 'bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <input
                type="radio"
                name="deliverable_type"
                checked={selectedFormat === item.id}
                onChange={() => setSelectedFormat(item.id)}
                className="mt-0.5 text-cyan-500 focus:ring-cyan-500"
              />
              <div>
                <div className="font-bold text-slate-100">{item.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={() => setIsReportWizardOpen(false)}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              window.print();
              setIsReportWizardOpen(false);
            }}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate & Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};
