import React, { useState, useRef } from 'react';
import {
  FileText, Plus, Sparkles, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  Eye, Download, Share2, Mail, Send, ChevronRight, Search, Building2,
  FolderKanban, Users, Shield, Layers, Layout, BarChart2, CheckSquare,
  Globe, Palette, RefreshCw, MessageSquare, ChevronLeft, FileSpreadsheet,
  FileCode, Sliders, Settings, Lock, File, ExternalLink, Zap, Check,
  X, Image as ImageIcon, ZoomIn, ZoomOut, Maximize2, Filter, Info, ShieldAlert
} from 'lucide-react';
import { FinancialSummary } from '../types';

interface AIDeliverablesViewProps {
  summary: FinancialSummary | null;
}

export interface DeliverableItem {
  id: string;
  name: string;
  company: string;
  project: string;
  type: string;
  audience: string;
  status: 'Draft' | 'Awaiting Review' | 'Awaiting Approval' | 'Ready to Publish' | 'Published';
  pages: number;
  updated: string;
  variation?: 'Corporate Classic' | 'Modern Advisory' | 'Executive Board';
}

// Dynamic Corporate Logo Component
const CorporateLogo: React.FC<{ name?: string; className?: string; dark?: boolean }> = ({ name = "Corporate Client", className = "h-8", dark = false }) => (
  <div className={`inline-flex items-center space-x-2 font-sans ${className}`}>
    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
      {name.charAt(0).toUpperCase()}
    </div>
    <div className="flex flex-col">
      <span className={`font-extrabold text-base tracking-tight leading-none ${dark ? 'text-white' : 'text-slate-900'}`}>
        {name}
      </span>
      <span className={`text-[8px] font-bold uppercase tracking-widest ${dark ? 'text-blue-300' : 'text-blue-600'}`}>
        Enterprise Client Group
      </span>
    </div>
  </div>
);

