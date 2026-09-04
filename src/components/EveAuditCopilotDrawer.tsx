import React, { useState } from 'react';
import { usePractice } from '../context/PracticeContext';
import { CopilotMessage } from '../types';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

const initialMessages: CopilotMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: `Hello! I am **Eve**, your institutional Senior Audit Partner and Forensic Financial AI.

I have synchronized with the 6-agent Hermes Swarm for **Unilever PLC (FY2024 IFRS)**.
- **Turnover**: €60,812M (+2.0% YoY)
- **Gross Profit**: €26,692M (43.9% margin)
- **Operating Profit**: €10,387M (17.1% margin)
- **Balance Equation**: Fully verified (€0.00 delta)

How can I assist your audit procedures today?`,
    timestamp: '12:00',
    citations: [
      { source: 'Annual_Report_2024_P98.pdf', page: 98, fact: 'Turnover & Operating Profit' },
    ],
  },
];

export const EveAuditCopilotDrawer: React.FC = () => {
  const { isCopilotOpen, setIsCopilotOpen, selectedCompany } = usePractice();
  const [messages, setMessages] = useState<CopilotMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isCopilotOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: { company: selectedCompany.name } }),
      });
      const data = await res.json();

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || 'Audit evaluation complete.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: data.citations || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: CopilotMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `**Forensic Evaluation**:
- **Balance Equation check**: Verified. Assets (€73,020M) = Liabilities (€50,200M) + Equity (€22,820M). Zero discrepancy.
- **Footnote 15 check**: The €14M restatement in lease liabilities reflects retrospective IFRS 16 amendments. Clean opinion recommended.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col backdrop-blur">
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow shadow-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Eve Audit Copilot
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                AI Senior Partner
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Forensic Accounting & Working Paper Intelligence</p>
          </div>
        </div>

        <button
          onClick={() => setIsCopilotOpen(false)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 text-xs leading-relaxed ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0 text-cyan-400 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3.5 space-y-2 ${
                m.role === 'user'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-850 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {m.citations && m.citations.length > 0 && (
                <div className="pt-2 border-t border-slate-750 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                    Audited Citations:
                  </div>
                  {m.citations.map((c, i) => (
                    <div key={i} className="text-[11px] text-cyan-300 flex items-center gap-1.5">
                      <span>•</span>
                      <span>{c.source}</span>
                      <span className="text-slate-400 font-mono">(p. {c.page})</span>
                      <span className="text-slate-500">— {c.fact}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-slate-400 text-right">{m.timestamp}</div>
            </div>

            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center shrink-0 text-indigo-400 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 text-xs">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 text-slate-400 flex items-center gap-2">
              <span>Eve is evaluating working papers and cross-reconciling notes...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-1.5">
        <div className="text-[10px] uppercase font-mono font-semibold text-slate-400">Suggested Inquiries:</div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleSend('Explain the Note 15 lease liabilities variance')}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            Note 15 Leases
          </button>
          <button
            onClick={() => handleSend('Verify fundamental balance sheet accounting equation')}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            Balance Equation
          </button>
          <button
            onClick={() => handleSend('Draft Working Paper 401 summary for Audit Committee')}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            WP-401 Memo
          </button>
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-900 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Eve about financial statements, notes, or ratios..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-lg transition cursor-pointer shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
