import React, { useState } from 'react';
import { Workspace, DocumentRecord } from '../../types';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Search,
  MessageSquare,
  CheckCircle2,
  FileText,
  Send,
  HelpCircle,
  ShieldCheck,
  Plus,
  ArrowRight
} from 'lucide-react';

interface ProjectInsightsTabProps {
  workspace: Workspace;
  documents: DocumentRecord[];
}

export const ProjectInsightsTab: React.FC<ProjectInsightsTabProps> = ({
  workspace,
  documents
}) => {
  const [askQuery, setAskQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'eve'; text: string }>>([
    {
      sender: 'eve',
      text: `Hello! I am Eve AI, grounded directly in ${workspace.name || 'Unilever PLC'}'s financial statements and working papers. Ask me anything about revenue trends, margin anomalies, or audit risk findings.`
    }
  ]);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim()) return;

    const userText = askQuery;
    setAskQuery('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);

    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'eve',
          text: `Based on my analysis of 27 source documents for ${workspace.name || 'Unilever PLC'}, gross margin improved by +2.5pp YoY primarily driven by pricing power in Personal Care and lower palm oil commodity prices. However, marketing expenses spiked +18.1% in EMEA which requires ongoing oversight.`
        }
      ]);
    }, 600);
  };

  return (
    <div className="space-y-6 pt-2">
      {/* ---------------- TOP SUMMARY CARDS ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-purple-600">Critical Insights</span>
          <div className="text-xl font-black text-purple-900 font-mono">4</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-rose-600">Risks</span>
          <div className="text-xl font-black text-rose-700 font-mono">6</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-600">Anomalies</span>
          <div className="text-xl font-black text-amber-700 font-mono">8</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-600">Opportunities</span>
          <div className="text-xl font-black text-emerald-700 font-mono">3</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-blue-600">Forecast Changes</span>
          <div className="text-xl font-black text-blue-700 font-mono">2</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500">Requires Attention</span>
          <div className="text-xl font-black text-slate-900 font-mono">5</div>
        </div>
      </div>

      {/* ---------------- AI EXECUTIVE SUMMARY NARRATIVE ---------------- */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-3">
        <div className="flex items-center space-x-2 text-purple-300">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-xs font-black uppercase tracking-wider">Eve AI Executive Intelligence Brief</h3>
        </div>
        <p className="text-sm font-medium leading-relaxed text-slate-100">
          "Eve analyzed <strong>3,482 financial data points</strong> across <strong>27 source documents</strong> for {workspace.name || 'Unilever PLC'}. Group performance is robust with €59.60B in revenue (+6.0% YoY) and EBITDA margin reaching 16.5%. Key areas requiring auditor attention include €4.2M in cut-off journal entries near year-end, an 18.1% spike in marketing expenditures, and unhedged LatAm FX translation exposures."
        </p>
      </div>

      {/* ---------------- INTERACTIVE "ASK EVE" PROJECT QA ---------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Ask Eve — Project Grounded QA Search</h3>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-blue-900 text-white font-medium'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                {msg.sender === 'eve' && (
                  <span className="text-[10px] font-black uppercase text-purple-600 block mb-1">
                    ✦ Eve AI Agent
                  </span>
                )}
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            value={askQuery}
            onChange={(e) => setAskQuery(e.target.value)}
            placeholder="Ask a question about this project's financial statements or evidence..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-950 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