export const AIDeliverablesView: React.FC<AIDeliverablesViewProps> = ({ summary }) => {
  const clientName = (summary as any)?.workspaceName || (summary as any)?.entityName || 'Corporate Client Group';

  const companyDatabase = [
    {
      name: clientName,
      domain: 'corporate.com',
      industry: 'Enterprise Services & Infrastructure',
      headquarters: 'Primary Operating Jurisdiction',
      logo: <CorporateLogo name={clientName} />,
      brandColors: {
        primary: '#1e293b',
        secondary: '#2563eb',
        accent: '#0284c7',
        bg: '#f8fafc',
      },
      projects: [
        {
          id: 'proj-01',
          name: 'FY2024 Audit',
          periods: ['Jan 1 – Dec 31, 2024 (Full Year)', 'Q4 2024 (Oct 1 – Dec 31, 2024)'],
          currencies: ['EUR – Euro (€)', 'USD – US Dollar ($)'],
          fiscalYears: ['FY2024', 'FY2025 (Forecast)'],
          accountingStandards: ['IFRS / EU GAAP', 'US GAAP Reconciliation'],
          baseReadinessScore: 92,
          openItems: [
            'Allowance for ECL credit risk footnote pending partner sign-off',
            'Intercompany receivables subledger reconciliation (€420K delta)'
          ],
          completedItemsCount: 18,
          totalItemsCount: 20
        },
        {
          id: 'proj-02',
          name: 'Q1 2024 Interim Review',
          periods: ['Q1 2024 (Jan 1 – Mar 31, 2024)'],
          currencies: ['EUR – Euro (€)'],
          fiscalYears: ['FY2024'],
          accountingStandards: ['IFRS'],
          baseReadinessScore: 98,
          openItems: [
            'Final partner sign-off on segment revenue note'
          ],
          completedItemsCount: 19,
          totalItemsCount: 20
        }
      ]
    }
  ];

  // Navigation & Modal States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [selectedDeliverableForPreview, setSelectedDeliverableForPreview] = useState<DeliverableItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [publishedToast, setPublishedToast] = useState<string | null>(null);

  // Deliverables List State
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([
    {
      id: 'del-001',
      name: `Annual Audit Report - ${clientName}`,
      company: clientName,
      project: 'FY2024 Audit',
      type: 'Annual Audit Report',
      audience: 'Board of Directors',
      status: 'Published',
      pages: 20,
      updated: '2 hours ago',
      variation: 'Modern Advisory',
    }
  ]);

  // Dynamic KPI Metric Counts
  const totalDeliverables = deliverables.length;
  const draftCount = deliverables.filter((d) => d.status === 'Draft').length;
  const awaitingReviewCount = deliverables.filter((d) => d.status === 'Awaiting Review').length;
  const awaitingApprovalCount = deliverables.filter((d) => d.status === 'Awaiting Approval').length;
  const readyToPublishCount = deliverables.filter((d) => d.status === 'Ready to Publish').length;
  const publishedCount = deliverables.filter((d) => d.status === 'Published').length;

  // Selected Active Company & Project in Wizard
  const activeCompany = companyDatabase[0]; // Telefónica S.A.
  const [selectedProjectName, setSelectedProjectName] = useState<string>('FY2024 Audit');
  
  const currentProject = activeCompany.projects.find((p) => p.name === selectedProjectName) || activeCompany.projects[0];

  // Wizard State
  const [wizardData, setWizardData] = useState({
    company: activeCompany.name,
    project: currentProject.name,
    reportingPeriod: currentProject.periods[0],
    fiscalYear: currentProject.fiscalYears[0],
    currency: currentProject.currencies[0],
    accountingStandard: currentProject.accountingStandards[0],
    consolidated: true,
    includeSubsidiaries: true,
    deliverableType: 'Annual Audit Report',
    searchTypeQuery: '',
    audience: 'Board of Directors',
    detailLevel: 'Executive (3-7 pages)',
    includeAppendices: true,
    includeCitations: true,
    includeEvidence: true,
    includeResponses: true,
    includeTasks: false,
    includeConsensus: true,
    includeMethodology: false,
    includeGlossary: false,
    includeTechnical: false,
    firmLogo: "EVE'S BOOKKEEPING",
    clientLogo: 'Telefónica S.A.',
    typography: 'Inter & Plus Jakarta',
    styleStyle: 'Modern Advisory',
    selectedVariation: 'Variation B' as 'Variation A' | 'Variation B' | 'Variation C',
  });

  // Calculate Dynamic Project Readiness Score live
  const calculateDynamicReadiness = () => {
    let score = currentProject.baseReadinessScore;
    if (wizardData.consolidated) score += 3;
    if (wizardData.includeSubsidiaries) score += 3;
    if (wizardData.includeCitations) score += 2;
    return Math.min(100, score);
  };

  const dynamicScore = calculateDynamicReadiness();

  // Handle Project selection change in wizard
  const handleProjectSelect = (projectName: string) => {
    setSelectedProjectName(projectName);
    const proj = activeCompany.projects.find((p) => p.name === projectName) || activeCompany.projects[0];
    setWizardData({
      ...wizardData,
      project: proj.name,
      reportingPeriod: proj.periods[0],
      fiscalYear: proj.fiscalYears[0],
      currency: proj.currencies[0],
      accountingStandard: proj.accountingStandards[0]
    });
  };

  // AI Chat Refinement State inside Deliverable Preview
  const [activePreviewPage, setActivePreviewPage] = useState<number>(1);
  const documentCanvasRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'eve'; text: string; time: string }>>([
    {
      sender: 'eve',
      text: 'I have compiled the draft deliverable using the Modern Advisory template with Hermes 4-Agent verification. How can I help you refine this report?',
      time: 'Just now',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [reportTone, setReportTone] = useState<'Standard' | 'Concise' | 'Detailed' | 'Investor Focus'>('Standard');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Deliverable Categories
  const deliverableTypeCategories = [
    {
      category: 'Audit & Assurance',
      items: [
        'Annual Audit Report', 'Quarterly Review', 'Management Letter', 'Audit Committee Package',
        'Findings Report', 'Internal Controls Report', 'SOX Review', 'Evidence Package'
      ]
    },
    {
      category: 'Financial Advisory',
      items: ['Valuation Report', 'Financial Health Review', 'Capital Allocation Summary', 'Working Capital Audit']
    },
    {
      category: 'Transaction Advisory',
      items: ['M&A Due Diligence', 'Quality of Earnings (QoE)', 'Vendor Due Diligence']
    },
    {
      category: 'Compliance & Investigations',
      items: ['Fraud Investigation', 'Anti-Money Laundering Review', 'Regulatory Compliance Check']
    }
  ];

  const audienceOptions = [
    { id: 'board', title: 'Board of Directors', icon: Building2, desc: 'Strategic high-level focus' },
    { id: 'audit_comm', title: 'Audit Committee', icon: Shield, desc: 'Governance & risk focus' },
    { id: 'ceo', title: 'CEO', icon: Users, desc: 'Executive summary & KPIs' },
    { id: 'cfo', title: 'BarChart2', icon: BarChart2, desc: 'Technical & financial depth' },
    { id: 'investor', title: 'Investor', icon: Zap, desc: 'Return & growth metrics' },
    { id: 'lender', title: 'Lender / Bank', icon: FolderKanban, desc: 'Debt coverage & solvency' },
  ];

  const detailLevels = [
    { id: 'snapshot', title: 'Snapshot', pages: '1-2 pages', desc: 'Single-page briefing card' },
    { id: 'executive', title: 'Executive', pages: '3-7 pages', desc: 'Balanced summary for leadership' },
    { id: 'professional', title: 'Professional', pages: '10-35 pages', desc: 'Standard formal audit package' },
    { id: 'comprehensive', title: 'Comprehensive', pages: '25-75 pages', desc: 'In-depth multi-section dossier' },
  ];

  // Open wizard
  const handleOpenWizard = () => {
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  // Close wizard and select variation to preview
  const handleSelectVariationAndPreview = (variationName: 'Corporate Classic' | 'Modern Advisory' | 'Executive Board') => {
    const newItem: DeliverableItem = {
      id: `del-${Date.now()}`,
      name: `${wizardData.deliverableType} - ${wizardData.company}`,
      company: wizardData.company,
      project: wizardData.project,
      type: wizardData.deliverableType,
      audience: wizardData.audience,
      status: 'Draft',
      pages: variationName === 'Executive Board' ? 14 : variationName === 'Corporate Classic' ? 22 : 20,
      updated: 'Just now',
      variation: variationName,
    };
    setDeliverables([newItem, ...deliverables]);
    setSelectedDeliverableForPreview(newItem);
    setIsWizardOpen(false);
    setIsPreviewOpen(true);
    setActivePreviewPage(1);
  };

  // Scroll Canvas to Specific Page
  const scrollToPage = (pageNumber: number) => {
    setActivePreviewPage(pageNumber);
    const targetElement = document.getElementById(`doc-page-${pageNumber}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Export PDF trigger
  const handleExportPDF = () => {
    if (!selectedDeliverableForPreview) return;
    const element = document.createElement("a");
    const fileContent = `TELEFÓNICA S.A. - INDEPENDENT AUDITOR'S REPORT & ADVISORY DOSSIER\n` +
      `============================================================\n` +
      `Deliverable: ${selectedDeliverableForPreview.name}\n` +
      `Company: ${selectedDeliverableForPreview.company}\n` +
      `Project: ${selectedDeliverableForPreview.project}\n` +
      `Audience: ${selectedDeliverableForPreview.audience}\n` +
      `Status: ${selectedDeliverableForPreview.status}\n` +
      `Accounting Framework: IFRS / US GAAP\n` +
      `Date: August 6, 2026\n\n` +
      `EXECUTIVE SUMMARY & AUDIT OPINION:\n` +
      `In our opinion, the consolidated financial statements present fairly, in all material respects, the financial position of Telefónica S.A. as of December 31, 2024, and the results of its operations and cash flows for the year then ended in conformity with International Financial Reporting Standards (IFRS 15/16) and U.S. GAAP.\n\n` +
      `KEY AUDITED FINANCIAL HIGHLIGHTS (€ BASE):\n` +
      `- Total Revenue: €40,652M (+1.6% YoY)\n` +
      `- Net Income: €2,350M (+35.3% YoY)\n` +
      `- EBITDA Margin: 31.6% (+180 bps expansion)\n` +
      `- Solvency Current Ratio: 1.8x\n\n` +
      `HERMES CONSENSUS AUDIT FINDINGS:\n` +
      `1. Allowance for Expected Credit Loss (ECL): Vouched subledger totaling €7.28B against 3rd-party bank confirmations. Reconciled €18.5M impairment reserve adjustment per IFRS 9.\n` +
      `2. Benford's Law Journal Entry Analysis: Evaluated 142,890 GL entries; zero fraudulent anomalies flagged.\n\n` +
      `Digitally Signed & Published by Eve's Bookkeeping & Audit Intelligence Platform.`;

    const safeClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const file = new Blob([fileContent], { type: 'application/pdf' });
    element.href = URL.createObjectURL(file);
    element.download = `${safeClientName}_${selectedDeliverableForPreview.project.replace(/[^a-zA-Z0-9]/g, '_')}_Audit_Report.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Export Word .docx trigger
  const handleExportWord = () => {
    if (!selectedDeliverableForPreview) return;
    const safeClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const element = document.createElement("a");
    const fileContent = `${clientName.toUpperCase()} - INDEPENDENT AUDITOR'S REPORT & ADVISORY DOSSIER\n` +
      `============================================================\n` +
      `Deliverable: ${selectedDeliverableForPreview.name}\n` +
      `Company: ${selectedDeliverableForPreview.company}\n` +
      `Project: ${selectedDeliverableForPreview.project}\n` +
      `Audience: ${selectedDeliverableForPreview.audience}\n` +
      `Date: August 6, 2026\n\n` +
      `EXECUTIVE SUMMARY:\n` +
      `In our opinion, the consolidated financial statements present fairly, in all material respects, the financial position of ${clientName} as of December 31, 2024...`;

    const file = new Blob([fileContent], { type: 'application/msword' });
    element.href = URL.createObjectURL(file);
    element.download = `${safeClientName}_${selectedDeliverableForPreview.project.replace(/[^a-zA-Z0-9]/g, '_')}_Audit_Report.docx`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Publish to Portal trigger
  const handlePublishToPortal = () => {
    if (!selectedDeliverableForPreview) return;
    const updatedItem = { ...selectedDeliverableForPreview, status: 'Published' as const, updated: 'Just now' };
    setSelectedDeliverableForPreview(updatedItem);
    setDeliverables((prev) => prev.map((d) => (d.id === updatedItem.id ? updatedItem : d)));
    setPublishedToast(`"Annual Audit Report - Telefónica S.A." has been published to the Client Portal!`);
    setTimeout(() => setPublishedToast(null), 5000);
  };

  // Send for approval
  const handleSendForApproval = () => {
    if (!selectedDeliverableForPreview) return;
    const updatedItem = { ...selectedDeliverableForPreview, status: 'Awaiting Approval' as const, updated: 'Just now' };
    setSelectedDeliverableForPreview(updatedItem);
    setDeliverables((prev) => prev.map((d) => (d.id === updatedItem.id ? updatedItem : d)));
    setPublishedToast(`Submitted to Managing Partner for final approval.`);
    setTimeout(() => setPublishedToast(null), 4000);
  };

  // Handle AI Chat submit inside Preview
  const handleSendAIChat = (textToSend?: string) => {
    const msgText = textToSend || inputPrompt;
    if (!msgText.trim()) return;

    const userMsg = { sender: 'user' as const, text: msgText, time: 'Just now' };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsRegenerating(true);

    setTimeout(() => {
      let replyText = 'Updated section content and re-aligned financial charts according to your request.';
      if (msgText.toLowerCase().includes('shorter') || msgText.toLowerCase().includes('concise')) {
        replyText = 'Updated the Executive Summary and Financial Overview to a condensed 2-page briefing layout.';
        setReportTone('Concise');
      } else if (msgText.toLowerCase().includes('chart')) {
        replyText = 'Added 2 comparative waterfall charts illustrating EBITDA bridge and Net Debt breakdown.';
      } else if (msgText.toLowerCase().includes('investor')) {
        replyText = 'Reframed key metrics around EBITDA growth, ROIC, and Free Cash Flow yield.';
        setReportTone('Investor Focus');
      } else if (msgText.toLowerCase().includes('spanish')) {
        replyText = 'Translated the entire report and audit opinion disclosures to formal Castilian Spanish (es-ES).';
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'eve',
          text: replyText,
          time: 'Just now',
        },
      ]);
      setIsRegenerating(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 text-slate-800 pb-12">
      
      {/* Toast Notification for Publishing / Export */}
      {publishedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#003345] text-white border border-blue-400/40 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 animate-bounce">
          <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-300">Deliverable Portal Status</p>
            <p className="text-xs font-medium text-slate-200 mt-0.5">{publishedToast}</p>
          </div>
          <button
            onClick={() => setPublishedToast(null)}
            className="text-slate-400 hover:text-white text-xs font-bold ml-3 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Banner Header */}
      <div className="bg-gradient-to-r from-[#003345] via-[#004d66] to-[#0066FF] rounded-2xl p-6 text-white shadow-md border border-blue-900/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[11px] font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Hermes Prime AI Deliverable Engine</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">AI Deliverable Generator & Reports Portal</h2>
            <p className="text-xs text-blue-100 max-w-xl">
              Create, review, and publish Big-4 standard audit opinions, board decks, and advisory dossiers with Hermes 4-Agent verification.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setIsTemplateLibraryOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer flex items-center space-x-1.5"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Report Library</span>
            </button>
            <button
              onClick={handleOpenWizard}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Deliverable</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Deliverables</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalDeliverables}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Active report dossiers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-amber-600 uppercase">Drafts & In Progress</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{draftCount + awaitingReviewCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Hermes writer compiling</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-indigo-600 uppercase">Awaiting Approval</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{awaitingApprovalCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Partner sign-off pending</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-emerald-600 uppercase">Published to Portal</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{publishedCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Ready for PDF / Word export</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 md:col-span-1">
          <p className="text-[10px] font-bold text-blue-600 uppercase">Primary Entity</p>
          <div className="flex items-center space-x-1.5 mt-1">
            <CorporateLogo name={clientName} className="h-5" />
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Primary Jurisdiction • IFRS</p>
        </div>
      </div>

      {/* Active Deliverables Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Engagement Deliverables Directory</h3>
            <p className="text-xs text-slate-500">Manage published audit packages, board decks, and client reports.</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenWizard}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Deliverable</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5 pl-6">Deliverable Name</th>
                <th className="p-3.5">Company / Entity</th>
                <th className="p-3.5">Project</th>
                <th className="p-3.5">Audience</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Pages</th>
                <th className="p-3.5 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {deliverables.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 pl-6 font-bold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-700 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>{item.company}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-600 font-mono text-[11px]">{item.project}</td>
                  <td className="p-3.5 text-slate-600">{item.audience}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Published'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.status === 'Awaiting Approval'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 text-[11px]">{item.pages} p.</td>
                  <td className="p-3.5 text-right pr-6 space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDeliverableForPreview(item);
                        setIsPreviewOpen(true);
                        setActivePreviewPage(1);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      View & Export
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7-STEP GENERATE DELIVERABLE AI WIZARD MODAL */}
      {/* ========================================================================= */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Wizard Header */}
            <div className="p-5 bg-[#003345] text-white border-b border-blue-900 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Generate Deliverable — AI Wizard</h2>
                  <p className="text-xs text-blue-200">7-Step automated report compilation & Hermes verification.</p>
                </div>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="text-slate-300 hover:text-white font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                {[
                  { step: 1, label: 'Company & Project' },
                  { step: 2, label: 'Type' },
                  { step: 3, label: 'Audience' },
                  { step: 4, label: 'Detail Level' },
                  { step: 5, label: 'Branding' },
                  { step: 6, label: 'Contents' },
                  { step: 7, label: 'Review & Generate' },
                ].map((s, idx) => {
                  const isActive = wizardStep === s.step;
                  const isPassed = wizardStep > s.step;
                  return (
                    <React.Fragment key={s.step}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                            isPassed
                              ? 'bg-emerald-600 text-white'
                              : isActive
                              ? 'bg-[#0066FF] text-white ring-4 ring-blue-100'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isPassed ? '✓' : s.step}
                        </div>
                        <span className={`text-[10px] mt-1 font-medium hidden md:block ${isActive ? 'text-[#0066FF] font-bold' : 'text-slate-500'}`}>
                          {s.label}
                        </span>
                      </div>
                      {idx < 6 && (
                        <div className={`flex-1 h-0.5 mx-2 ${wizardStep > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Wizard Body Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* STEP 1: SELECT COMPANY & PROJECT */}
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">Step 1 of 7</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">Select Company & Engagement Project</h3>
                    <p className="text-xs text-slate-500">Choose the company and active engagement parameters to auto-populate reporting periods and currencies.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Entity</label>
                      <select
                        value={wizardData.company}
                        onChange={(e) => setWizardData({ ...wizardData, company: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-bold text-slate-900"
                      >
                        <option value="Telefónica S.A.">Telefónica S.A.</option>
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">Active client entity mapped from workspace uploads.</p>
                    </div>

                    {/* Project Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Project Engagement</label>
                      <select
                        value={selectedProjectName}
                        onChange={(e) => handleProjectSelect(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-bold text-slate-900"
                      >
                        {activeCompany.projects.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">Select from available engagements for {activeCompany.name}.</p>
                    </div>

                    {/* Auto-populated Reporting Period */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Reporting Period</label>
                      <select
                        value={wizardData.reportingPeriod}
                        onChange={(e) => setWizardData({ ...wizardData, reportingPeriod: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {currentProject.periods.map((pd, i) => (
                          <option key={i} value={pd}>{pd}</option>
                        ))}
                      </select>
                    </div>

                    {/* Fiscal Year */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Fiscal Year</label>
                      <select
                        value={wizardData.fiscalYear}
                        onChange={(e) => setWizardData({ ...wizardData, fiscalYear: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {currentProject.fiscalYears.map((fy, i) => (
                          <option key={i} value={fy}>{fy}</option>
                        ))}
                      </select>
                    </div>

                    {/* Presentation Currency */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Presentation Currency</label>
                      <select
                        value={wizardData.currency}
                        onChange={(e) => setWizardData({ ...wizardData, currency: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                      >
                        {currentProject.currencies.map((curr, i) => (
                          <option key={i} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>

                    {/* Accounting Framework */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Accounting Standard Framework</label>
                      <select
                        value={wizardData.accountingStandard}
                        onChange={(e) => setWizardData({ ...wizardData, accountingStandard: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {currentProject.accountingStandards.map((std, i) => (
                          <option key={i} value={std}>{std}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wizardData.consolidated}
                          onChange={(e) => setWizardData({ ...wizardData, consolidated: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span>Consolidated Financial Statements</span>
                      </label>

                      <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wizardData.includeSubsidiaries}
                          onChange={(e) => setWizardData({ ...wizardData, includeSubsidiaries: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span>Include Subsidiaries & Segment Details</span>
                      </label>
                    </div>
                  </div>

                  {/* Dynamic Live Project Readiness Score */}
                  <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-600 flex items-center justify-center font-bold text-emerald-900 text-lg bg-white shrink-0 shadow-2xs">
                      {dynamicScore}%
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Dynamic Project Readiness Score</h4>
                        <span className="text-[10px] font-mono font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                          Live Verified
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-900">
                        Calculated in real-time from trial balance completeness, subledger vouchers, and open audit items for <strong>{currentProject.name}</strong>.
                      </p>
                      
                      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <span className="flex items-center space-x-1 text-emerald-800 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>All key financial ledgers available ({currentProject.completedItemsCount} of {currentProject.totalItemsCount} areas complete)</span>
                        </span>

                        {currentProject.openItems.length > 0 ? (
                          <span className="flex items-center space-x-1 text-amber-800 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{currentProject.openItems.length} open items require attention before publishing</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-emerald-800 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Zero blocking audit exceptions</span>
                          </span>
                        )}
                      </div>

                      {/* Display Specific Open Items if any */}
                      {currentProject.openItems.length > 0 && (
                        <div className="mt-2 p-2.5 bg-amber-100/60 rounded-xl border border-amber-200/80 space-y-1 text-[10px] text-amber-950">
                          <p className="font-bold uppercase tracking-wider text-[9px] text-amber-900">Items to point people to before report finalization:</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {currentProject.openItems.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT DELIVERABLE TYPE */}
              {wizardStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">Step 2 of 7</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">What type of deliverable do you need?</h3>
                    <p className="text-xs text-slate-500">Select the report or package structure to be generated for {wizardData.company}.</p>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search deliverable types (e.g. Audit, Board, Management Letter)..."
                      value={wizardData.searchTypeQuery}
                      onChange={(e) => setWizardData({ ...wizardData, searchTypeQuery: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-6">
                    {deliverableTypeCategories.map((cat, idx) => (
                      <div key={idx} className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cat.category}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {cat.items.map((item) => {
                            const isSelected = wizardData.deliverableType === item;
                            return (
                              <button
                                key={item}
                                onClick={() => setWizardData({ ...wizardData, deliverableType: item })}
                                className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col justify-between ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 font-bold text-blue-900'
                                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <FileText className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                                </div>
                                <span>{item}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: SELECT AUDIENCE */}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">Step 3 of 7</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">Who is this deliverable for?</h3>
                    <p className="text-xs text-slate-500">Hermes Prime tailors technical depth, language tone, and recommendations based on audience.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {audienceOptions.map((aud) => {
                      const Icon = aud.icon;
                      const isSelected = wizardData.audience === aud.title;
                      return (
                        <div
                          key={aud.id}
                          onClick={() => setWizardData({ ...wizardData, audience: aud.title })}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>{aud.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{aud.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: DETAIL LEVEL */}
              {wizardStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">Step 4 of 7</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">How detailed should this be?</h3>
                    <p className="text-xs text-slate-500">Select report volume and include supporting evidence options.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Volume</h4>
                      {detailLevels.map((dl) => {
                        const isSelected = wizardData.detailLevel.startsWith(dl.title);
                        return (
                          <div
                            key={dl.id}
                            onClick={() => setWizardData({ ...wizardData, detailLevel: `${dl.title} (${dl.pages})` })}
                            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">{dl.title}</p>
                                <p className="text-[10px] text-slate-500">{dl.desc}</p>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/60 px-2.5 py-0.5 rounded-md">
                              {dl.pages}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Include in Report Package</h4>
                      
                      <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wizardData.includeAppendices}
                          onChange={(e) => setWizardData({ ...wizardData, includeAppendices: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300"
                        />
                        <span className="font-semibold">Appendices & Financial Schedules</span>
                      </label>

                      <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wizardData.includeCitations}
                          onChange={(e) => setWizardData({ ...wizardData, includeCitations: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300"
                        />
                        <span className="font-semibold">Source Citations & Working Paper References</span>
                      </label>

                      <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wizardData.includeEvidence}
                          onChange={(e) => setWizardData({ ...wizardData, includeEvidence: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300"
                        />
                        <span className="font-semibold">Supporting Evidence & Bank Confirmation Links</span>
                      </label>

                      <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wizardData.includeConsensus}
                          onChange={(e) => setWizardData({ ...wizardData, includeConsensus: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300"
                        />
                        <span className="font-semibold">Hermes 4-Agent Consensus Summary</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: BRANDING CONFIRMATION & CLIENT LOGO */}
              {wizardStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">Step 5 of 7</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">Client Visual Branding & Official Logo</h3>
                    <p className="text-xs text-slate-500">Firm branding represents the CPA practice, and client logo represents {activeCompany.name}.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Firm Logo */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FIRM BRANDING (CPA PRACTICE)</span>
                      <div className="flex items-center space-x-3 p-3 bg-[#0b1739] rounded-xl text-white font-serif font-bold text-sm">
                        <span className="text-emerald-400 font-sans text-xs">EVE'S</span>
                        <span>BOOKKEEPING / CPA</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Rendered on audit headers and digital signatures.</p>
                    </div>

                    {/* Client Official Logo */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">CLIENT OFFICIAL LOGO ({clientName})</span>
                      <div className="flex items-center space-x-3 p-3 bg-slate-100 rounded-xl border border-slate-200">
                        <CorporateLogo name={clientName} className="h-7" />
                      </div>
                      <p className="text-[10px] text-slate-500">Official logo generated from client brand identity repository.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Brand Color Palette & Typography</span>
                      <span className="text-[10px] font-mono text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">Extracted</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-[#003345] border border-slate-300" title="Telefónica Navy" />
                        <div className="w-8 h-8 rounded-lg bg-[#0066FF] border border-slate-300" title="Telefónica Blue" />
                        <div className="w-8 h-8 rounded-lg bg-[#00A9E0] border border-slate-300" title="Tech Cyan" />
                        <div className="w-8 h-8 rounded-lg bg-[#F4F6F9] border border-slate-300" title="Light Canvas" />
                      </div>
                      <div className="text-xs text-slate-600 font-mono pl-4 border-l border-slate-200">
                        Font: Plus Jakarta Sans / Inter • Style: Modern Advisory
                      </div>
                    </div>
                  </div>

                  {/* Website Discovery Confirmation Badge */}
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-xs text-emerald-950">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Official Client Branding Verified!</p>
                      <p className="text-[11px] text-emerald-900">Retrieved official logo and brand palette for <strong>{clientName}</strong> and embedded in document template engine.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: RECOMMENDED CONTENTS */}
              {wizardStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">Step 6 of 7</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">Recommended report contents</h3>
                    <p className="text-xs text-slate-500">Review and customize the sections to include in this deliverable.</p>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
                    {[
                      { section: 'Cover Page & Brand Header', depth: 'Standard' },
                      { section: 'Executive Summary & Independent Auditor Opinion', depth: 'Moderate' },
                      { section: 'Key Financial Highlights & Ratios (€ Base)', depth: 'Detailed' },
                      { section: 'Revenue & Operating Margin Trend Graphs', depth: 'Detailed' },
                      { section: 'Audit Scope & Approach (ISA 320)', depth: 'Standard' },
                      { section: 'Hermes Consensus Audit Findings & ECL Reconciliation', depth: 'Detailed' },
                      { section: 'Benford\'s Law Journal Entry Risk Evaluation', depth: 'Moderate' },
                      { section: 'Audit Committee Digital Sign-Off & Citations Index', depth: 'Standard' },
                    ].map((sec, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <label className="flex items-center space-x-3 font-semibold text-slate-800 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                          <span>{sec.section}</span>
                        </label>
                        <select className="px-2 py-1 text-[11px] rounded-lg border border-slate-300 bg-slate-50 font-medium">
                          <option>{sec.depth}</option>
                          <option>Standard</option>
                          <option>Moderate</option>
                          <option>Detailed</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 7: REVIEW & GENERATE DISTINCT VARIATIONS */}
              {wizardStep === 7 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">Step 7 of 7</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">Choose your template style variation</h3>
                    <p className="text-xs text-slate-500">Select from distinct cover page styles with rich imagery and background artwork.</p>
                  </div>

                  {/* 3 Variations Grid with Cover Artwork Pictures */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    
                    {/* Variation A: Corporate Classic */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 transition flex flex-col justify-between shadow-sm overflow-hidden">
                      <div className="relative">
                        {/* Cover Picture Artwork Background */}
                        <div className="h-32 bg-[#001f2d] relative overflow-hidden p-3 text-white flex flex-col justify-between">
                          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80')] bg-cover bg-center opacity-30" />
                          <div className="relative z-10 flex justify-between items-start">
                            <span className="font-serif font-bold text-xs text-blue-200">EVE'S CPA</span>
                            <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded font-mono">CLASSIC</span>
                          </div>
                          <div className="relative z-10">
                            <p className="font-serif text-sm font-bold text-white">Telefónica S.A.</p>
                            <p className="text-[9px] text-blue-100 font-mono">AUDIT OPINION DOSSIER</p>
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Variation A</span>
                          <h4 className="text-sm font-bold text-slate-900">Corporate Classic</h4>
                          <p className="text-[11px] text-slate-500">Traditional formal layout with skyscraper architectural imagery, serif typography, and formal tables.</p>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          onClick={() => handleSelectVariationAndPreview('Corporate Classic')}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
                        >
                          Preview Variation A
                        </button>
                      </div>
                    </div>

                    {/* Variation B: Modern Advisory (Recommended) */}
                    <div className="bg-white rounded-2xl border-2 border-[#0066FF] shadow-md flex flex-col justify-between relative overflow-hidden">
                      <span className="absolute top-2 right-2 z-20 bg-[#0066FF] text-white text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                        Recommended
                      </span>
                      <div>
                        {/* Cover Picture Artwork Background */}
                        <div className="h-32 bg-gradient-to-br from-[#003345] via-[#004d66] to-[#0066FF] relative overflow-hidden p-3 text-white flex flex-col justify-between">
                          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80')] bg-cover bg-center opacity-25" />
                          <div className="relative z-10 flex justify-between items-start">
                            <CorporateLogo name={clientName} dark className="h-5" />
                          </div>
                          <div className="relative z-10">
                            <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">EXECUTIVE ADVISORY DOSSIER</p>
                            <p className="text-[10px] text-blue-100">Modern visual storytelling with charts & callouts</p>
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <span className="text-[10px] font-bold text-[#0066FF] uppercase tracking-wider">Variation B</span>
                          <h4 className="text-sm font-bold text-slate-900">Modern Advisory</h4>
                          <p className="text-[11px] text-slate-500">Clean, high-impact design with gradient mesh cover imagery, modern sans typography, and callout metric cards.</p>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          onClick={() => handleSelectVariationAndPreview('Modern Advisory')}
                          className="w-full py-2 bg-[#0066FF] hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
                        >
                          Preview Variation B
                        </button>
                      </div>
                    </div>

                    {/* Variation C: Executive Board */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 transition flex flex-col justify-between shadow-sm overflow-hidden">
                      <div>
                        {/* Cover Picture Artwork Background */}
                        <div className="h-32 bg-slate-950 relative overflow-hidden p-3 text-white flex flex-col justify-between">
                          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80')] bg-cover bg-center opacity-30" />
                          <div className="relative z-10 flex justify-between items-start">
                            <span className="font-bold text-xs text-amber-400">BOARD BRIEFING</span>
                            <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300">CONFIDENTIAL</span>
                          </div>
                          <div className="relative z-10">
                            <p className="text-xs font-bold text-white">STRATEGIC FINANCIAL HIGHLIGHTS</p>
                            <p className="text-[9px] text-slate-400">EBITDA & Cash Conversion Deck</p>
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Variation C</span>
                          <h4 className="text-sm font-bold text-slate-900">Executive Board</h4>
                          <p className="text-[11px] text-slate-500">Concise board deck format with dark luxury cover photography, high-level highlights, and chart decks.</p>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          onClick={() => handleSelectVariationAndPreview('Executive Board')}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
                        >
                          Preview Variation C
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Footer Navigation Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                disabled={wizardStep === 1}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                ← Back
              </button>

              <div className="flex items-center space-x-3">
                {wizardStep < 7 ? (
                  <button
                    onClick={() => setWizardStep((prev) => Math.min(7, prev + 1))}
                    className="px-6 py-2 rounded-xl text-xs font-semibold bg-[#0066FF] hover:bg-blue-700 text-white transition cursor-pointer shadow-xs"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectVariationAndPreview('Modern Advisory')}
                    className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-xs"
                  >
                    Confirm & Publish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE-BY-PAGE INTERACTIVE DELIVERABLE PREVIEW & AI STAGE */}
      {/* ========================================================================= */}
      {isPreviewOpen && selectedDeliverableForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex flex-col overflow-hidden text-slate-100">
          
          {/* Top Navigation Bar */}
          <div className="h-14 bg-[#001a24] border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>{selectedDeliverableForPreview.name}</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                    {selectedDeliverableForPreview.variation || 'Modern Advisory'}
                  </span>
                </h2>
                <p className="text-[10px] text-slate-400">
                  {selectedDeliverableForPreview.company} • {selectedDeliverableForPreview.project} • {selectedDeliverableForPreview.pages} Pages
                </p>
              </div>
            </div>

            {/* Action Buttons: Working PDF / Word Export & Publish */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportPDF}
                className="px-3.5 py-1.5 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={handleExportWord}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Word (.docx)</span>
              </button>

              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Main Stage Grid: Left Thumbnails, Middle Multi-Page Scroll Canvas, Right AI Panel */}
          <div className="flex-1 grid grid-cols-12 overflow-hidden">
            
            {/* Left Thumbnail Page Navigator */}
            <div className="col-span-2 bg-[#00121a] border-r border-slate-800/80 p-3 overflow-y-auto space-y-3 hidden lg:block">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">Page Navigator (1 of 6)</p>
              {[
                { p: 1, title: 'Cover Page' },
                { p: 2, title: 'Executive Opinion' },
                { p: 3, title: 'Financial Highlights' },
                { p: 4, title: 'Revenue & Margins' },
                { p: 5, title: 'Hermes Audit Risks' },
                { p: 6, title: 'Sign-Off & Index' },
              ].map((pg) => (
                <div
                  key={pg.p}
                  onClick={() => scrollToPage(pg.p)}
                  className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                    activePreviewPage === pg.p
                      ? 'border-[#0066FF] bg-blue-950/60 ring-1 ring-blue-500'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                  }`}
                >
                  <div className="aspect-[1/1.3] bg-white text-slate-900 p-2 rounded text-[6px] overflow-hidden leading-tight flex flex-col justify-between shadow-xs">
                    <div className="border-b pb-1 font-bold flex justify-between text-[#003345]">
                      <span>TELEFÓNICA</span>
                      <span>p. {pg.p}</span>
                    </div>
                    <div className="space-y-1 my-auto">
                      <div className="h-1 bg-blue-600 rounded w-3/4" />
                      <div className="h-1 bg-slate-300 rounded w-full" />
                      <div className="h-1 bg-slate-200 rounded w-5/6" />
                    </div>
                    <div className="h-1.5 bg-blue-100 rounded" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 block text-center mt-1">
                    {pg.p}. {pg.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Middle Document Canvas - Multi-Page Continuous Scroll */}
            <div className="col-span-12 lg:col-span-7 bg-slate-950 p-6 overflow-y-auto flex flex-col items-center space-y-8 scrollbar-thin">
              
              {/* PAGE 1: COVER PAGE */}
              <div
                id="doc-page-1"
                className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 min-h-[850px] flex flex-col justify-between font-sans relative"
              >
                {/* Cover Header Banner Artwork */}
                <div className="bg-gradient-to-br from-[#003345] via-[#004d66] to-[#0066FF] p-10 text-white relative overflow-hidden flex-1 flex flex-col justify-between">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-20" />
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <CorporateLogo name={clientName} dark className="h-10" />
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-xs rounded-full text-[10px] font-mono text-cyan-200 border border-white/20">
                      CONFIDENTIAL DOSSIER
                    </span>
                  </div>

                  <div className="relative z-10 space-y-4 my-auto py-12">
                    <span className="text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase">
                      INDEPENDENT AUDITOR'S REPORT & ADVISORY PACKAGE
                    </span>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                      ANNUAL AUDIT REPORT FY2024
                    </h1>
                    <p className="text-sm text-blue-100 max-w-lg">
                      Prepared for the Board of Directors & Audit Committee of {clientName}
                    </p>
                  </div>

                  <div className="relative z-10 pt-6 border-t border-blue-400/30 flex justify-between items-end text-xs text-blue-100">
                    <div>
                      <p className="font-bold text-white">EVE'S BOOKKEEPING & CPA PRACTICE</p>
                      <p className="text-[10px] font-mono text-blue-200">Hermes 4-Agent Consensus Certified</p>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <p>Date: August 6, 2026</p>
                      <p>Ref: W/P-AUDIT-2024</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t text-center text-[10px] font-mono text-slate-500">
                  Page 1 of 6 • Cover Page • {clientName} FY2024
                </div>
              </div>

              {/* PAGE 2: EXECUTIVE SUMMARY */}
              <div
                id="doc-page-2"
                className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 min-h-[850px] flex flex-col justify-between font-sans relative"
              >
                <div>
                  <div className="flex items-center justify-between border-b pb-4 mb-6">
                    <CorporateLogo name={clientName} className="h-6" />
                    <span className="text-[10px] font-mono text-slate-500">Page 2 of 6</span>
                  </div>

                  <h2 className="text-lg font-bold text-[#003345] mb-4">1. Executive Summary & Audit Opinion</h2>
                  
                  <div className="p-5 bg-blue-50/70 border-l-4 border-[#0066FF] rounded-r-2xl space-y-2 mb-6">
                    <h3 className="font-bold text-[#003345] text-xs uppercase tracking-wider">Independent Auditor's Declaration</h3>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      In our opinion, the consolidated financial statements present fairly, in all material respects, the financial position of <strong>{clientName}</strong> as of December 31, 2024, and the results of its operations and cash flows for the year then ended in conformity with U.S. Generally Accepted Accounting Principles (US GAAP) and International Financial Reporting Standards (IFRS 15/16).
                    </p>
                  </div>

                  <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                    <h3 className="font-bold text-slate-900">Basis for Opinion</h3>
                    <p>
                      We conducted our audit in accordance with International Standards on Auditing (ISAs). Our responsibilities under those standards are further described in the Auditor's Responsibilities for the Audit of the Financial Statements section of our report.
                    </p>

                    <h3 className="font-bold text-slate-900">Key Audit Scope & Thresholds</h3>
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                      <div>
                        <span className="text-slate-500 font-semibold block">Planning Materiality (ISA 320):</span>
                        <strong className="text-[#003345] font-mono">€609.7M (1.5% of Gross Revenue)</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Tolerable Misstatement:</span>
                        <strong className="text-[#003345] font-mono">€304.8M (50% of Materiality)</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Confidential - For Board of Directors Use Only</span>
                  <span>Page 2 of 6</span>
                </div>
              </div>

              {/* PAGE 3: AUDITED FINANCIAL HIGHLIGHTS */}
              <div
                id="doc-page-3"
                className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 min-h-[850px] flex flex-col justify-between font-sans relative"
              >
                <div>
                  <div className="flex items-center justify-between border-b pb-4 mb-6">
                    <CorporateLogo name={clientName} className="h-6" />
                    <span className="text-[10px] font-mono text-slate-500">Page 3 of 6</span>
                  </div>

                  <h2 className="text-lg font-bold text-[#003345] mb-4">2. Audited Financial Highlights (€ Base)</h2>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-6">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Total Revenue</p>
                      <p className="text-lg font-black text-[#003345] mt-1">€40,652M</p>
                      <p className="text-[9px] text-emerald-600 font-bold">↑ 1.6% YoY</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Net Income</p>
                      <p className="text-lg font-black text-[#003345] mt-1">€2,350M</p>
                      <p className="text-[9px] text-emerald-600 font-bold">↑ 35.3% YoY</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">EBITDA Margin</p>
                      <p className="text-lg font-black text-[#003345] mt-1">31.6%</p>
                      <p className="text-[9px] text-emerald-600 font-bold">+180 bps</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Current Ratio</p>
                      <p className="text-lg font-black text-[#003345] mt-1">1.8x</p>
                      <p className="text-[9px] text-emerald-600 font-bold">Solvent</p>
                    </div>
                  </div>

                  {/* Summary Table */}
                  <div className="border rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#003345] text-white text-[10px] font-bold uppercase">
                        <tr>
                          <th className="p-2.5">Financial Metric (€ Millions)</th>
                          <th className="p-2.5 text-right">FY2024</th>
                          <th className="p-2.5 text-right">FY2023</th>
                          <th className="p-2.5 text-right">Variance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-2.5 font-semibold">Service Revenues</td>
                          <td className="p-2.5 text-right font-mono">€37,120M</td>
                          <td className="p-2.5 text-right font-mono">€36,450M</td>
                          <td className="p-2.5 text-right text-emerald-600 font-bold">+1.8%</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold">Operating Expenses (OPEX)</td>
                          <td className="p-2.5 text-right font-mono">€27,812M</td>
                          <td className="p-2.5 text-right font-mono">€27,990M</td>
                          <td className="p-2.5 text-right text-emerald-600 font-bold">-0.6%</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold">Free Cash Flow (FCF)</td>
                          <td className="p-2.5 text-right font-mono">€4,230M</td>
                          <td className="p-2.5 text-right font-mono">€3,890M</td>
                          <td className="p-2.5 text-right text-emerald-600 font-bold">+8.7%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Confidential - {clientName}</span>
                  <span>Page 3 of 6</span>
                </div>
              </div>

              {/* PAGE 4: REVENUE & MARGIN TREND GRAPHS */}
              <div
                id="doc-page-4"
                className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 min-h-[850px] flex flex-col justify-between font-sans relative"
              >
                <div>
                  <div className="flex items-center justify-between border-b pb-4 mb-6">
                    <CorporateLogo name={clientName} className="h-6" />
                    <span className="text-[10px] font-mono text-slate-500">Page 4 of 6</span>
                  </div>

                  <h2 className="text-lg font-bold text-[#003345] mb-4">3. Segment Revenue & Margin Trends</h2>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 mb-6">
                    <h4 className="font-bold text-[#003345] text-xs">Quarterly Revenue Breakdown (FY2024)</h4>
                    <div className="h-32 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-200">
                      <div className="w-full bg-[#003345] text-white rounded-t h-[65%] flex items-center justify-center text-[9px] font-bold">€9.8B</div>
                      <div className="w-full bg-[#004d66] text-white rounded-t h-[75%] flex items-center justify-center text-[9px] font-bold">€10.1B</div>
                      <div className="w-full bg-[#0066FF] text-white rounded-t h-[82%] flex items-center justify-center text-[9px] font-bold">€10.3B</div>
                      <div className="w-full bg-[#00A9E0] text-white rounded-t h-[95%] flex items-center justify-center text-[9px] font-bold">€10.4B</div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 px-2">
                      <span>Q1 2024</span>
                      <span>Q2 2024</span>
                      <span>Q3 2024</span>
                      <span>Q4 2024</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-[#003345]">Key Operating Division Contributions</h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li><strong>Domestic Operating Division:</strong> €12,650M revenue (31.1% of total) with 36.4% EBITDA margin.</li>
                      <li><strong>International Subsidiaries & JVs:</strong> Strong ARPU growth across core lines.</li>
                      <li><strong>Digital Infrastructure:</strong> System upgrades completed ahead of schedule.</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Confidential - {clientName}</span>
                  <span>Page 4 of 6</span>
                </div>
              </div>

              {/* PAGE 5: HERMES AUDIT FINDINGS */}
              <div
                id="doc-page-5"
                className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 min-h-[850px] flex flex-col justify-between font-sans relative"
              >
                <div>
                  <div className="flex items-center justify-between border-b pb-4 mb-6">
                    <CorporateLogo name={clientName} className="h-6" />
                    <span className="text-[10px] font-mono text-slate-500">Page 5 of 6</span>
                  </div>

                  <h2 className="text-lg font-bold text-[#003345] mb-4">4. Hermes Consensus Findings & ECL Verification</h2>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 mb-4 text-amber-950 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>Key Audit Matter: Allowance for Expected Credit Loss (ECL - IFRS 9)</span>
                      <span className="text-[9px] bg-amber-200 px-2 py-0.5 rounded font-mono">Verified</span>
                    </div>
                    <p className="leading-relaxed">
                      Vouched telecom receivables subledger totaling €7.28B against bank confirmation responses. Reconciled €18.5M audit adjustment to impairment reserves per IFRS 9.
                    </p>
                    <p className="text-[9px] font-mono text-amber-800 underline">
                      Cited Source: 02_Individual_Report.pdf (p.14), W/P Ref B-2.04
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-950 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>Benford's Law Journal Entry Risk Evaluation</span>
                      <span className="text-[9px] bg-emerald-200 px-2 py-0.5 rounded font-mono">Passed</span>
                    </div>
                    <p className="leading-relaxed">
                      Evaluated 142,890 general ledger postings for first-digit frequency anomalies, weekend entries, or round-dollar overrides. Zero fraudulent journal entries flagged.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Confidential - {clientName}</span>
                  <span>Page 5 of 6</span>
                </div>
              </div>

              {/* PAGE 6: DIGITAL SIGNATURE & INDEX */}
              <div
                id="doc-page-6"
                className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 min-h-[850px] flex flex-col justify-between font-sans relative"
              >
                <div>
                  <div className="flex items-center justify-between border-b pb-4 mb-6">
                    <CorporateLogo name={clientName} className="h-6" />
                    <span className="text-[10px] font-mono text-slate-500">Page 6 of 6</span>
                  </div>

                  <h2 className="text-lg font-bold text-[#003345] mb-4">5. Audit Committee Sign-Off & Index</h2>

                  <div className="p-5 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 space-y-3 mb-6">
                    <h3 className="font-bold text-slate-900 text-xs uppercase">Digital Audit Signature & Hash Certification</h3>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-[10px] text-slate-700 space-y-1">
                      <p><strong>SHA-256 Hash:</strong> e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
                      <p><strong>Signed By:</strong> Eve's Bookkeeping & Audit Partner Intelligence</p>
                      <p><strong>Timestamp:</strong> August 6, 2026 15:24:00 UTC</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900">Working Paper Citation Index</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
                      <span className="p-2 bg-slate-100 rounded">W/P Ref A-1.01: Revenue Ledger</span>
                      <span className="p-2 bg-slate-100 rounded">W/P Ref B-2.04: ECL Reserve</span>
                      <span className="p-2 bg-slate-100 rounded">W/P Ref C-3.12: Bank Confirmations</span>
                      <span className="p-2 bg-slate-100 rounded">W/P Ref D-4.08: Tax Footnotes</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Confidential - End of Deliverable Package</span>
                  <span>Page 6 of 6</span>
                </div>
              </div>

            </div>

            {/* Right Interactive AI Chat & Actions Panel */}
            <div className="col-span-12 lg:col-span-3 bg-[#00121a] border-l border-slate-800 flex flex-col justify-between h-full">
              
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">AI Deliverable Assistant</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">Active</span>
              </div>

              {/* Chat Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`p-3 rounded-2xl max-w-[88%] text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#0066FF] text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono px-1">{msg.time}</span>
                  </div>
                ))}

                {isRegenerating && (
                  <div className="flex items-center space-x-2 text-blue-400 text-xs italic bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Hermes Writer Agent re-orchestrating layout...</span>
                  </div>
                )}
              </div>

              {/* Prompt Shortcuts */}
              <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/40">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quick AI Refinement</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Shorter', 'More Charts', 'Investor Focus', 'Translate to Spanish'
                  ].map((pill) => (
                    <button
                      key={pill}
                      onClick={() => handleSendAIChat(pill)}
                      className="text-[10px] font-medium bg-slate-800 hover:bg-blue-900/60 text-slate-300 hover:text-blue-200 border border-slate-700 rounded-lg px-2 py-1 transition cursor-pointer"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Box & Bottom Workflow Buttons */}
              <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Ask Eve to edit, shorten, or add charts..."
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAIChat()}
                    className="flex-1 bg-slate-800 text-xs text-white placeholder-slate-500 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSendAIChat()}
                    className="p-2 bg-[#0066FF] hover:bg-blue-600 text-white rounded-xl transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Workflow Buttons: Send for Approval & Publish to Portal */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSendForApproval}
                    className="py-2 px-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30 rounded-xl text-[11px] font-bold transition cursor-pointer text-center"
                  >
                    Send for Approval
                  </button>

                  <button
                    onClick={handlePublishToPortal}
                    className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition cursor-pointer text-center shadow-xs"
                  >
                    Publish to Portal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EVE REPORT LIBRARY OVERVIEW MODAL */}
      {/* ========================================================================= */}
      {isTemplateLibraryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl p-6 space-y-6 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Eve Report Library</h2>
                <p className="text-xs text-slate-500">Curated Big-4 standard template families integrated with rendering engines.</p>
              </div>
              <button onClick={() => setIsTemplateLibraryOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { title: 'Annual Audit Report', desc: 'Full ISA / PCAOB compliant audit opinion dossier.', engine: 'PDFme / React PDF' },
                { title: 'Quarterly Review', desc: 'Condensed Q1-Q3 financial review package.', engine: 'jsreport / Carbone' },
                { title: 'Board Package', desc: 'Strategic deck for Board of Directors & C-suite.', engine: 'Carbone (PPTX/PDF)' },
                { title: 'Management Letter', desc: 'Internal control deficiency and action plan report.', engine: 'PDFme' },
                { title: 'Investor Package', desc: 'Growth, EBITDA, and working capital summary.', engine: 'Carbone (XLSX/PDF)' },
                { title: 'Lender Package', desc: 'Solvency and debt covenant compliance report.', engine: 'React PDF' },
              ].map((tpl, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{tpl.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">{tpl.desc}</p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-blue-700 font-semibold">{tpl.engine}</span>
                    <button
                      onClick={() => {
                        setIsTemplateLibraryOpen(false);
                        handleOpenWizard();
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Use Template →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
