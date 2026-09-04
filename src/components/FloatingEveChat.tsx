import React, { useState } from 'react';
import { Sparkles, Send, X } from 'lucide-react';
import { usePractice } from '../context/PracticeContext';
import { EMPTY_DISPLAY } from '../api/practiceClient';

export const FloatingEveChat: React.FC = () => {
  const { askEve, companies, selectedCompanyId, hasFacts } = usePractice();
  const company = companies.find((c) => c.id === selectedCompanyId);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: hasFacts
        ? `I can answer from extracted facts for ${company?.name || 'this workspace'}.`
        : 'No client documents are extracted yet. Submit PDFs or bank statements; I will not invent Unilever figures.'
    }
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    const reply = await askEve(userText);
    setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 bg-white border border-slate-200 rounded-2xl w-96 h-[480px] shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-[#0B132B] px-5 py-4 text-white flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono">Ask Eve AI CPA</h3>
              <p className="text-[10px] text-teal-300 font-mono">{company?.name || 'No engagement'} • {hasFacts ? 'facts loaded' : 'not extracted'}</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                  msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border border-slate-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask Eve about extracted facts..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
            <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-xl cursor-pointer">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0B132B] hover:bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-xl border border-teal-500/30 flex items-center gap-3 cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-left font-mono">
          <div className="text-xs font-bold">Ask Eve AI CPA</div>
          <div className="text-[10px] text-slate-400">{company?.name || EMPTY_DISPLAY}</div>
        </div>
      </button>
    </div>
  );
};
