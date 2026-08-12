import React, { useState } from 'react';
import { DocumentRecord, Workspace } from '../types';
import {
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Plus,
  Download,
  Share2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Star,
  X,
  Filter,
  FolderPlus,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileSpreadsheet,
  Sparkles,
  Clock,
  Trash2,
  Folder,
  Users,
  Check,
  Copy,
  ExternalLink,
  FileCheck,
  SlidersHorizontal,
  Layers,
  Send,
  Info,
  Building2,
  Briefcase,
  Calendar,
  ShieldCheck,
  User,
  ArrowUpRight,
  UploadCloud
} from 'lucide-react';

interface DocumentExplorerProps {
  documents: DocumentRecord[];
  onOpenUpload?: () => void;
  workspaces?: Workspace[];
}

export const DocumentExplorer: React.FC<DocumentExplorerProps> = ({
  documents: initialDocs = [],
  onOpenUpload,
  workspaces = []
}) => {
  // Real document list from props
  const defaultMockDocs: DocumentRecord[] = [];
  const dummyIgnored: any[] = []; /*
    {
      id: 'doc-101',
      workspaceId: 'ws-1',
      filename: 'Annual Report 2023.pdf',
      originalName: 'Annual Report 2023.pdf',
      mimeType: 'application/pdf',
      size: 2400000,
      sha256: 'a1b2c3d4e5f67890123456789abcdef0',
      status: 'Processed',
      category: 'Annual Report',
      language: 'EN',
      currency: 'USD',
      entityName: 'GlobalTech Solutions',
      period: 'FY2023',
      confidence: 0.98,
      extractedFactsCount: 142,
      reviewStatus: 'approved',
      createdAt: 'May 12, 2024 2:34 PM',
      summary: 'Annual report containing financial performance, strategic initiatives, corporate governance information, and audited consolidated financial statements for fiscal year 2023.'
    },
    {
      id: 'doc-102',
      workspaceId: 'ws-1',
      filename: 'Q4 Financial Statements.xlsx',
      originalName: 'Q4 Financial Statements.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1800000,
      sha256: 'b2c3d4e5f67890123456789abcdef01a',
      status: 'Processed',
      category: 'Financial Statement',
      language: 'EN',
      currency: 'USD',
      entityName: 'GlobalTech Solutions',
      period: 'Q4 2024',
      confidence: 0.96,
      extractedFactsCount: 98,
      reviewStatus: 'approved',
      createdAt: 'May 12, 2024 1:15 PM',
      summary: 'Detailed Q4 2024 trial balance and financial statements including balance sheet, P&L statement, and cash flow schedule.'
    },
    {
      id: 'doc-103',
      workspaceId: 'ws-1',
      filename: 'Bank Confirmation.docx',
      originalName: 'Bank Confirmation.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 245000,
      sha256: 'c3d4e5f67890123456789abcdef012bc',
      status: 'Needs Review',
      category: 'Bank Document',
      language: 'EN',
      currency: 'USD',
      entityName: 'GlobalTech Solutions',
      period: 'Q4 2024',
      confidence: 0.72,
      extractedFactsCount: 18,
      reviewStatus: 'proposed',
      createdAt: 'May 11, 2024 4:45 PM',
      summary: 'Bank account balance confirmation letter from JPMorgan Chase. Flagged for signature verification and account reconciliation.'
    },
    {
      id: 'doc-104',
      workspaceId: 'ws-1',
      filename: 'Lease Agreement - Building.pdf',
      originalName: 'Lease Agreement - Building.pdf',
      mimeType: 'application/pdf',
      size: 3700000,
      sha256: 'd4e5f67890123456789abcdef0123cd',
      status: 'Processed',
      category: 'Contract',
      language: 'EN',
      currency: 'USD',
      entityName: 'GlobalTech Solutions',
      period: 'FY2024',
      confidence: 0.94,
      extractedFactsCount: 35,
      reviewStatus: 'approved',
      createdAt: 'May 11, 2024 11:20 AM',
      summary: 'Commercial real estate lease contract for Headquarters building. Extracted key terms, monthly rent schedules, and renewal options.'
    },
    {
      id: 'doc-105',
      workspaceId: 'ws-1',
      filename: 'Invoice_INV-2024-5678.jpg',
      originalName: 'Invoice_INV-2024-5678.jpg',
      mimeType: 'image/jpeg',
      size: 1200000,
      sha256: 'e5f67890123456789abcdef01234de',
      status: 'Processing',
      category: 'Invoice',
      language: 'EN',
      currency: 'USD',
      entityName: 'GlobalTech Solutions',
      period: 'Apr 2024',
      confidence: 0.00,
      extractedFactsCount: 0,
      reviewStatus: 'pending',
      createdAt: 'May 10, 2024 3:22 PM',
      summary: 'Vendor invoice for cloud infrastructure hosting. Currently running OCR layout detection and line item extraction.'
    },
    {
      id: 'doc-106',
      workspaceId: 'ws-1',
      filename: 'Payroll Summary - Apr 2024.pdf',
      originalName: 'Payroll Summary - Apr 2024.pdf',
      mimeType: 'application/pdf',
      size: 890000,
      sha256: 'f67890123456789abcdef012345ef',
      status: 'Processed',
      category: 'Payroll',
      language: 'EN',
      currency: 'USD',
      entityName: 'GlobalTech Solutions',
      period: 'Apr 2024',
      confidence: 0.97,
      extractedFactsCount: 52,
      reviewStatus: 'approved',
      createdAt: 'May 10, 2024 9:18 AM',
      summary: 'Monthly payroll register summary detailing gross pay, tax withholdings, healthcare benefits, and net payouts.'
    },
    {
      id: 'doc-107',
      workspaceId: 'ws-1',
      filename: 'Revenue Detail Report.xlsx',
      originalName: 'Revenue Detail Report.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 2100000,
      sha256: '7890123456789abcdef0123456f0',
      status: 'Processed',
      category: 'Report',
      language: 'EN',
      currency: 'USD',
      entityName: 'GlobalTech Solutions',
      period: 'Apr 2024',
      confidence: 0.93,
      extractedFactsCount: 110,
      reviewStatus: 'approved',
      createdAt: 'May 9, 2024 2:05 PM',
      summary: 'Disaggregated revenue ledger by customer tier, product line, and geographic region for monthly reconciliation.'
    },
    {
      id: 'doc-108',
      workspaceId: 'ws-1',
      filename: 'Board Meeting Minutes.pdf',
      originalName: 'Board Meeting Minutes.pdf',
      mimeType: 'application/pdf',
      size: 456000,
      sha256: '890123456789abcdef01234567a1',
      status: 'Needs Review',
      category: 'Minutes',
      language: 'EN',
      currency: 'USD',
      entityName: 'GlobalTech Solutions',
      period: 'Apr 2024',
      confidence: 0.68,
      extractedFactsCount: 12,
      reviewStatus: 'proposed',
      createdAt: 'May 8, 2024 5:30 PM',
      summary: 'Official executive board meeting minutes approving dividend distribution and capital expenditure allocations.'
    },
    {
      id: 'doc-109',
      workspaceId: 'ws-1',
      filename: 'Tax Return 2023.pdf',
      originalName: 'Tax Return 2023.pdf',
      mimeType: 'application/pdf',
      size: 4200000,
      sha256: '90123456789abcdef012345678b2',
      status: 'Failed',
      category: 'Tax Document',
      language: 'EN',
      currency: 'USD',
      entityName: 'GlobalTech Solutions',
      period: 'FY2023',
      confidence: 0.00,
      extractedFactsCount: 0,
      reviewStatus: 'rejected',
      createdAt: 'May 8, 2024 10:12 AM',
      summary: 'Corporate tax filing PDF scan. Parsing failed due to password protection or low resolution OCR quality.'
    },
    {
      id: 'doc-110',
      workspaceId: 'ws-1',
      filename: 'Budget vs Actual - Apr 2024.xlsx',
      originalName: 'Budget vs Actual - Apr 2024.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1600000,
      sha256: '0123456789abcdef0123456789c3',
      status: 'Processed',
      category: 'Financial Report',
      language: 'EN',
      currency: 'USD',
      entityName: 'GlobalTech Solutions',
      period: 'Apr 2024',
      confidence: 0.95,
      extractedFactsCount: 84,
      reviewStatus: 'approved',
      createdAt: 'May 7, 2024 1:45 PM',
      summary: 'Monthly budget variance analysis comparing projected operating expenses against actual general ledger posts.'
    }
  ]; */

  const docList = initialDocs;

  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All Companies');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedCategory, setSelectedCategory] = useState('All Types');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedPeriod, setSelectedPeriod] = useState('All Periods');
  const [activeTab, setActiveTab] = useState<'all' | 'folders' | 'recent' | 'starred' | 'shared' | 'trash'>('all');
  const [starredDocIds, setStarredDocIds] = useState<Set<string>>(new Set());
  
  // Selected document for right preview drawer
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(docList[0] || null);

  React.useEffect(() => {
    if (!selectedDoc && docList.length > 0) {
      setSelectedDoc(docList[0]);
    } else if (selectedDoc && !docList.some(d => d.id === selectedDoc.id)) {
      setSelectedDoc(docList[0] || null);
    }
  }, [docList]);

  const [previewTab, setPreviewTab] = useState<'preview' | 'details' | 'facts' | 'activity'>('preview');
  const [previewPage, setPreviewPage] = useState(1);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showSummaryMore, setShowSummaryMore] = useState(false);

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const toggleStar = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setStarredDocIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  // Dynamic filter options derived from real documents and workspaces
  const uniqueCompanies = Array.from(
    new Set([
      ...docList.map(d => d.entityName).filter(Boolean),
      ...workspaces.map(w => w.name).filter(Boolean)
    ])
  );

  const uniqueProjects = Array.from(
    new Set([
      ...docList.map(d => d.period).filter(Boolean),
      ...workspaces.map(w => w.name).filter(Boolean)
    ])
  );

  const uniqueCategories = Array.from(
    new Set(docList.map(d => d.category).filter(Boolean))
  );

  const uniquePeriods = Array.from(
    new Set(docList.map(d => d.period).filter(Boolean))
  );

  // Filtering Logic
  const filteredDocs = docList.filter(doc => {
    // Search term
    const matchesSearch =
      doc.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.period?.toLowerCase().includes(searchTerm.toLowerCase());

    // Company filter
    const matchesCompany =
      selectedCompany === 'All Companies' ||
      doc.entityName?.toLowerCase() === selectedCompany.toLowerCase() ||
      workspaces.some(w => w.name.toLowerCase() === selectedCompany.toLowerCase() && w.id === doc.workspaceId);

    // Category filter
    const matchesCategory =
      selectedCategory === 'All Types' ||
      doc.category?.toLowerCase() === selectedCategory.toLowerCase();

    // Status filter
    const matchesStatus =
      selectedStatus === 'All Statuses' ||
      doc.status?.toLowerCase() === selectedStatus.toLowerCase();

    // Period filter
    const matchesPeriod =
      selectedPeriod === 'All Periods' ||
      doc.period?.toLowerCase() === selectedPeriod.toLowerCase();

    // Navigation Tab filter
    if (activeTab === 'starred' && !starredDocIds.has(doc.id)) return false;
    if (activeTab === 'trash' && doc.status?.toLowerCase() !== 'failed') return false;

    return matchesSearch && matchesCompany && matchesCategory && matchesStatus && matchesPeriod;
  });

  // Calculate metrics for Top 6 Stat Cards dynamically from real documents
  const totalCount = docList.length;

  const processedCount = docList.filter(
    d =>
      d.status?.toLowerCase() === 'processed' ||
      d.status?.toLowerCase() === 'validated' ||
      d.status?.toLowerCase() === 'complete'
  ).length;

  const reviewCount = docList.filter(
    d =>
      d.status?.toLowerCase().includes('review') ||
      d.status?.toLowerCase() === 'proposed'
  ).length;

  const processingCount = docList.filter(
    d =>
      d.status?.toLowerCase() === 'processing' ||
      d.status?.toLowerCase() === 'pending'
  ).length;

  const failedCount = docList.filter(
    d =>
      d.status?.toLowerCase() === 'failed' ||
      d.status?.toLowerCase() === 'rejected' ||
      d.status?.toLowerCase() === 'error'
  ).length;

  const extractedFieldsCount = docList.reduce(
    (sum, d) => sum + (d.extractedFactsCount || 0),
    0
  );

  const processedPct = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;
  const reviewPct = totalCount > 0 ? Math.round((reviewCount / totalCount) * 100) : 0;
  const processingPct = totalCount > 0 ? Math.round((processingCount / totalCount) * 100) : 0;
  const failedPct = totalCount > 0 ? Math.round((failedCount / totalCount) * 100) : 0;

  // Pagination slicing
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getFileIcon = (filename: string, mimeType: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        </div>
      );
    }
    if (ext === 'docx' || ext === 'doc') {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
          <FileText className="w-4 h-4 text-blue-600" />
        </div>
      );
    }
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0">
          <Eye className="w-4 h-4 text-purple-600" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200 text-red-700 flex items-center justify-center font-bold text-[10px] shrink-0">
        <FileText className="w-4 h-4 text-red-600" />
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const st = status.toLowerCase();
    if (st === 'processed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Processed
        </span>
      );
    }
    if (st === 'needs review' || st === 'needs_review') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Needs Review
        </span>
      );
    }
    if (st === 'processing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
          <RefreshCw className="w-3 h-3 text-sky-500 animate-spin" />
          Processing
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
        <XCircle className="w-3 h-3 text-rose-500" />
        Failed
      </span>
    );
  };

  const handleDownloadDoc = (doc: DocumentRecord) => {
    const content = `DOCUMENT RECORD: ${doc.originalName}\nCategory: ${doc.category}\nCompany: ${doc.entityName}\nPeriod: ${doc.period}\nStatus: ${doc.status}\nConfidence: ${(doc.confidence * 100).toFixed(1)}%\nSHA-256: ${doc.sha256}\n\nEXECUTIVE SUMMARY:\n${doc.summary}\n\nCONFIDENTIAL FINANCIAL INTELLIGENCE ENGINE CITATION.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setActionSuccessMsg(`Downloaded "${doc.originalName}" successfully.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleShareCopy = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-5 pb-12 text-slate-800">
      
      {/* Toast Notification Banner */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{actionSuccessMsg}</span>
        </div>
      )}

      {/* ----------------- TOP PAGE HEADER & MAIN ACTIONS ----------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Documents</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            All your documents, organized and AI-analyzed
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Global Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search documents by name, type, content..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 md:w-80 shadow-sm font-medium"
            />
            <span className="absolute right-2.5 top-2 text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              ⌘ K
            </span>
          </div>

          {/* Primary Action Buttons */}
          <button
            onClick={() => {
              if (onOpenUpload) onOpenUpload();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>+ Upload</span>
          </button>

          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-slate-500" />
            <span>+ New Folder</span>
          </button>
        </div>
      </div>

      {/* ----------------- TOP METRIC STAT CARDS ROW (6 CARDS) ----------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Metric 1: Total Documents */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm space-y-2 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200/60">
              {totalCount} total
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Total Documents</span>
            <span className="text-xl font-black text-slate-900 tracking-tight font-mono">
              {totalCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 2: Processed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm space-y-2 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
              ✓ {processedPct}% of total
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Processed</span>
            <span className="text-xl font-black text-slate-900 tracking-tight font-mono">
              {processedCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 3: Needs Review */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm space-y-2 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
              ⚠ {reviewPct}% of total
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Needs Review</span>
            <span className="text-xl font-black text-slate-900 tracking-tight font-mono">
              {reviewCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 4: Processing */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm space-y-2 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-200/60">
              ↻ {processingPct}% of total
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Processing</span>
            <span className="text-xl font-black text-slate-900 tracking-tight font-mono">
              {processingCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 5: Failed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm space-y-2 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/60">
              ✖ {failedPct}% of total
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Failed</span>
            <span className="text-xl font-black text-slate-900 tracking-tight font-mono">
              {failedCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 6: AI Extracted Fields */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm space-y-2 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200/60">
              ⚡ {extractedFieldsCount} fields
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">AI Extracted Fields</span>
            <span className="text-xl font-black text-slate-900 tracking-tight font-mono">
              {extractedFieldsCount.toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* ----------------- FILTER CONTROLS BAR ----------------- */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Company Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Company</span>
            <select
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Companies">All Companies</option>
              {uniqueCompanies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Project Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Project</span>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Projects">All Projects</option>
              {uniqueProjects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Document Type Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Document Type</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Types">All Types</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Status</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Processed">Processed</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Period</span>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Periods">All Periods</option>
              {uniquePeriods.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="px-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>More Filters</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('All Types');
              setSelectedStatus('All Statuses');
              setSelectedPeriod('All Periods');
              setSearchTerm('');
            }}
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>

      </div>

      {/* ----------------- SUB-NAV TABS ROW ----------------- */}
      <div className="border-b border-slate-200 flex items-center space-x-6 text-xs font-bold pt-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2.5 transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>All Documents</span>
        </button>

        <button
          onClick={() => setActiveTab('folders')}
          className={`pb-2.5 transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'folders'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Folders</span>
        </button>

        <button
          onClick={() => setActiveTab('recent')}
          className={`pb-2.5 transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'recent'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Recent</span>
        </button>

        <button
          onClick={() => setActiveTab('starred')}
          className={`pb-2.5 transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'starred'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Starred</span>
          {starredDocIds.size > 0 && (
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[10px] rounded-full">
              {starredDocIds.size}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('shared')}
          className={`pb-2.5 transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'shared'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Shared with Me</span>
        </button>

        <button
          onClick={() => setActiveTab('trash')}
          className={`pb-2.5 transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'trash'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Trash</span>
        </button>
      </div>

      {/* ----------------- MAIN DOCUMENT LIST & SPLIT PREVIEW AREA ----------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        
        {/* Left Table Section */}
        <div className={`${selectedDoc ? 'xl:col-span-7 2xl:col-span-8' : 'xl:col-span-12'} transition-all`}>
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3.5 pl-4 w-10"></th>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Company</th>
                    <th className="p-3.5">Project</th>
                    <th className="p-3.5">Period</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">AI Confidence</th>
                    <th className="p-3.5">Uploaded</th>
                    <th className="p-3.5 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedDocs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-slate-400">
                        No documents found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedDocs.map(doc => {
                      const isSelected = selectedDoc?.id === doc.id;
                      const isStarred = starredDocIds.has(doc.id);
                      const isFailedOrProcessing = doc.status === 'Processing' || doc.status === 'Failed';

                      return (
                        <tr
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className={`group cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50/80 hover:bg-blue-100/60 font-medium'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Star Column */}
                          <td className="p-3.5 pl-4">
                            <button
                              onClick={(e) => toggleStar(e, doc.id)}
                              className="text-slate-300 hover:text-amber-400 transition"
                            >
                              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                          </td>

                          {/* File Icon & Name */}
                          <td className="p-3.5">
                            <div className="flex items-center space-x-3">
                              {getFileIcon(doc.originalName, doc.mimeType)}
                              <div>
                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition block line-clamp-1">
                                  {doc.originalName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {(doc.size / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category Type */}
                          <td className="p-3.5 text-slate-700 font-semibold">
                            {doc.category}
                          </td>

                          {/* Company */}
                          <td className="p-3.5 text-slate-600 font-medium whitespace-nowrap">
                            {doc.entityName}
                          </td>

                          {/* Project */}
                          <td className="p-3.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                            {workspaces.find(w => w.id === doc.workspaceId)?.name || doc.period || 'General'}
                          </td>

                          {/* Period */}
                          <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                            {doc.period}
                          </td>

                          {/* Status */}
                          <td className="p-3.5 whitespace-nowrap">
                            {getStatusBadge(doc.status)}
                          </td>

                          {/* AI Confidence */}
                          <td className="p-3.5">
                            {isFailedOrProcessing ? (
                              <span className="text-slate-400 font-mono text-[11px]">—</span>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-800 font-mono text-[11px] w-8">
                                  {(doc.confidence * 100).toFixed(0)}%
                                </span>
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                  <div
                                    className={`h-full rounded-full ${
                                      doc.confidence >= 0.9
                                        ? 'bg-emerald-500'
                                        : doc.confidence >= 0.7
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${doc.confidence * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Uploaded */}
                          <td className="p-3.5 text-slate-500 text-[11px] whitespace-nowrap font-mono">
                            {doc.createdAt}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right pr-4">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                title="Download"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadDoc(doc);
                                }}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Actions"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDoc(doc);
                                }}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-800">1</span> to{' '}
                <span className="font-bold text-slate-800">{paginatedDocs.length}</span> of{' '}
                <span className="font-bold text-slate-800">{totalCount.toLocaleString()}</span> documents
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <button className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center">
                    2
                  </button>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center">
                    3
                  </button>
                  <span className="text-slate-400 font-mono">...</span>
                  <button className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center">
                    125
                  </button>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <select
                  value={itemsPerPage}
                  onChange={e => setItemsPerPage(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-bold focus:outline-none"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* ----------------- RIGHT SIDE INTERACTIVE PREVIEW PANEL ----------------- */}
        {selectedDoc && (
          <div className="xl:col-span-5 2xl:col-span-4 bg-white border border-slate-200/90 rounded-2xl shadow-md p-4 space-y-4 sticky top-6">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5 truncate pr-2">
                {getFileIcon(selectedDoc.originalName, selectedDoc.mimeType)}
                <div className="truncate">
                  <h3 className="font-extrabold text-sm text-slate-900 truncate">
                    {selectedDoc.originalName}
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={(e) => toggleStar(e, selectedDoc.id)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-500 transition"
                >
                  <Star className={`w-4 h-4 ${starredDocIds.has(selectedDoc.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition"
                  title="Expand preview"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel Tabs */}
            <div className="flex items-center space-x-4 border-b border-slate-100 text-xs font-bold">
              <button
                onClick={() => setPreviewTab('preview')}
                className={`pb-2 transition cursor-pointer ${
                  previewTab === 'preview'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setPreviewTab('details')}
                className={`pb-2 transition cursor-pointer ${
                  previewTab === 'details'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setPreviewTab('facts')}
                className={`pb-2 transition cursor-pointer ${
                  previewTab === 'facts'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                AI Extracted Data
              </button>
              <button
                onClick={() => setPreviewTab('activity')}
                className={`pb-2 transition cursor-pointer ${
                  previewTab === 'activity'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Activity
              </button>
            </div>

            {/* Tab 1: PREVIEW TAB */}
            {previewTab === 'preview' && (
              <div className="space-y-4">
                
                {/* Embedded Document Viewer Box */}
                <div className="bg-slate-100/90 border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-inner min-h-[360px] relative overflow-hidden">
                  
                  {/* Rendered Document Sheet Preview */}
                  <div className="bg-white rounded-lg shadow-md border border-slate-200/80 p-5 space-y-4 text-slate-800 transform transition-transform duration-200 origin-top"
                       style={{ transform: `scale(${previewZoom / 100})` }}>
                    <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">
                          GTS
                        </div>
                        <span className="font-extrabold text-xs text-slate-900 tracking-tight">
                          {selectedDoc.entityName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {selectedDoc.period}
                      </span>
                    </div>

                    <div className="py-4 text-center space-y-2">
                      <span className="text-[10px] uppercase tracking-widest text-blue-600 font-extrabold block">
                        CONFIDENTIAL AUDIT EVIDENCE
                      </span>
                      <h2 className="text-base font-black text-slate-900 leading-snug">
                        {selectedDoc.originalName}
                      </h2>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        Building the future with innovative technology solutions
                      </p>
                    </div>

                    {/* Financial Table Mock inside preview */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10px] space-y-1.5 font-mono">
                      <div className="flex justify-between font-bold text-slate-700 border-b border-slate-200 pb-1">
                        <span>Financial Metric</span>
                        <span>Amount (USD)</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Total Revenue / Sales</span>
                        <span>$89,490,000</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Operating Income</span>
                        <span>$14,230,000</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Net Income (GAAP)</span>
                        <span>$11,850,000</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Page Controls Bar at bottom of viewer */}
                  <div className="mt-3 bg-white/95 backdrop-blur border border-slate-200/80 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs text-slate-600 shadow-sm">
                    <div className="flex items-center space-x-1">
                      <button
                        disabled={previewPage <= 1}
                        onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                        className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-[11px] font-bold">
                        {previewPage} / 132
                      </span>
                      <button
                        onClick={() => setPreviewPage(p => p + 1)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPreviewZoom(z => Math.max(70, z - 10))}
                        className="p-1 hover:bg-slate-100 rounded"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-[10px]">{previewZoom}%</span>
                      <button
                        onClick={() => setPreviewZoom(z => Math.min(130, z + 10))}
                        className="p-1 hover:bg-slate-100 rounded"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>

                {/* Document Information Grid */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-slate-900">Document Information</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Type</span>
                      <span className="font-semibold text-slate-800">{selectedDoc.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Company</span>
                      <span className="font-semibold text-slate-800">{selectedDoc.entityName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Project</span>
                      <span className="font-semibold text-slate-800">FY2024 Audit</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Period</span>
                      <span className="font-semibold text-slate-800">{selectedDoc.period}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Uploaded By</span>
                      <span className="font-semibold text-slate-800">Sarah Johnson</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Uploaded On</span>
                      <span className="font-semibold text-slate-800 font-mono text-[11px]">{selectedDoc.createdAt}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">File Size</span>
                      <span className="font-semibold text-slate-800 font-mono">{(selectedDoc.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Pages</span>
                      <span className="font-semibold text-slate-800 font-mono">132</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">AI Confidence</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 font-mono">
                        {(selectedDoc.confidence * 100).toFixed(0)}%
                      </span>
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${selectedDoc.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Status</span>
                    {getStatusBadge(selectedDoc.status)}
                  </div>
                </div>

                {/* AI Summary Block */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900">AI Summary</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    {selectedDoc.summary}
                  </p>
                  <button
                    onClick={() => setShowSummaryMore(!showSummaryMore)}
                    className="text-xs font-bold text-blue-600 hover:underline pt-0.5 cursor-pointer block"
                  >
                    {showSummaryMore ? 'Show Less' : 'Show More'}
                  </button>
                </div>

                {/* Bottom Action Footer */}
                <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleDownloadDoc(selectedDoc)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-slate-500" />
                    <span>Share</span>
                  </button>

                  <button
                    onClick={() => setIsMaximized(true)}
                    className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* Tab 2: DETAILS TAB */}
            {previewTab === 'details' && (
              <div className="space-y-3 text-xs pt-1">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-slate-500">
                    <span>Cryptographic Hash (SHA-256)</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-800 bg-white p-2 rounded border border-slate-200 break-all">
                    {selectedDoc.sha256}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">OCR Layout Engine</span>
                    <span className="font-semibold text-slate-800">Docling v2.4 + Hermes Vision</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Language Detection</span>
                    <span className="font-semibold text-slate-800">{selectedDoc.language} (English 99.8%)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Primary Currency</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedDoc.currency}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Source Lineage Facts</span>
                    <span className="font-semibold text-blue-600 font-mono">{selectedDoc.extractedFactsCount} facts</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Encryption Status</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> AES-256 Encrypted
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: AI EXTRACTED DATA TAB */}
            {previewTab === 'facts' && (
              <div className="space-y-3 text-xs pt-1 max-h-[380px] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Extracted Line Items ({selectedDoc.extractedFactsCount})</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">
                    100% Traceable
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Consolidated Gross Revenue', value: '$89,490,000', page: 'Page 72', status: 'Validated' },
                    { label: 'Cost of Revenue & Services', value: '$41,200,000', page: 'Page 73', status: 'Validated' },
                    { label: 'Gross Profit Margin', value: '53.96%', page: 'Page 73', status: 'Validated' },
                    { label: 'Operating Income (EBIT)', value: '$14,230,000', page: 'Page 74', status: 'Validated' },
                    { label: 'Net Income Attributable to Equity', value: '$11,850,000', page: 'Page 75', status: 'Validated' },
                    { label: 'Total Assets', value: '$142,800,000', page: 'Page 78', status: 'Validated' },
                    { label: 'Cash and Cash Equivalents', value: '$28,400,000', page: 'Page 80', status: 'Validated' }
                  ].map((fact, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 block">{fact.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{fact.page}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">{fact.value}</span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded">
                          {fact.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: ACTIVITY TAB */}
            {previewTab === 'activity' && (
              <div className="space-y-3 text-xs pt-1">
                <h4 className="font-bold text-slate-900">Document Processing Trail</h4>
                <div className="border-l-2 border-slate-200 pl-3 space-y-3 font-mono text-[11px]">
                  <div className="relative">
                    <span className="text-slate-400 text-[10px] block">May 12, 2024 2:34 PM</span>
                    <span className="font-bold text-slate-800">Uploaded by Sarah Johnson</span>
                  </div>
                  <div className="relative">
                    <span className="text-slate-400 text-[10px] block">May 12, 2024 2:35 PM</span>
                    <span className="font-bold text-blue-600">File Security Scan & SHA-256 Verified</span>
                  </div>
                  <div className="relative">
                    <span className="text-slate-400 text-[10px] block">May 12, 2024 2:36 PM</span>
                    <span className="font-bold text-purple-600">Docling OCR Layout Extraction Complete</span>
                  </div>
                  <div className="relative">
                    <span className="text-slate-400 text-[10px] block">May 12, 2024 2:37 PM</span>
                    <span className="font-bold text-emerald-600">Hermes Audit Consensus Reconciled (98%)</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* ----------------- FULLSCREEN MAXIMIZED DOCUMENT PREVIEW MODAL ----------------- */}
      {isMaximized && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(selectedDoc.originalName, selectedDoc.mimeType)}
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{selectedDoc.originalName}</h3>
                  <p className="text-xs text-slate-500">{selectedDoc.entityName} • {selectedDoc.category} • {selectedDoc.period}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadDoc(selectedDoc)}
                  className="px-3.5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
                <button
                  onClick={() => setIsMaximized(false)}
                  className="p-2 hover:bg-slate-200 rounded-xl text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 bg-slate-100 overflow-y-auto flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8 max-w-2xl w-full space-y-6">
                <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedDoc.entityName}</h2>
                    <p className="text-xs text-slate-500">Official Financial Statement Document Evidence</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded">
                    {selectedDoc.period}
                  </span>
                </div>

                <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                  <p className="font-semibold text-slate-900">{selectedDoc.summary}</p>
                  <p>
                    This document was ingested into the CPA pipeline with cryptographic SHA-256 validation ({selectedDoc.sha256.substring(0, 16)}...). All financial line items have been extracted and cross-validated by Hermes Audit Consensus Agent.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 block">Extracted Summary Table</span>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div>Gross Sales: $89,490,000</div>
                    <div>Net Profit: $11,850,000</div>
                    <div>Total Assets: $142,800,000</div>
                    <div>Liabilities: $58,200,000</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ----------------- CREATE NEW FOLDER MODAL ----------------- */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Create New Folder</h3>
              </div>
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block font-bold text-slate-700">Folder Name</label>
              <input
                type="text"
                placeholder="e.g. FY2024 Audit Evidence Vault"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newFolderName.trim()) {
                    setActionSuccessMsg(`Created folder "${newFolderName}"`);
                    setTimeout(() => setActionSuccessMsg(null), 3000);
                  }
                  setIsFolderModalOpen(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SHARE DOCUMENT MODAL ----------------- */}
      {isShareModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Share Document</h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Document</span>
                <span className="font-bold text-slate-800">{selectedDoc.originalName}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Send to Email</label>
                <input
                  type="email"
                  placeholder="e.g. auditor@cpa-firm.com"
                  value={shareEmail}
                  onChange={e => setShareEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <label className="block font-bold text-slate-700 mb-1">Or Copy Link</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://app.evesbookkeeping.com/docs/${selectedDoc.id}`}
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600"
                  />
                  <button
                    onClick={handleShareCopy}
                    className="px-3 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900 flex items-center space-x-1"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Done
              </button>
              <button
                onClick={() => {
                  if (shareEmail) {
                    setActionSuccessMsg(`Shared document with ${shareEmail}`);
                    setTimeout(() => setActionSuccessMsg(null), 3000);
                  }
                  setIsShareModalOpen(false);
                  setShareEmail('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
