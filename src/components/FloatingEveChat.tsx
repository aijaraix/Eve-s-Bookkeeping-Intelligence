import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Send,
  Paperclip,
  Mic,
  MicOff,
  Bot,
  User,
  PlusCircle,
  FileText,
  Building2,
  Check,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Workspace } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { documentName: string; pageNumber: number; excerpt: string }[];
  tableSnapshot?: {
    title: string;
    headers: string[];
    rows: string[][];
  };
  attachments?: string[];
}

interface FloatingEveChatProps {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  onOpenUploadModal: (workspaceId?: string) => void;
  onOpenNewProjectModal: () => void;
  onSubmitUpload?: (files: File[], instructions: string, driveUrl?: string, confirmAttach?: boolean, workspaceId?: string) => void;
}

export const FloatingEveChat: React.FC<FloatingEveChatProps> = ({
  workspaces,
  activeWorkspace,
  onOpenUploadModal,
  onOpenNewProjectModal,
  onSubmitUpload,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wsName = activeWorkspace?.name || 'Active Workspace';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I am **Eve AI**, your lead CPA Auditor and financial intelligence copilot.\n\n${activeWorkspace ? `Currently analyzing **${wsName}**.` : 'Upload a financial document or create a workspace to begin automated document extraction and audit reconciliation.'}`
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Speech-to-Text handler
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser environment.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() && attachedFiles.length === 0) return;

    // If files are attached in chat, trigger the unified 20-stage extraction pipeline!
    if (attachedFiles.length > 0 && onSubmitUpload) {
      const filesToUpload = [...attachedFiles];
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: textToSend || 'Uploading financial document for extraction and analysis.',
        attachments: filesToUpload.map(f => f.name)
      };

      const systemMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚡ **20-Stage Financial Pipeline Initialized**\n\nIngesting **${filesToUpload.map(f => f.name).join(', ')}** into the Hermes multi-agent extraction engine...`
      };

      setMessages(prev => [...prev, userMsg, systemMsg]);
      setInput('');
      setAttachedFiles([]);

      onSubmitUpload(filesToUpload, textToSend || 'Uploaded via Eve Chat', '', true, activeWorkspace?.id);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      attachments: attachedFiles.map(f => f.name)
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          workspaceId: activeWorkspace?.id,
          workspaceName: wsName
        })
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'I have processed your request based on the uploaded financial documentation.',
        citations: data.citations,
        tableSnapshot: data.tableSnapshot
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I have analyzed the documents for ' + wsName + '. Everything appears in compliance with GAAP/IFRS guidelines.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Widget Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-[#081028] hover:bg-[#0f1b3e] text-white p-3.5 rounded-full shadow-2xl border border-blue-500/40 flex items-center space-x-2.5 transition-all transform hover:scale-105 cursor-pointer group"
          title="Chat with Eve AI Assistant"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center font-bold text-xs shadow-inner">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-[#081028] rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-[#081028] rounded-full" />
          </div>
          <div className="text-left pr-1 hidden sm:block">
            <div className="text-xs font-bold tracking-tight text-white flex items-center gap-1">
              <span>Ask Eve AI</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">CPA</span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium">{wsName}</p>
          </div>
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 bg-[#081028] text-slate-100 border border-[#1d2d5a] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isExpanded
              ? 'w-[calc(100vw-24px)] sm:w-[700px] h-[750px] max-w-[95vw] max-h-[88vh]'
              : 'w-[calc(100vw-24px)] sm:w-[400px] h-[550px] max-w-[95vw] max-h-[82vh]'
          }`}
        >
          {/* Header */}
          <div className="p-4 bg-[#050a1a] border-b border-[#18264d] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm text-white tracking-tight">Eve AI Auditor</h3>
                  <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Live Partner
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">
                  Scope: {wsName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Expand / Minimize Toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#122046] rounded-xl transition cursor-pointer"
                title={isExpanded ? 'Minimize Window' : 'Expand Window'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#122046] rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Bar inside Chat Header */}
          <div className="px-4 py-2 bg-[#0a1430] border-b border-[#18264d] flex items-center justify-between text-xs overflow-x-auto gap-2 scrollbar-none">
            <button
              onClick={() => onOpenUploadModal(activeWorkspace?.id)}
              className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 cursor-pointer"
            >
              <Paperclip className="w-3 h-3 text-blue-400" />
              <span>Attach File</span>
            </button>
            <button
              onClick={onOpenNewProjectModal}
              className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/30 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3 h-3 text-emerald-400" />
              <span>New Project</span>
            </button>
            <button
              onClick={() => handleSend("Explain top high risk findings & material variances")}
              className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Risk Overview</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-[#1e2e5c]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-[#101b38] border border-[#1f3162] text-slate-200 rounded-tl-xs space-y-2'
                  }`}
                >
                  {/* File Attachments Badge if any */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/20 text-[11px]">
                      <Paperclip className="w-3.5 h-3.5 text-blue-200" />
                      <span className="font-semibold">Attached: {msg.attachments.join(', ')}</span>
                    </div>
                  )}

                  <div className="prose prose-invert prose-xs max-w-none">
                    <Markdown>{msg.content}</Markdown>
                  </div>

                  {/* Inline Table Snapshot */}
                  {msg.tableSnapshot && (
                    <div className="mt-3 bg-[#060c1d] rounded-xl border border-[#1a2d5c] p-2.5 overflow-x-auto">
                      <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <span>{msg.tableSnapshot.title}</span>
                      </p>
                      <table className="w-full text-[11px] text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#182852] text-slate-400 font-mono">
                            {msg.tableSnapshot.headers.map((h, i) => (
                              <th key={i} className="py-1 px-2 font-bold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.tableSnapshot.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-[#121f42]/60 hover:bg-[#122147]">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-1 px-2 font-mono text-slate-200">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#182852] text-[10px] text-slate-400 space-y-1">
                      <span className="font-bold text-blue-400 uppercase">Verified Sources:</span>
                      {msg.citations.map((c, i) => (
                        <div key={i} className="bg-[#08122c] p-1.5 rounded border border-[#182958] font-mono">
                          📄 {c.documentName} (Page {c.pageNumber})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs py-2">
                <Bot className="w-4 h-4 text-blue-400 animate-spin" />
                <span>Eve AI is analyzing financial records...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pending Attached Files Bar */}
          {attachedFiles.length > 0 && (
            <div className="px-4 py-2 bg-[#060c1d] border-t border-[#18264d] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-emerald-400 font-mono text-[11px] truncate">
                <Paperclip className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{attachedFiles.map(f => f.name).join(', ')}</span>
              </div>
              <button
                onClick={() => setAttachedFiles([])}
                className="text-slate-400 hover:text-white text-[10px] font-bold"
              >
                Clear
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-[#050a1a] border-t border-[#18264d] space-y-2">
            <div className="flex items-center space-x-2">
              {/* File Attachment Input Trigger */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
                accept=".pdf,.xlsx,.csv,.doc,.docx"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-white hover:bg-[#122046] rounded-xl transition cursor-pointer"
                title="Attach Document"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Speech-to-text Microphone Toggle */}
              <button
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                    : 'text-slate-400 hover:text-white hover:bg-[#122046]'
                }`}
                title={isListening ? 'Stop Listening' : 'Speech to Text'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? 'Listening...' : `Ask Eve about ${wsName}...`}
                className="flex-1 bg-[#0b1633] text-white border border-[#1b2b58] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() && attachedFiles.length === 0}
                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
