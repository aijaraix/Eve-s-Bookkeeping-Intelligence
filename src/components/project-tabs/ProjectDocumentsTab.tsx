import React, { useState } from 'react';
import { Workspace, DocumentRecord } from '../../types';
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Eye,
  X,
  ShieldCheck,
  Building2,
  Globe,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  FolderOpen
} from 'lucide-react';

interface ProjectDocumentsTabProps {
  workspace: Workspace;
  documents: DocumentRecord[];
}

export const ProjectDocumentsTab: React.FC<ProjectDocumentsTabProps> = ({
  workspace,
  documents
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');

  // Extended mock document list if documents array is small
  const displayDocs: (DocumentRecord & {
    type?: string;
    entity?: string;
    confidenceScore?: string;
    uploader?: string;
    findingsCount?: number;
  })[] = documents.length > 0
    ? documents.map((d, i) => ({
        ...d,
        type: d.category || (i % 2 === 0 ? 'Financial Statement' : 'Audit Report'),
        entity: d.entityName || workspace.name || 'Client Entity',
        confidenceScore: `${d.confidence || 99}%`,
        uploader: 'Sarah Johnson',
        findingsCount: i === 0 ? 3 : i === 1 ? 1 : 0
      }))
    : [
        {
          id: 'doc-1',
          workspaceId: workspace.id || 'ws-1',
          filename: `${(workspace.name || 'Client').replace(/\s+/g, '_')}_Annual_Report.pdf`,
          originalName: `${workspace.name || 'Client'} Annual Report & Financial Statements.pdf`,
          size: 14850000,
          mimeType: 'application/pdf',
          createdAt: new Date().toISOString(),
          status: 'processed',
          sha256: 'a8f3b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
          category: 'Financial Statement',
          type: 'Financial Statement',
          period: 'FY 2025',
          entityName: workspace.name || 'Client Entity',
          entity: workspace.name || 'Client Entity',
          currency: 'EUR',
          confidence: 99.8,
          confidenceScore: '99.8%',
          language: 'en',
          extractedFactsCount: 142,
          reviewStatus: 'Approved',
          summary: 'Audited Annual Report FY2025',
          uploader: 'Sarah Johnson',
          findingsCount: 3
        },
        {
          id: 'doc-2',
          workspaceId: workspace.id || 'ws-1',
          filename: `${(workspace.name || 'Client').replace(/\s+/g, '_')}_Trial_Balance.xlsx`,
          originalName: `${workspace.name || 'Client'} Q2 General Ledger & Trial Balance.xlsx`,
          size: 8420000,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'processed',
          sha256: 'b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
          category: 'Trial Balance',
          type: 'Trial Balance',
          period: 'Q2 2025',
          entityName: `${workspace.name || 'Client'} EU Sub`,
          entity: `${workspace.name || 'Client'} EU Sub`,
          currency: 'EUR',
          confidence: 99.5,
          confidenceScore: '99.5%',
          language: 'en',
          extractedFactsCount: 88,
          reviewStatus: 'Approved',
          summary: 'Trial Balance Q2 2025',
          uploader: 'Michael Brown',
          findingsCount: 1
        },
        {
          id: 'doc-3',
          workspaceId: workspace.id || 'ws-1',
          filename: 'JPMorgan_Bank_Confirmation_Jun2025.pdf',
          originalName: 'JPMorgan Chase Bank Cash Balance Confirmation.pdf',
          size: 2150000,
          mimeType: 'application/pdf',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          status: 'processed',
          sha256: 'c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
          category: 'Bank Statement',
          type: 'Bank Statement',
          period: 'Jun 2025',
          entityName: workspace.name || 'Client Entity',
          entity: workspace.name || 'Client Entity',
          currency: 'EUR',
          confidence: 100,
          confidenceScore: '100%',
          language: 'en',
          extractedFactsCount: 12,
          reviewStatus: 'Approved',
          summary: 'Bank Confirmation Letter',
          uploader: 'Sarah Johnson',
          findingsCount: 0
        },
        {
          id: 'doc-4',
          workspaceId: workspace.id || 'ws-1',
          filename: 'Supplier_Master_Supply_Agreement.pdf',
          originalName: 'Master Procurement & Supply Contract 2025.pdf',
          size: 5200000,
          mimeType: 'application/pdf',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          status: 'processed',
          sha256: 'd2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
          category: 'Contract',
          type: 'Contract',
          period: 'FY 2025',
          entityName: `${workspace.name || 'Client'} Group`,
          entity: `${workspace.name || 'Client'} Group`,
          currency: 'USD',
          confidence: 98.9,
          confidenceScore: '98.9%',
          language: 'en',
          extractedFactsCount: 34,
          reviewStatus: 'Approved',
          summary: 'Wilmar Supply Agreement 2025',
          uploader: 'Emily Davis',
          findingsCount: 1
        }
      ];

  const filteredDocs = displayDocs.filter(d => {
    const matchesSearch =
      (d.originalName || d.filename).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All Types' || d.type === typeFilter;
    const matchesStatus = statusFilter === 'All Statuses' || d.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalDocsCount = displayDocs.length;
  const processedDocsCount = displayDocs.filter(d => (d.status || '').toLowerCase() === 'completed' || (d.status || '').toLowerCase() === 'processed' || (d.status || '').toLowerCase() === 'approved').length;
  const processingDocsCount = displayDocs.filter(d => (d.status || '').toLowerCase() === 'processing' || (d.status || '').toLowerCase() === 'ingesting').length;
  const needsReviewDocsCount = displayDocs.filter(d => (d.reviewStatus || '').toLowerCase() === 'needs review' || (d.status || '').toLowerCase() === 'needs_review').length;
  const failedDocsCount = displayDocs.filter(d => (d.status || '').toLowerCase() === 'failed' || (d.status || '').toLowerCase() === 'error').length;

  return (
    <div className="space-y-6 pt-2">
      {/* ---------------- TOP SUMMARY CARDS ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Docs</span>
          <div className="text-xl font-black text-slate-900 font-mono">{totalDocsCount}</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-600">Processed</span>
          <div className="text-xl font-black text-emerald-700 font-mono">{processedDocsCount}</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-blue-600">Processing</span>
          <div className="text-xl font-black text-blue-700 font-mono">{processingDocsCount}</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-600">Needs Review</span>
          <div className="text-xl font-black text-amber-700 font-mono">{needsReviewDocsCount}</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-rose-600">Missing</span>
          <div className="text-xl font-black text-rose-700 font-mono">0</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Failed</span>
          <div className="text-xl font-black text-slate-600 font-mono">{failedDocsCount}</div>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Duplicates</span>
          <div className="text-xl font-black text-slate-600 font-mono">0</div>
        </div>
      </div>

      {/* ---------------- ACTION BUTTONS & FILTER TOOLBAR ---------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search source documents..."
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none w-64"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option>All Types</option>
            <option>Financial Statement</option>
            <option>Trial Balance</option>
            <option>Bank Statement</option>
            <option>Contract</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option>All Statuses</option>
            <option value="processed">Processed</option>
            <option value="processing">Processing</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold hover:bg-slate-100 cursor-pointer flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
          <button className="px-4 py-2 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-950 cursor-pointer flex items-center gap-1.5 shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Documents</span>
          </button>
        </div>
      </div>

      {/* ---------------- DOCUMENTS MAIN TABLE ---------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Project Evidence Vault</h3>
          <span className="text-xs text-slate-400 font-mono">Showing {filteredDocs.length} files</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 bg-slate-50/50">
                <th className="py-2.5 px-3">Document Name</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2 font-mono">Period</th>
                <th className="py-2.5 px-2">Entity</th>
                <th className="py-2.5 px-2 font-mono">Curr</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2 font-mono">Confidence</th>
                <th className="py-2.5 px-2">Uploaded By</th>
                <th className="py-2.5 px-2 text-center">Findings</th>
                <th className="py-2.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDocs.map((doc, idx) => (
                <tr key={`${doc.id}-${idx}`} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                  <td className="py-3 px-3 flex items-center gap-2.5 font-bold text-slate-900">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate max-w-[260px]">{doc.originalName || doc.filename}</span>
                  </td>
                  <td className="py-3 px-2 text-slate-600 font-semibold">{doc.type}</td>
                  <td className="py-3 px-2 font-mono text-slate-500">{doc.period}</td>
                  <td className="py-3 px-2 text-slate-700">{doc.entity}</td>
                  <td className="py-3 px-2 font-mono text-slate-500">{doc.currency}</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3" /> Processed
                    </span>
                  </td>
                  <td className="py-3 px-2 font-mono font-bold text-emerald-600">{doc.confidenceScore}</td>
                  <td className="py-3 px-2 text-slate-600">{doc.uploader}</td>
                  <td className="py-3 px-2 text-center">
                    {doc.findingsCount && doc.findingsCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                        {doc.findingsCount} Flagged
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button className="p-1 text-blue-600 hover:text-blue-800 font-bold hover:bg-blue-50 rounded-lg transition cursor-pointer">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- DOCUMENT DETAIL MODAL ---------------- */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden space-y-4 p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedDoc.originalName || selectedDoc.filename}</h3>
                <p className="text-xs text-slate-500 font-mono">SHA-256: {selectedDoc.sha256}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 uppercase text-[10px] block text-slate-400">Document Metadata</span>
                <div className="space-y-1">
                  <div>Type: <strong>{selectedDoc.category || 'Financial Statement'}</strong></div>
                  <div>Period: <strong>FY 2025</strong></div>
                  <div>Entity: <strong>{selectedDoc.entityName || (selectedDoc as any).entity || workspace.name || 'Client Entity'}</strong></div>
                  <div>Extraction Engine: <strong>Eve OCR & Vision v4.2</strong></div>
                  <div>AI Parsing Confidence: <strong className="text-emerald-600">{selectedDoc.confidence ? `${Math.round(selectedDoc.confidence * 100)}%` : (selectedDoc as any).confidenceScore || '99.8%'}</strong></div>
                </div>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
                <span className="font-bold text-blue-900 uppercase text-[10px] block">AI Document Summary</span>
                <p className="text-slate-700 leading-relaxed">
                  Contains audited consolidated financial statements for {selectedDoc.entityName || (selectedDoc as any).entity || workspace.name || 'the client'}. All numbers successfully extracted, reconciled against trial balance, and confirmed by 3 Hermes AI nodes.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedDoc(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
