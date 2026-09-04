export type ViewMode =
  | 'overview'
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'equity'
  | 'notes_disclosures'
  | 'segment_analysis'
  | 'ratios'
  | 'hermes_swarm'
  | 'audit_findings'
  | 'evidence_registry'
  | 'corporate_structure'
  | 'documents'
  | 'deliverables'
  | 'diagnostics';

export interface CompanyEntity {
  id: string;
  name: string;
  ticker?: string;
  reportingStandard: 'IFRS' | 'US-GAAP';
  currency: string;
  scale: 'units' | 'thousands' | 'millions' | 'billions';
  fiscalYear: string;
  auditStatus: 'Clean Opinion' | 'Under Review' | 'Findings Detected';
  verificationScore: number;
}

export interface StatementLineItem {
  id: string;
  label: string;
  level: number;
  isHeader?: boolean;
  isTotal?: boolean;
  values: Record<string, number | null>; // year -> value
  noteRef?: string;
  confidence: number;
  sourceDoc?: string;
  page?: number;
  status: 'verified' | 'flagged' | 'reconciled';
}

export interface SwarmAgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed' | 'flagged';
  confidence: number;
  checksCount: number;
  discrepanciesFound: number;
  lastExecution: string;
  avatar: string;
}

export interface AuditFinding {
  id: string;
  title: string;
  severity: 'critical' | 'material' | 'advisory' | 'resolved';
  category: 'Arithmetic' | 'Currency/Scale' | 'Presentation' | 'Footnote Mismatch' | 'Disclosure Gap';
  statement: string;
  affectedPeriods: string[];
  discrepancyAmount?: number;
  impactDescription: string;
  suggestedAction: string;
  evidenceSource: string;
  page: number;
  resolved: boolean;
}

export interface EvidenceRecord {
  id: string;
  factKey: string;
  value: number | string;
  period: string;
  documentName: string;
  pageNumber: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  extractedText: string;
  authorityScore: number;
  verificationAgent: string;
  timestamp: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: { source: string; page: number; fact: string }[];
}
