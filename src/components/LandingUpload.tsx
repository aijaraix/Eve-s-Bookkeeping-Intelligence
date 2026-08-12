import React, { useState, useRef } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Users,
  Upload,
  ArrowRight,
  CheckCircle2,
  Building2,
  FolderKanban,
  FileText,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Lock,
  Check,
  Globe,
  DollarSign,
  X,
  ChevronRight,
  ChevronDown,
  Play,
  FileSpreadsheet,
  Cpu,
  Layers,
  Award,
  Briefcase,
  Key,
  HelpCircle,
  CheckSquare,
  RefreshCw,
  Cloud,
  Mic,
  MicOff,
  LogIn,
  UserCheck,
  FileCheck,
  Search,
  Shield,
  FileCode,
  ExternalLink,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Workspace } from '../types';
import { EvesLogo } from './EvesLogo';

interface LandingUploadProps {
  existingWorkspaces: Workspace[];
  onSubmitClick: (files: File[], description: string, driveUrl?: string) => void;
  onResetData?: () => void;
  userEmail: string | null;
  onOpenSignIn: () => void;
  onSignOut?: () => void;
  onOpenAdminPanel?: () => void;
}

export const LandingUpload: React.FC<LandingUploadProps> = ({
  existingWorkspaces,
  onSubmitClick,
  onResetData,
  userEmail,
  onOpenSignIn,
  onSignOut,
  onOpenAdminPanel,
}) => {
  // Navigation & Page State
  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'solutions' | 'industries' | 'pricing' | 'terms' | 'privacy' | 'soc2'>('home');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // Document Upload State inside Hero / Trial Modal
  const [isTrialUploadOpen, setIsTrialUploadOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadTab, setUploadTab] = useState<'local' | 'drive'>('local');
  const [driveUrl, setDriveUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    setActiveTab('home');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setValidationError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setValidationError(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (selectedFiles.length === 0 && !driveUrl.trim()) {
      setValidationError("Please select at least one document file or provide a Google Drive / Cloud URL.");
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    onSubmitClick(selectedFiles, description, driveUrl.trim());
    setTimeout(() => {
      setIsSubmitting(false);
      setIsTrialUploadOpen(false);
    }, 2500);
  };

  // Mock Data for the Hero Right Column Dashboard Preview
  const previewPerformanceData = [
    { month: 'Jan', Revenue: 4800, NetIncome: 650, EBITDA: 1100 },
    { month: 'Feb', Revenue: 5100, NetIncome: 710, EBITDA: 1180 },
    { month: 'Mar', Revenue: 5350, NetIncome: 730, EBITDA: 1210 },
    { month: 'Apr', Revenue: 5200, NetIncome: 700, EBITDA: 1190 },
    { month: 'May', Revenue: 5420, NetIncome: 742, EBITDA: 1230 },
  ];

  const previewDonutData = [
    { name: 'Processed', value: 8632, color: '#10b981' },
    { name: 'In Review', value: 3245, color: '#3b82f6' },
    { name: 'Pending', value: 2135, color: '#f59e0b' },
    { name: 'Issues', value: 520, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-[#060A17] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER NAVIGATION (Exact replica of screenshot)     */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-[#060A17]/90 backdrop-blur-md border-b border-[#131d38]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <EvesLogo variant="horizontal" size="md" className="brightness-110" />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold tracking-wide text-slate-300">
            <button
              onClick={() => {
                if (activeTab === 'home') scrollToSection('products');
                else setActiveTab('products');
              }}
              className={`hover:text-white transition cursor-pointer ${activeTab === 'products' ? 'text-emerald-400 font-bold' : ''}`}
            >
              Product
            </button>
            <button
              onClick={() => {
                if (activeTab === 'home') scrollToSection('solutions');
                else setActiveTab('solutions');
              }}
              className={`hover:text-white transition cursor-pointer ${activeTab === 'solutions' ? 'text-emerald-400 font-bold' : ''}`}
            >
              Solutions
            </button>
            <button
              onClick={() => {
                if (activeTab === 'home') scrollToSection('industries');
                else setActiveTab('industries');
              }}
              className={`hover:text-white transition cursor-pointer ${activeTab === 'industries' ? 'text-emerald-400 font-bold' : ''}`}
            >
              Industries
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className={`hover:text-white transition cursor-pointer ${activeTab === 'home' ? 'text-emerald-400 font-bold' : ''}`}
            >
              Company
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`hover:text-white transition cursor-pointer ${activeTab === 'pricing' ? 'text-emerald-400 font-bold' : ''}`}
            >
              Pricing
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-4">
            {userEmail ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="bg-[#0b152d] hover:bg-[#122045] border border-emerald-500/40 text-white text-xs font-bold px-3 py-1.5 rounded-2xl transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <div className="w-6 h-6 rounded-xl bg-emerald-500 text-[#060A17] font-extrabold flex items-center justify-center text-xs shadow-2xs">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-mono text-emerald-300 max-w-[140px] truncate">{userEmail}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0a1329] border border-[#1b2b52] rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2 text-slate-200">
                    <div className="p-2 bg-[#121f42] rounded-xl border border-[#213568]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Signed In Account</span>
                      <span className="font-mono text-emerald-400 font-bold truncate block mt-0.5">{userEmail}</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (existingWorkspaces.length > 0) {
                            onSubmitClick([], '', '');
                          } else {
                            setIsTrialUploadOpen(true);
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#122045] transition flex items-center justify-between text-slate-200 font-semibold cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-emerald-400" />
                          <span>Open Active Workspace</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenSignIn();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#122045] transition flex items-center gap-2 text-blue-300 font-semibold cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-blue-400" />
                        <span>Switch Account / Google Auth</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (onSignOut) onSignOut();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 font-bold transition flex items-center gap-2 cursor-pointer border-t border-[#18274d] mt-1 pt-2"
                      >
                        <LogIn className="w-4 h-4 text-rose-400" />
                        <span>Sign Out from Homepage</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenSignIn}
                className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 transition cursor-pointer flex items-center gap-1.5 border border-slate-700/60 rounded-xl hover:bg-slate-800/50"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>Log in with Google</span>
              </button>
            )}

            <button
              onClick={() => setIsTrialUploadOpen(true)}
              className="bg-[#00D2A0] hover:bg-[#00b88c] text-[#060A17] font-extrabold text-xs px-5 py-2.5 rounded-full shadow-lg shadow-[#00D2A0]/20 transition-all transform hover:scale-105 cursor-pointer flex items-center space-x-1.5"
            >
              <span>Start Free Trial</span>
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN VIEW SWITCHER                                        */}
      {/* ========================================================= */}

      {activeTab === 'home' && (
        <>
          {/* ========================================================= */}
          {/* 2. HERO SECTION (Exact replica of screenshot)             */}
          {/* ========================================================= */}
          <section className="relative pt-12 pb-20 overflow-hidden bg-[#060A17]">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left Hero Content (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Tag Pill */}
                  <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3.5 py-1 text-emerald-400 text-[11px] font-bold tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI-POWERED FINANCIAL INTELLIGENCE</span>
                  </div>

                  {/* Main Headline */}
                  <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
                    Smarter Financials. <br />
                    Stronger Decisions. <br />
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Better Outcomes.
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
                    Eve's Bookkeeping is the AI-powered platform that automates financial analysis, audit workflows, and reporting—so your team can focus on what matters most.
                  </p>

                  {/* 3 Value Cards */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    
                    <div className="bg-[#0b1329]/90 border border-[#18264a] p-3 rounded-2xl space-y-1">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">AI Financial Analysis</h4>
                      <p className="text-[10px] text-slate-400 leading-snug">Instant insights from thousands of documents</p>
                    </div>

                    <div className="bg-[#0b1329]/90 border border-[#18264a] p-3 rounded-2xl space-y-1">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">Audit-Ready Confidence</h4>
                      <p className="text-[10px] text-slate-400 leading-snug">Built-in controls, traceability, and full audit trails</p>
                    </div>

                    <div className="bg-[#0b1329]/90 border border-[#18264a] p-3 rounded-2xl space-y-1">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">Collaborate Securely</h4>
                      <p className="text-[10px] text-slate-400 leading-snug">Work together in real time with enterprise security</p>
                    </div>

                  </div>

                  {/* CTA Area */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={() => setIsTrialUploadOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white p-3.5 px-6 rounded-2xl shadow-xl shadow-purple-600/20 transition-all transform hover:scale-102 cursor-pointer text-left flex items-center space-x-3 border border-purple-400/30"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold tracking-wide">Start Free Trial</div>
                        <div className="text-[10px] text-blue-100 font-medium">Upload your documents. Test it now.</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setIsTrialUploadOpen(true)}
                      className="text-xs font-bold text-slate-300 hover:text-white flex items-center space-x-1 transition cursor-pointer"
                    >
                      <span>No credit card required</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>

                  {/* Social Proof Logos */}
                  <div className="pt-6 border-t border-[#132042] space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Trusted by leading firms and finance teams worldwide
                    </p>
                    <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm font-black tracking-tight opacity-80">
                      <span className="hover:text-white transition">Deloitte.</span>
                      <span className="hover:text-white transition lowercase">pwc</span>
                      <span className="hover:text-white transition">KPMG</span>
                      <span className="hover:text-white transition">EY</span>
                      <span className="hover:text-white transition">Grant Thornton</span>
                      <span className="text-xs text-slate-500 font-normal">and more..</span>
                    </div>
                  </div>

                </div>

                {/* Right Hero Preview Mockup (7 Cols - High Precision Replica of Screenshot with Slight 3D Perspective Tilt) */}
                <div className="lg:col-span-7 relative perspective-1000">
                  <div className="bg-white border border-slate-200/90 rounded-2xl md:rounded-3xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)] overflow-hidden text-slate-800 text-[11px] transform md:perspective-1000 md:[transform:rotateY(-6deg)_rotateX(2deg)_rotateZ(1deg)] hover:[transform:rotateY(0deg)_rotateX(0deg)_rotateZ(0deg)] transition-all duration-500 ease-out">
                    
                    {/* Mock App Shell Header */}
                    <div className="bg-slate-900 text-white p-2.5 sm:p-3 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <EvesLogo variant="horizontal" size="sm" className="brightness-125" />
                      </div>
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <div className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-1 rounded-lg text-[9px] sm:text-[10px] hidden sm:flex items-center gap-1">
                          <Search className="w-3 h-3 text-slate-500" />
                          <span>Search companies, projects, documents...</span>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9px] sm:text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs">
                          <span>+ New Project</span>
                        </button>
                        <button className="bg-slate-800 text-blue-300 border border-blue-500/30 text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span className="hidden sm:inline">Upload Documents</span>
                        </button>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700 hidden md:inline">
                          Jun 1 – Jun 7, 2024
                        </span>
                      </div>
                    </div>

                    {/* Mock App Body with Left Sidebar + Dashboard Content */}
                    <div className="flex bg-slate-50">
                      
                      {/* Mini Left Sidebar */}
                      <div className="w-36 bg-slate-900 text-slate-300 border-r border-slate-800 p-2.5 space-y-3 hidden xl:block shrink-0 text-[10px]">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg bg-blue-600 text-white font-bold">
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Overview</span>
                          </div>
                          <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                            <FolderKanban className="w-3.5 h-3.5" />
                            <span>Projects</span>
                          </div>
                          <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Companies</span>
                          </div>
                          <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Documents</span>
                          </div>
                          <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Financials</span>
                          </div>
                          <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Audit & Findings</span>
                          </div>
                          <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span>AI Insights</span>
                          </div>
                          <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                            <Users className="w-3.5 h-3.5" />
                            <span>Users & Teams</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 space-y-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 px-2 block">Shortcuts</span>
                          <div className="flex items-center space-x-2 px-2 py-1 text-slate-400 hover:text-white cursor-pointer">
                            <Upload className="w-3 h-3 text-emerald-400" />
                            <span>Upload Docs</span>
                          </div>
                          <div className="flex items-center space-x-2 px-2 py-1 text-slate-400 hover:text-white cursor-pointer">
                            <CheckSquare className="w-3 h-3 text-blue-400" />
                            <span>My Tasks <span className="bg-blue-500/20 text-blue-400 px-1 rounded text-[8px] ml-auto">8</span></span>
                          </div>
                          <div className="flex items-center space-x-2 px-2 py-1 text-slate-400 hover:text-white cursor-pointer">
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            <span>High Risk <span className="bg-red-500/20 text-red-400 px-1 rounded text-[8px] ml-auto">23</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Main Dashboard Panel */}
                      <div className="flex-1 p-3 sm:p-4 space-y-3 bg-slate-50 overflow-hidden">
                        
                        {/* Title Header */}
                        <div>
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">Overview</h3>
                          <p className="text-[9px] sm:text-[10px] text-slate-500">Real-time overview of your portfolio, projects and financial intelligence.</p>
                        </div>

                        {/* Top 5 KPI Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
                          <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[8px] sm:text-[9px] text-slate-500 font-semibold block">Total Revenue</span>
                            <span className="text-xs sm:text-sm font-mono font-bold text-slate-900">$5.42B</span>
                            <span className="text-[8px] sm:text-[9px] text-emerald-600 font-bold block">↑ 14.6% vs PY</span>
                          </div>

                          <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[8px] sm:text-[9px] text-slate-500 font-semibold block">Net Income</span>
                            <span className="text-xs sm:text-sm font-mono font-bold text-slate-900">$742.6M</span>
                            <span className="text-[8px] sm:text-[9px] text-emerald-600 font-bold block">↑ 9.8% vs PY</span>
                          </div>

                          <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[8px] sm:text-[9px] text-slate-500 font-semibold block">Total Assets</span>
                            <span className="text-xs sm:text-sm font-mono font-bold text-slate-900">$8.91B</span>
                            <span className="text-[8px] sm:text-[9px] text-emerald-600 font-bold block">↑ 11.2% vs PY</span>
                          </div>

                          <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[8px] sm:text-[9px] text-slate-500 font-semibold block">Audit Readiness</span>
                            <span className="text-xs sm:text-sm font-mono font-bold text-slate-900">87%</span>
                            <span className="text-[8px] sm:text-[9px] text-emerald-600 font-bold block">↑ 4% vs last month</span>
                          </div>

                          <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[8px] sm:text-[9px] text-slate-500 font-semibold block">Risk Score</span>
                            <span className="text-xs sm:text-sm font-mono font-bold text-amber-600">Medium</span>
                            <span className="text-[8px] sm:text-[9px] text-slate-500 block font-mono">42 / 100</span>
                          </div>
                        </div>

                        {/* Financial Performance Chart & Projects Grid */}
                        <div className="grid grid-cols-12 gap-2 sm:gap-3">
                          
                          {/* Financial Performance Area Chart */}
                          <div className="col-span-12 sm:col-span-7 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] sm:text-[11px] font-bold text-slate-900">Financial Performance (YTD)</span>
                              <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-medium">
                                <span className="text-blue-600">● Revenue</span>
                                <span className="text-purple-600">● Net Income</span>
                                <span className="text-emerald-600">● EBITDA</span>
                              </div>
                            </div>
                            <div className="h-24 sm:h-28">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={previewPerformanceData}>
                                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={8} tickLine={false} />
                                  <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} />
                                  <Area type="monotone" dataKey="Revenue" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} />
                                  <Area type="monotone" dataKey="NetIncome" stroke="#a855f7" fill="#c084fc" fillOpacity={0.12} strokeWidth={2} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Top Projects by Risk Table */}
                          <div className="col-span-12 sm:col-span-5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] sm:text-[11px] font-bold text-slate-900">Top 5 Projects by Risk</span>
                              <span className="text-[8px] text-blue-600 font-bold hover:underline cursor-pointer">View all →</span>
                            </div>
                            <div className="space-y-1 text-[9px]">
                              {[
                                { name: 'GlobalTech Solutions', risk: 'High', score: 85, badge: 'bg-red-100 text-red-700' },
                                { name: 'NorthStar Manufacturing', risk: 'High', score: 75, badge: 'bg-red-100 text-red-700' },
                                { name: 'BlueWave Industries', risk: 'Medium', score: 62, badge: 'bg-amber-100 text-amber-700' },
                                { name: 'Summit Retail Group', risk: 'Medium', score: 58, badge: 'bg-amber-100 text-amber-700' },
                                { name: 'Greenfield Energy', risk: 'Low', score: 32, badge: 'bg-emerald-100 text-emerald-700' }
                              ].map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between py-0.5 border-b border-slate-100">
                                  <span className="font-semibold text-slate-700 truncate max-w-[110px]">{p.name}</span>
                                  <div className="flex items-center gap-1 font-mono">
                                    <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${p.badge}`}>{p.risk}</span>
                                    <span className="text-slate-900 font-bold">{p.score}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                        {/* Documents Processed & Audit Readiness Row */}
                        <div className="grid grid-cols-12 gap-2 sm:gap-3">
                          
                          {/* Documents Processed Donut Chart */}
                          <div className="col-span-12 sm:col-span-6 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                            <div className="w-20 h-20 relative shrink-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={previewDonutData} innerRadius={22} outerRadius={34} dataKey="value" paddingAngle={2}>
                                    {previewDonutData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] font-bold text-slate-900 font-mono">14,532</span>
                                <span className="text-[7px] text-slate-400">Total</span>
                              </div>
                            </div>

                            <div className="flex-1 pl-2.5 space-y-0.5 text-[8px] sm:text-[9px]">
                              <span className="text-[10px] font-bold text-slate-900 block">Documents Processed</span>
                              {previewDonutData.map((d, i) => (
                                <div key={i} className="flex justify-between">
                                  <span className="text-slate-600">● {d.name}</span>
                                  <span className="font-mono text-slate-900 font-bold">{d.value.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Audit Readiness Meter */}
                          <div className="col-span-12 sm:col-span-6 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-900">Audit Readiness</span>
                              <span className="text-[9px] font-mono text-emerald-600 font-bold">87% On Track</span>
                            </div>
                            <div className="space-y-1 text-[8px] sm:text-[9px]">
                              {[
                                { label: 'Documentation', val: '90%' },
                                { label: 'Internal Controls', val: '85%' },
                                { label: 'Testing & Evidence', val: '82%' },
                                { label: 'Remediation', val: '88%' }
                              ].map((b, i) => (
                                <div key={i} className="space-y-0.5">
                                  <div className="flex justify-between text-slate-600 font-medium">
                                    <span>{b.label}</span>
                                    <span className="font-mono text-slate-900 font-bold">{b.val}</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: b.val }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                      </div>

                    </div>

                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* 3. SECTION 2: BUILT FOR ACCOUNTING & FINANCE TEAMS        */}
          {/* ========================================================= */}
          <section id="products" className="py-20 bg-neutral-50 text-neutral-900 border-t border-neutral-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              
              <div className="text-center space-y-3 max-w-3xl mx-auto">
                <span className="text-xs font-extrabold text-[#00A884] uppercase tracking-widest block">
                  BUILT FOR ACCOUNTING & FINANCE TEAMS
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
                  One Platform. Every Financial Workflow.
                </h2>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
                  From document intake to audit-ready reports, Eve's Bookkeeping automates the entire process with AI—saving time, reducing risk, and delivering unmatched accuracy.
                </p>
              </div>

              {/* 6 Feature Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Card 1 */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs hover:shadow-md transition space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">Intelligent Document Processing</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Upload any financial document. Our AI extracts, categorizes, and validates data instantly.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs hover:shadow-md transition space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">AI-Powered Analysis</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Advanced analytics identify trends, anomalies, and risks—so you can make smarter decisions.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs hover:shadow-md transition space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">Audit & Compliance Ready</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Built-in audit workflows, controls, and evidence management keep you always audit-ready.
                  </p>
                </div>

                {/* Card 4 */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs hover:shadow-md transition space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">Real-Time Collaboration</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Work seamlessly with your team and clients in real time with secure role-based access.
                  </p>
                </div>

                {/* Card 5 */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs hover:shadow-md transition space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">Beautiful Reporting</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Generate professional reports and dashboards in seconds, not days.
                  </p>
                </div>

                {/* Card 6 */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs hover:shadow-md transition space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">Enterprise Security</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Bank-level encryption, SOC 2 compliant, and designed for financial data protection.
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* 4. SECTION 3: HOW IT WORKS                                */}
          {/* ========================================================= */}
          <section id="solutions" className="py-20 bg-white text-neutral-900 border-t border-neutral-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              
              <div className="text-center space-y-3 max-w-3xl mx-auto">
                <span className="text-xs font-extrabold text-[#00A884] uppercase tracking-widest block">
                  HOW IT WORKS
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
                  Get Started in 3 Simple Steps
                </h2>
              </div>

              {/* 3 Step Process Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Step 1 */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                      1
                    </div>
                    <h3 className="text-base font-bold text-neutral-900">Upload Your Documents</h3>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Drag & drop financial statements, reports, invoices, or audit files in any format.
                  </p>
                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl text-center space-y-2">
                    <Upload className="w-6 h-6 text-emerald-600 mx-auto" />
                    <span className="text-[11px] font-bold text-neutral-700 block">Drag & drop files here</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                      2
                    </div>
                    <h3 className="text-base font-bold text-neutral-900">AI Analyzes & Extracts</h3>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Our AI extracts data, performs analysis, and surfaces key insights automatically.
                  </p>
                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-emerald-700 font-semibold">
                      <span>✓ Extracting data</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-semibold">
                      <span>✓ Validating amounts</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-semibold">
                      <span>✓ Identifying risks</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                      3
                    </div>
                    <h3 className="text-base font-bold text-neutral-900">Explore Insights & Reports</h3>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Review dashboards, findings, and reports ready for your team and clients.
                  </p>
                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl text-center space-y-2">
                    <BarChart3 className="w-6 h-6 text-blue-600 mx-auto" />
                    <span className="text-[11px] font-bold text-neutral-700 block font-mono">100% Audit Ready</span>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* ========================================================= */}
          {/* 5. INDUSTRIES OVERVIEW SECTION                            */}
          {/* ========================================================= */}
          <section id="industries" className="py-20 bg-neutral-900 text-white border-t border-neutral-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              
              <div className="text-center space-y-3 max-w-3xl mx-auto">
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest block">
                  SPECIALIZED INDUSTRY SOLUTIONS
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Tailored Intelligence for Every Sector
                </h2>
                <p className="text-sm text-slate-400">
                  Eve's pre-trained consensus models understand sector-specific accounting rules, ASC standards, and regulatory frameworks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                <div className="bg-[#11192e] border border-[#1e2d54] p-6 rounded-2xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">Technology & SaaS</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    ASC 606 revenue recognition, ARR/MRR schedules, deferred revenue waterfall reconciliation.
                  </p>
                </div>

                <div className="bg-[#11192e] border border-[#1e2d54] p-6 rounded-2xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">Manufacturing & Logistics</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    COGS allocation, work-in-progress (WIP) tracking, inventory reserve valuation, supply chain audits.
                  </p>
                </div>

                <div className="bg-[#11192e] border border-[#1e2d54] p-6 rounded-2xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">Healthcare & Life Sciences</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Complex medical billing reconciliation, clinical R&D capitalization tracking, HIPAA-compliant audit trails.
                  </p>
                </div>

                <div className="bg-[#11192e] border border-[#1e2d54] p-6 rounded-2xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">Financial Services & Banking</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Multi-currency FX revaluations, portfolio risk stress testing, regulatory capital compliance reporting.
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* ========================================================= */}
          {/* 6. CALL TO ACTION BANNER (Exact replica of screenshot)    */}
          {/* ========================================================= */}
          <section className="py-16 bg-neutral-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="bg-gradient-to-r from-purple-100 via-blue-50 to-purple-100 border border-purple-200/80 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 text-white flex items-center justify-center shadow-lg shrink-0">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                      See the power of AI for yourself.
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-600 font-medium">
                      Start your free trial today. Upload your documents and get instant insights.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-center md:text-right space-y-2">
                  <button
                    onClick={() => setIsTrialUploadOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-xl shadow-purple-600/20 transition cursor-pointer"
                  >
                    Start Free Trial
                  </button>
                  <p className="text-[11px] text-neutral-500 font-semibold">No credit card required</p>
                </div>

              </div>

            </div>
          </section>
        </>
      )}

      {/* ========================================================= */}
      {/* PAGE: PRODUCTS DEDICATED VIEW                             */}
      {/* ========================================================= */}
      {activeTab === 'products' && (
        <div className="max-w-7xl mx-auto px-4 py-16 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">PRODUCT ARCHITECTURE</span>
            <h1 className="text-4xl font-extrabold text-white">The Eve's Autonomous Audit Suite</h1>
            <p className="text-slate-300 text-sm">
              Discover how our 4 specialized AI engines collaborate to ingest, reconcile, verify, and report financial metrics across thousands of corporate entities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0c1631] border border-[#1c2e5c] p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                01
              </div>
              <h2 className="text-xl font-bold text-white">Hermes 4-Agent Consensus Bureau</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Four autonomous LLM auditor personas (Lead Auditor, Technical Accountant, Forensic Analyst, and Quality Reviewer) independently review line items and cross-examine extracted figures before outputting final facts.
              </p>
            </div>

            <div className="bg-[#0c1631] border border-[#1c2e5c] p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                02
              </div>
              <h2 className="text-xl font-bold text-white">Multi-Document Trial Balance Reconciler</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automatically maps general ledgers, sub-ledgers, and trial balances across different ERP systems (SAP, NetSuite, QuickBooks) to verify mathematical debit/credit equilibrium.
              </p>
            </div>

            <div className="bg-[#0c1631] border border-[#1c2e5c] p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                03
              </div>
              <h2 className="text-xl font-bold text-white">ASC 606 / IFRS 15 Revenue Analyzer</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deeply parses customer contracts, performance obligations, and milestone schedules to ensure GAAP-compliant revenue recognition and identify unearned revenue risks.
              </p>
            </div>

            <div className="bg-[#0c1631] border border-[#1c2e5c] p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                04
              </div>
              <h2 className="text-xl font-bold text-white">Automated Footnote & Variance Generator</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generates audit-grade disclosures, Management Discussion & Analysis (MD&A) commentary, and footnote disclosures with verbatim citations to original source PDFs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PAGE: SOLUTIONS DEDICATED VIEW                            */}
      {/* ========================================================= */}
      {activeTab === 'solutions' && (
        <div className="max-w-7xl mx-auto px-4 py-16 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">SOLUTIONS BY ROLE</span>
            <h1 className="text-4xl font-extrabold text-white">Engineered for Modern Finance Leaders</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#0b142d] border border-[#192a54] p-6 rounded-3xl space-y-3">
              <Briefcase className="w-8 h-8 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">CPA & Accounting Firms</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Scale audit capacity 10x without hiring additional staff. Automate workpaper preparation, testing sampling, and client tie-outs effortlessly.
              </p>
            </div>

            <div className="bg-[#0b142d] border border-[#192a54] p-6 rounded-3xl space-y-3">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Corporate Finance & FP&A</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Streamline month-end close cycles, automate variance commentary against budget, and deliver real-time board decks in record time.
              </p>
            </div>

            <div className="bg-[#0b142d] border border-[#192a54] p-6 rounded-3xl space-y-3">
              <ShieldCheck className="w-8 h-8 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Private Equity & M&A Due Diligence</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Accelerate Quality of Earnings (QofE) analyses. Instantly audit target company financial room files with autonomous risk detection.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PAGE: PRICING DEDICATED VIEW                              */}
      {/* ========================================================= */}
      {activeTab === 'pricing' && (
        <div className="max-w-7xl mx-auto px-4 py-16 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">TRANSPARENT PRICING</span>
            <h1 className="text-4xl font-extrabold text-white">Simple, Predictable Plans</h1>
            
            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center bg-[#0d1838] p-1 rounded-full border border-[#1a2d59] mt-4">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${billingCycle === 'monthly' ? 'bg-emerald-500 text-neutral-900' : 'text-slate-400'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${billingCycle === 'annual' ? 'bg-emerald-500 text-neutral-900' : 'text-slate-400'}`}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Starter Plan */}
            <div className="bg-[#0a1329] border border-[#172752] p-8 rounded-3xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Starter</h3>
                <p className="text-xs text-slate-400">For boutique CPA practices & small finance teams.</p>
              </div>
              <div className="font-mono">
                <span className="text-4xl font-black text-white">{billingCycle === 'annual' ? '$199' : '$249'}</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Up to 500 documents / month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 5 Team Seats</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Standard AI Extraction</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Email Support</li>
              </ul>
              <button
                onClick={() => setIsTrialUploadOpen(true)}
                className="w-full bg-[#122044] hover:bg-[#1a2e61] text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer"
              >
                Start Free Trial
              </button>
            </div>

            {/* Professional Plan (Highlighted) */}
            <div className="bg-gradient-to-b from-[#0f1d45] to-[#0a1430] border-2 border-emerald-500 p-8 rounded-3xl space-y-6 relative shadow-2xl">
              <span className="absolute -top-3 right-6 bg-emerald-500 text-[#060A17] font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                MOST POPULAR
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">Professional</h3>
                <p className="text-xs text-slate-300">For growing accounting firms & mid-market finance departments.</p>
              </div>
              <div className="font-mono">
                <span className="text-4xl font-black text-white">{billingCycle === 'annual' ? '$599' : '$699'}</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Up to 5,000 documents / month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 20 Team Seats</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Hermes 4-Agent Consensus Bureau</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Direct ERP Connectors (NetSuite, SAP)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Priority 24/7 Support</li>
              </ul>
              <button
                onClick={() => setIsTrialUploadOpen(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-900 font-extrabold py-3 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Start Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-[#0a1329] border border-[#172752] p-8 rounded-3xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Enterprise</h3>
                <p className="text-xs text-slate-400">For global accounting networks & Fortune 500 CFOs.</p>
              </div>
              <div className="font-mono">
                <span className="text-4xl font-black text-white">Custom</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited document processing</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Custom LLM fine-tuning on private data</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Dedicated Account Manager & SLA</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> On-Premises / Private Cloud Deployment</li>
              </ul>
              <button
                onClick={() => setIsTrialUploadOpen(true)}
                className="w-full bg-[#122044] hover:bg-[#1a2e61] text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer"
              >
                Contact Enterprise Sales
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PAGE: TERMS, PRIVACY, & SOC 2 MODALS / VIEWS              */}
      {/* ========================================================= */}
      {activeTab === 'terms' && (
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 text-slate-300 text-xs leading-relaxed">
          <h1 className="text-2xl font-bold text-white">Terms & Conditions</h1>
          <p>Effective Date: August 2026. Eve's Bookkeeping Platform ("Eve") provides automated financial statement processing, document ingestion, and audit support tools...</p>
          <button onClick={() => setActiveTab('home')} className="text-emerald-400 underline font-bold">← Back to Home</button>
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 text-slate-300 text-xs leading-relaxed">
          <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
          <p>Your financial confidentiality is our highest priority. Eve does not retain customer financial statement data for model re-training without explicit enterprise consent...</p>
          <button onClick={() => setActiveTab('home')} className="text-emerald-400 underline font-bold">← Back to Home</button>
        </div>
      )}

      {activeTab === 'soc2' && (
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 text-slate-300 text-xs leading-relaxed">
          <h1 className="text-2xl font-bold text-white">SOC 2 Type II Compliance & Security</h1>
          <p>Eve undergoes rigorous annual third-party SOC 2 Type II audits covering security, availability, processing integrity, confidentiality, and privacy standards...</p>
          <button onClick={() => setActiveTab('home')} className="text-emerald-400 underline font-bold">← Back to Home</button>
        </div>
      )}

      {/* ========================================================= */}
      {/* FOOTER (Exact replica of screenshot)                      */}
      {/* ========================================================= */}
      <footer className="bg-[#040711] border-t border-[#101b38] py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 space-y-3">
              <EvesLogo variant="horizontal" size="md" />
              <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
                The AI-powered platform automating financial analysis, audit workflows, and reporting for accounting and finance teams worldwide.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-3">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => setActiveTab('products')} className="hover:text-white transition">Autonomous Audit</button></li>
                <li><button onClick={() => setActiveTab('products')} className="hover:text-white transition">Trial Balance Engine</button></li>
                <li><button onClick={() => setActiveTab('products')} className="hover:text-white transition">Revenue Recognition</button></li>
                <li><button onClick={() => setActiveTab('pricing')} className="hover:text-white transition">Pricing Plans</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-3">Solutions</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => setActiveTab('solutions')} className="hover:text-white transition">CPA & Accounting</button></li>
                <li><button onClick={() => setActiveTab('solutions')} className="hover:text-white transition">Corporate FP&A</button></li>
                <li><button onClick={() => setActiveTab('solutions')} className="hover:text-white transition">Private Equity M&A</button></li>
                <li><button onClick={() => setActiveTab('home')} className="hover:text-white transition">Enterprise Security</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-3">Compliance & Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => setActiveTab('terms')} className="hover:text-white transition">Terms & Conditions</button></li>
                <li><button onClick={() => setActiveTab('privacy')} className="hover:text-white transition">Privacy Policy</button></li>
                <li><button onClick={() => setActiveTab('soc2')} className="hover:text-white transition">SOC 2 Type II</button></li>
                {onOpenAdminPanel && (
                  <li><button onClick={onOpenAdminPanel} className="text-amber-400 hover:underline font-mono">Owner Governance</button></li>
                )}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#101b38] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} Eve's Bookkeeping Advisory Inc. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0 font-mono">
              <span className="text-emerald-400 font-bold">● SOC 2 Type II Certified</span>
              <span>•</span>
              <span>IFRS & US GAAP Compliant</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================= */}
      {/* MODAL: START FREE TRIAL / DOCUMENT UPLOAD                 */}
      {/* ========================================================= */}
      {isTrialUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b142d] border border-[#1d3061] rounded-3xl shadow-2xl max-w-xl w-full p-6 text-slate-100 space-y-5 relative">
            
            <div className="flex items-center justify-between border-b border-[#182a57] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Start Free Trial - Upload Documents</h3>
                  <p className="text-[11px] text-slate-400">Upload financial statements, trial balances, or invoices to test Eve AI instantly.</p>
                </div>
              </div>
              <button onClick={() => setIsTrialUploadOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUpload} className="space-y-4 text-xs">
              
              {validationError && (
                <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl">
                  {validationError}
                </div>
              )}

              {/* Upload Dropzone */}
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[#1e3266] hover:border-emerald-400 rounded-2xl p-6 text-center bg-[#070e24] cursor-pointer transition relative"
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.xlsx,.csv,.doc,.docx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-white">
                  {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Drag and drop financial files here, or click to browse'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Supports PDF, Excel trial balances, and CSV reports.</p>

                {selectedFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {selectedFiles.map((f, i) => (
                      <span key={i} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Custom Audit Instructions (Optional):</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Extract Q4 revenue, verify EBITDA margins, and check ASC 606 disclosures."
                  rows={2}
                  className="w-full bg-[#070e24] border border-[#1c2e5a] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3 border-t border-[#182a57]">
                <button
                  type="button"
                  onClick={() => setIsTrialUploadOpen(false)}
                  className="px-4 py-2 border border-[#1d3061] text-slate-300 hover:text-white rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-900 rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Ingesting & Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Launch Autonomous Audit</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
