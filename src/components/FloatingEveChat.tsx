import React, { useState } from 'react';
import { Sparkles, Send, X, FileText, Bot, User, CheckCircle2 } from 'lucide-react';

export const FloatingEveChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; citations?: string[] }>>([
    {
      sender: 'ai',
      text: 'Hello! I am Eve, your CPA Audit Intelligence Copilot. I have fully indexed Unilever PLC (FY2025). Ask me about revenue trends, gross margins, balance sheet identity checks, or cash flow roll-ups.',
      citations: ['Unilever Annual Report 2025 (P. 142)', 'Consolidated Income Statement (P. 144)']
    }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userText = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInput('');

    setTimeout(() => {
      let reply = "I have cross-referenced your query against the canonical audit registry for Unilever PLC.";
      let citations = ["Unilever Annual Report FY2025"];
      const lower = userText.toLowerCase();

      if (lower.includes('revenue') || lower.includes('turnover')) {
        reply = "Group Turnover for FY2025 stands at €50.50B (up from €49.61B in FY2024). Net Revenue growth reflects 4.2% underlying pricing and brand productivity programs.";
        citations = ["Consolidated Income Statement (P. 142)", "Segment Note 2 (P. 149)"];
      } else if (lower.includes('margin') || lower.includes('profit') || lower.includes('gross')) {
        reply = "Gross Profit reached €23.71B (46.94% Gross Margin). Operating Profit (EBITDA / Operating Profit) achieved €9.00B with an operating margin of 19.49%.";
        citations = ["Consolidated Income Statement (P. 142)", "Note 3 — Operating Expenses (P. 152)"];
      } else if (lower.includes('ratio') || lower.includes('asset') || lower.includes('balance')) {
        reply = "Total Assets equal €34.76B. The Current Ratio is 1.33x, satisfying all liquidity benchmarks. Balance Sheet fundamental identity (Assets = Liabilities + Equity) balances with €0.00 variance.";
        citations = ["Consolidated Balance Sheet (P. 144)", "Identity Check PASS"];
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: reply, citations }]);
    }, 500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Expanded Chat Dialog */}
      {isOpen && (
        <div className="mb-4 bg-white border border-slate-200 rounded-2xl w-96 h-[480px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-[#0B132B] px-5 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono">Ask Eve AI CPA</h3>
                <p className="text-[10px] text-teal-300 font-mono">Unilever PLC • Active Engagement</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-2xs'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.citations && (
                  <div className="mt-1 flex flex-wrap gap-1 max-w-[85%]">
                    {msg.citations.map((c, cIdx) => (
                      <span key={cIdx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                        <FileText className="w-2.5 h-2.5" />
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask Eve about ratios, EBITDA, assets..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
            <button
              onClick={handleSend}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill Button (Matches Screenshot: Ask Eve AI CPA Unilever PLC) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0B132B] hover:bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-xl border border-teal-500/30 flex items-center gap-3 group transition-all transform hover:scale-105 cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-400/40">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <div className="text-left font-mono">
          <div className="text-xs font-bold leading-tight flex items-center gap-1">
            Ask Eve AI <span className="text-[9px] px-1 bg-teal-900/80 text-teal-300 rounded font-bold">CPA</span>
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">Unilever PLC</div>
        </div>
      </button>
    </div>
  );
};
