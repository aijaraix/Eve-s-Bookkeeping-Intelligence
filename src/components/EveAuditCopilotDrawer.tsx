import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileCheck,
  Scale,
  TrendingUp,
  HelpCircle,
  Building2,
  AlertCircle
} from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';

interface EveAuditCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectMetric?: (metricName: string) => void;
}

export const EveAuditCopilotDrawer: React.FC<EveAuditCopilotDrawerProps> = ({
  isOpen,
  onClose,
  onInspectMetric
}) => {
  const { askEve, companies, selectedCompanyId, hasFacts, facts, projects, selectedProjectId } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);
  const project = projects.find((p) => p.id === selectedProjectId);

  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{
    sender: 'user' | 'ai';
    text: string;
    timestamp: string;
    citations?: string[];
  }>>([
    {
      sender: 'ai',
      text: hasFacts
        ? `Eve Audit Copilot initialized for **${company?.name || project?.name || 'active engagement'}**. I am grounded directly in ${facts.length} extracted and verified financial facts. Ask me to explain any line item, trace footnotes, calculate horizontal variances, or check math gates.`
        : `Eve Audit Copilot initialized. No client documents are extracted yet. Upload financial statements (PDF, Excel, Word) to establish mathematical ground truth.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: hasFacts ? [`${facts.length} facts in active registry`] : undefined
    }
  ]);

  const quickPrompts = [
    { label: 'Explain Net Income Lineage', query: 'Explain how Net Income was calculated and what source table and page it came from.' },
    { label: 'Check Balance Sheet Equation', query: 'Verify if Assets equal Liabilities plus Equity for the active period. Are there any discrepancies?' },
    { label: 'Horizontal Variance Analysis', query: 'Analyze the revenue and operating margin variance between the current and prior periods.' },
    { label: 'Subsidiaries & Scope', query: 'List all discovered subsidiaries, operating entities, and currencies for this group.' }
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: textToSend, timestamp: timeStr }]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const reply = await askEve(textToSend);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `CPA Review Error: ${err.message || 'Failed to query facts'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className={`fixed top-0 bottom-0 right-0 z-50 bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-full md:w-[600px]' : 'w-full md:w-[420px]'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight text-white font-mono">Eve Audit Copilot</h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                GROUNDED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[240px]">
              {company?.name || project?.name || 'No Engagement Selected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse width' : 'Expand width'}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Engagement Context Bar */}
      <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-mono">
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-800 truncate">{company?.name || 'All Engagements'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{facts.length} Verified Facts</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/70 text-xs">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`rounded-2xl p-3.5 max-w-[90%] shadow-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white font-sans'
                  : 'bg-white text-slate-800 border border-slate-200 font-sans'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px] text-slate-500 font-mono">
                  {msg.citations.map((cite, cIdx) => (
                    <span key={cIdx} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {cite}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs font-mono">
            <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
            <span>Auditing financial registry & mathematical lineage...</span>
          </div>
        )}
      </div>

      {/* Quick Audit Prompt Chips */}
      <div className="p-3 border-t border-slate-200 bg-white space-y-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          Quick Audit Procedures
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors cursor-pointer text-left truncate max-w-full"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask Eve about line items, disclosures, or math gates..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
          className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-sans"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
