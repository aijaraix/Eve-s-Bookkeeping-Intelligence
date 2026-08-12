import React, { useState } from 'react';
import { Workspace } from '../types';
import { Send, Sparkles, MessageSquareText, FileText, Bot, User, Lock, Table, FileSpreadsheet } from 'lucide-react';
import Markdown from 'react-markdown';

interface TableSnapshot {
  title: string;
  headers: string[];
  rows: string[][];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: { documentName: string; pageNumber: number; excerpt: string }[];
  tableSnapshot?: TableSnapshot;
}

interface AskAICPAProps {
  activeWorkspace?: Workspace | null;
}

export const AskAICPA: React.FC<AskAICPAProps> = ({ activeWorkspace }) => {
  const wsName = activeWorkspace?.name || 'Corporate Client';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello. I am **Ask AI CPA**, your Lead Deloitte Partner AI Auditor powered by Hermes consensus agents and Gemini AI.\n\nMy audit context is strictly locked to **${wsName}** to prevent cross-client data bleed. I can perform live calculations, explain line-item variances, trace facts to exact source pages, and render inline spreadsheet snapshots directly in our chat conversation.\n\n> *Preliminary, unaudited output generated from uploaded source documents. Review by a qualified accounting professional is required before reliance.*`,
      citations: [
        { documentName: '01_Telefonica_Consolidated_Annual_Report_2025.pdf', pageNumber: 14, excerpt: 'Verified entity financial facts under IFRS 15 / EU-GAAP.' }
      ],
      tableSnapshot: {
        title: `${wsName} Baseline Financial Snapshot`,
        headers: ['Financial Line Item', 'Reported Amount', 'Source Document', 'Page #', 'Status'],
        rows: [
          ['Consolidated Revenue', '€10,250,000,000.00', '01_Consolidated_Annual_Report.pdf', 'Page 14', 'Approved'],
          ['Operating Income Before D&A (OIBDA)', '€3,454,000,000.00', '03_Q4_Results_English.pdf', 'Page 10', 'Approved'],
          ['Net Financial Debt', '€27,340,000,000.00', '05_CNMV_Spanish.pdf', 'Page 6', 'Reconciled'],
          ['Free Cash Flow Generation', '€1,240,000,000.00', '05_CNMV_Spanish.pdf', 'Page 11', 'Approved']
        ]
      }
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const samplePrompts = [
    `Break down ${wsName}'s Net Debt & leverage ratio`,
    'Show segment revenue spreadsheet for Spain, Germany & Vivo Brazil',
    `What is ${wsName}'s OIBDA margin and CapEx intensity?`,
    'Reconcile Consolidated Report vs CNMV Filing revenue'
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query, 
          history: messages,
          workspaceId: activeWorkspace?.id,
          workspaceName: wsName 
        })
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.answer,
        citations: data.citations,
        tableSnapshot: data.tableSnapshot
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error communicating with AI CPA service. Please verify your Gemini API key.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <span>Ask EVE AI CPA</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 font-mono">
              <Lock className="w-3 h-3" />
              <span>Locked to: {wsName}</span>
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time interactive audit discussions with embedded spreadsheet table snapshots and source citations.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[650px]">
        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-lg'
              }`}>
                <div className="markdown-body">
                  <Markdown>{msg.content}</Markdown>
                </div>

                {/* Inline Spreadsheet Table Snapshot */}
                {msg.tableSnapshot && (
                  <div className="mt-4 pt-3 border-t border-slate-700/80 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>{msg.tableSnapshot.title}</span>
                    </span>
                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                            {msg.tableSnapshot.headers.map((h, hIdx) => (
                              <th key={hIdx} className="py-2 px-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-[11px]">
                          {msg.tableSnapshot.rows.map((r, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-900/60">
                              {r.map((c, cIdx) => (
                                <td key={cIdx} className={`py-2 px-3 ${cIdx === 1 ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                                  {c}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Citations list */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-2">
                    <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Supporting Evidence & Document Footnotes
                    </span>
                    {msg.citations.map((c, cIdx) => (
                      <div key={cIdx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono">
                        <span className="text-white font-bold">{c.documentName}</span> (Page {c.pageNumber}): <span className="text-slate-400">"{c.excerpt}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                <span>EVE AI CPA is executing audit calculations and pulling spreadsheet snapshots...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="px-6 py-2 bg-slate-950/60 border-t border-slate-800 flex gap-2 overflow-x-auto">
          {samplePrompts.map((p, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(p)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-300 px-3 py-1.5 rounded-lg whitespace-nowrap border border-slate-700 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={`Ask EVE AI CPA about ${wsName}'s filings, net debt, or line item reconciliation...`}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 font-sans"
          />
          <button
            onClick={() => handleSend()}
            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
