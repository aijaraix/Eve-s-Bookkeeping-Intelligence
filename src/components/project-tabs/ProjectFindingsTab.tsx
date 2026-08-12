import React, { useState } from 'react';
import { Workspace, DocumentRecord } from '../../types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  X,
  Plus,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  FileText,
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface ProjectFindingsTabProps {
  workspace: Workspace;
  documents: DocumentRecord[];
}

interface AuditFinding {
  id: string;
  code: string;
  title: string;
  category: string;
  area: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  materiality: 'Material' | 'Immaterial';
  amount: string;
  confidence: string;
  consensus: '3/3 Unanimous' | '2/3 Partial' | 'No Consensus';
  status: 'Open' | 'In Review' | 'Resolved';
  owner: string;
  dueDate: string;
  whyFlagged: string;
  affectedAccount: string;
  hermesPrime: string;
  node1: string;
  node2: string;
  node3: string;
}

export const ProjectFindingsTab: React.FC<ProjectFindingsTabProps> = ({
  workspace,
  documents
}) => {
  const [selectedFinding, setSelectedFinding] = useState<AuditFinding | null>(null);
  const [severityFilter, setSeverityFilter] = useState('All Severities');
  const [areaFilter, setAreaFilter] = useState('All Areas');
  const [autoTaskCreated, setAutoTaskCreated] = useState<string | null>(null);

  const findingsList: AuditFinding[] = [
    {
      id: 'f-1',
      code: 'F-018',
      title: 'Unusual Revenue Cut-Off Posting Near Year-End',
      category: 'Revenue Recognition',
      area: 'Revenue',
      severity: 'Critical',
      materiality: 'Material',
      amount: '€4,200,000',
      confidence: '98.5%',
      consensus: '2/3 Partial',
      status: 'Open',
      owner: 'Sarah Johnson',
      dueDate: 'Jun 12, 2026',
      whyFlagged: 'Invoice dated Dec 31, 2025 posted without matching bill of lading proof of delivery until Jan 5, 2026.',
      affectedAccount: '4000 Revenue / 1200 AR',
      hermesPrime: 'Flagged for cut-off risk under IFRS 15.',
      node1: 'Agrees cut-off risk exists. Delivery occurred post-year-end.',
      node2: 'Agrees cut-off risk exists. Recommended reversal entry.',
      node3: 'Dissenting view: Customer contract allows FOB shipping point recognition.'
    },
    {
      id: 'f-2',
      code: 'F-019',
      title: 'Unhedged Currency Exposure in LatAm Sub',
      category: 'FX & Treasury',
      area: 'FX',
      severity: 'High',
      materiality: 'Material',
      amount: '€2,800,000',
      confidence: '99.1%',
      consensus: '3/3 Unanimous',
      status: 'Open',
      owner: 'Michael Brown',
      dueDate: 'Jun 15, 2026',
      whyFlagged: 'ARS balance translated using official rate rather than parallel market rate.',
      affectedAccount: '7100 Foreign Exchange Gain/Loss',
      hermesPrime: 'FX valuation discrepancy confirmed.',
      node1: 'Agrees FX rate needs adjustment.',
      node2: 'Agrees FX valuation discrepancy.',
      node3: 'Agrees FX valuation discrepancy.'
    },
    {
      id: 'f-3',
      code: 'F-020',
      title: 'Marketing Expense Spike in Q2',
      category: 'Operating Expenses',
      area: 'Expenses',
      severity: 'Medium',
      materiality: 'Immaterial',
      amount: '€830,000',
      confidence: '97.2%',
      consensus: '3/3 Unanimous',
      status: 'In Review',
      owner: 'Emily Davis',
      dueDate: 'Jun 18, 2026',
      whyFlagged: '18.1% YoY increase in marketing costs verified against MSA contract.',
      affectedAccount: '6100 Marketing Expenses',
      hermesPrime: 'Budget overrun verified against MSA contract.',
      node1: 'Agrees MSA terms met.',
      node2: 'Agrees MSA terms met.',
      node3: 'Agrees MSA terms met.'
    }
  ];

  const handleCreateAutoTask = (finding: AuditFinding) => {
    setAutoTaskCreated(`Task created: "Human Review Required — Validate Hermes Consensus for ${finding.code}"`);
  };

  return (
    <div className="space-y-6 pt-2">
      {/* ---------------- TOP SUMMARY CARDS ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2.5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Total</span>
          <div className="text-lg font-black text-slate-900 font-mono">18</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-rose-600">Critical</span>
          <div className="text-lg font-black text-rose-700 font-mono">2</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-600">High</span>
          <div className="text-lg font-black text-amber-700 font-mono">4</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-blue-600">Medium</span>
          <div className="text-lg font-black text-blue-700 font-mono">7</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500">Low</span>
          <div className="text-lg font-black text-slate-700 font-mono">5</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-purple-600">Open</span>
          <div className="text-lg font-black text-purple-700 font-mono">6</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-600">Resolved</span>
          <div className="text-lg font-black text-emerald-700 font-mono">10</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-600">Evidence</span>
          <div className="text-lg font-black text-amber-700 font-mono">1</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-rose-600">Human Review</span>
          <div className="text-lg font-black text-rose-700 font-mono">1</div>
        </div>
      </div>

      {/* ---------------- AUDIT PROGRESS TRACKER ---------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Audit Engagement Progress & Workflow</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-[10px] font-bold text-center">
          {[
            { stage: '1. Planning', pct: '100%', done: true },
            { stage: '2. Doc Collection', pct: '95%', done: true },
            { stage: '3. Testing', pct: '88%', done: true },
            { stage: '4. Evidence', pct: '82%', done: true },
            { stage: '5. Findings', pct: '75%', active: true },
            { stage: '6. Mgmt Response', pct: '60%', pending: true },
            { stage: '7. Remediation', pct: '50%', pending: true },
            { stage: '8. Final Review', pct: '30%', pending: true }
          ].map((s, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border ${
                s.done
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : s.active
                  ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="truncate">{s.stage}</div>
              <div className="font-mono text-xs font-black mt-0.5">{s.pct}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- FINDINGS MAIN TABLE ---------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Audit Findings & Exceptions Log</h3>
          <div className="flex gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option>All Severities</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 bg-slate-50/50">
                <th className="py-2.5 px-3">Finding ID</th>
                <th className="py-2.5 px-3">Finding Description</th>
                <th className="py-2.5 px-2">Area</th>
                <th className="py-2.5 px-2">Severity</th>
                <th className="py-2.5 px-2 font-mono">Amount</th>
                <th className="py-2.5 px-2">Hermes Consensus</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2">Owner</th>
                <th className="py-2.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {findingsList.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedFinding(f)}>
                  <td className="py-3 px-3 font-mono font-black text-blue-900">{f.code}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 max-w-[280px]">{f.title}</td>
                  <td className="py-3 px-2 text-slate-600">{f.area}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      f.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                      f.severity === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-mono font-bold text-slate-900">{f.amount}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      f.consensus === '3/3 Unanimous' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {f.consensus}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-bold text-slate-700">{f.status}</td>
                  <td className="py-3 px-2 text-slate-600">{f.owner}</td>
                  <td className="py-3 px-2 text-right">
                    <button className="px-2.5 py-1 bg-blue-900 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-blue-950">
                      View Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- FINDING DETAIL MODAL & HERMES CONSENSUS ---------------- */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden space-y-4 p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedFinding(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedFinding.code}: {selectedFinding.title}</h3>
                <p className="text-xs text-slate-500 font-mono">Affected Account: {selectedFinding.affectedAccount}</p>
              </div>
            </div>

            {/* Why Flagged */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs">
              <span className="font-bold text-rose-900 block uppercase text-[10px]">Why Flagged by AI</span>
              <p className="text-slate-800">{selectedFinding.whyFlagged}</p>
            </div>

            {/* HERMES 3-NODE CONSENSUS MODULE */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Hermes AI 3-Node Consensus Inspection
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                  selectedFinding.consensus === '3/3 Unanimous' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {selectedFinding.consensus}
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  <strong>Hermes Prime Engine:</strong> {selectedFinding.hermesPrime}
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  <strong>Validation Node 1:</strong> {selectedFinding.node1}
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  <strong>Validation Node 2:</strong> {selectedFinding.node2}
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  <strong>Validation Node 3:</strong> {selectedFinding.node3}
                </div>
              </div>

              {selectedFinding.consensus !== '3/3 Unanimous' && (
                <div className="pt-2 flex items-center justify-between bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-900">
                    ⚠ Dissenting view detected. Automatic human review task required.
                  </span>
                  <button
                    onClick={() => handleCreateAutoTask(selectedFinding)}
                    className="px-3 py-1.5 bg-amber-900 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-amber-950"
                  >
                    Generate Task
                  </button>
                </div>
              )}

              {autoTaskCreated && (
                <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl font-bold text-xs">
                  ✓ {autoTaskCreated}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedFinding(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Finding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
