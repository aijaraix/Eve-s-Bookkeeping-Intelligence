/**
 * EVE AUTONOMOUS CPA ORGANIZATION — REPORT DATA CONTRACT (Phase H.9.21)
 * 
 * Formal, canonical presentation and artifact contract for all Eve deliverables:
 * PDF, Excel (XLSX), CSV (Lead Schedules / Working Papers), and JSON.
 * 
 * Strict Enforcement:
 * - Every monetary number must trace to a canonicalFactId or derivedCalculationId.
 * - Zero fabricated or hallucinated values.
 * - Presentation currency requires explicit FX lineage.
 */

import { AccountingGateState, SentinelReadinessState } from './presentationModels.js';

export type DeliverableType =
  | 'EXECUTIVE_FINANCIAL_SUMMARY'
  | 'FINANCIAL_STATEMENT_PACKAGE'
  | 'BOARD_REPORT'
  | 'MANAGEMENT_REPORT'
  | 'MANAGEMENT_LETTER'
  | 'LEAD_SCHEDULE'
  | 'TRIAL_BALANCE_TIE_OUT'
  | 'WORKING_PAPER_BINDER'
  | 'LENDER_PACKAGE'
  | 'INVESTOR_PACKAGE'
  | 'AUDIT_REVIEW_MEMORANDUM'
  | 'FINDINGS_REPORT'
  | 'CORPORATE_STRUCTURE_APPENDIX'
  | 'MULTI_CURRENCY_CONSOLIDATION_APPENDIX'
  | 'VARIANCE_REPORT'
  | 'CUSTOM_REPORT';

export type ReportAudience =
  | 'MANAGEMENT'
  | 'BOARD_OF_DIRECTORS'
  | 'INVESTOR'
  | 'BANK_LENDER'
  | 'AUDITOR'
  | 'INTERNAL_ACCOUNTING_TEAM'
  | 'CPA_REVIEWER'
  | 'REGULATOR'
  | 'CLIENT'
  | 'PARTNER'
  | 'CUSTOM_AUDIENCE';

export type ReportTone =
  | 'EXECUTIVE'
  | 'CPA_TECHNICAL'
  | 'BOARD_READY'
  | 'INVESTOR_FRIENDLY'
  | 'LENDER_FOCUSED'
  | 'MANAGEMENT_OPERATIONS'
  | 'INTERNAL_WORKING_PAPER'
  | 'REGULATORY_FORMAL'
  | 'PLAIN_ENGLISH_CLIENT';

export type ReportDepth = 'CONCISE' | 'STANDARD' | 'DETAILED' | 'COMPREHENSIVE' | 'CUSTOM';

export type BrandingMode = 'CPA_FIRM_BRANDED' | 'CLIENT_BRANDED' | 'CO_BRANDED' | 'NEUTRAL_PROFESSIONAL';

export type ReportTemplateLayout =
  | 'CLASSIC_CPA'
  | 'INSTITUTIONAL'
  | 'BOARD_EXECUTIVE'
  | 'FINANCIAL_ANALYTICAL'
  | 'LENDER_PACKAGE'
  | 'WORKING_PAPER'
  | 'ANNUAL_REPORT_STYLE'
  | 'MINIMAL_PROFESSIONAL'
  | 'CUSTOM';

export interface ReportBrandingProfile {
  firmName: string;
  partnerName: string;
  licenseNumber: string;
  firmAddress: string;
  firmLogoUrl?: string;
  clientLogoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  approvedFonts: string[];
  opinionType: string;
  footerDisclaimer?: string;
  confidentialityNotice?: string;
}

export interface ReportScopeConfig {
  entityScope: 'PARENT_ONLY' | 'SINGLE_ENTITY' | 'SUBSIDIARY' | 'CONSOLIDATED_GROUP' | 'SELECTED_ENTITIES';
  selectedEntityIds: string[];
  periodType: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'CUSTOM';
  selectedPeriods: string[];
  comparativePeriods: string[];
  reportingCurrency: string;
  presentationCurrency: string;
  fxConversionLineage?: {
    rate: number;
    authority: string;
    date: string;
    formula: string;
  };
}

export interface ReportMetricItem {
  id: string;
  label: string;
  canonicalMetric?: string;
  value: number;
  formattedValue: string;
  currency: string;
  period: string;
  canonicalFactId: string;
  documentTitle: string;
  pageNumber?: number;
  sourceQuote: string;
  verificationStatus: 'verified' | 'calculated' | 'reconciled' | 'review_required' | 'NOT_VERIFIED' | 'MISSING_EVIDENCE';
  scale: string;
}

export interface ReportStatementRow {
  id: string;
  label: string;
  canonicalMetric?: string;
  level: number;
  isHeader?: boolean;
  isTotal?: boolean;
  valuesByPeriod: Record<string, number | null>;
  formattedByPeriod: Record<string, string>;
  canonicalFactIds: Record<string, string>;
}

export interface ReportStatementTable {
  statementName: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'EQUITY' | 'LEAD_SCHEDULE';
  periods: string[];
  currency: string;
  scale: string;
  rows: ReportStatementRow[];
}

export interface ReportFindingItem {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  financialImpact?: string;
  recommendation: string;
  status: 'OPEN' | 'RESOLVED' | 'ACCEPTED_RISK';
}

export interface ReportSectionPayload {
  id: string;
  title: string;
  order: number;
  type: 'NARRATIVE' | 'FINANCIAL_TABLE' | 'RATIO_GRID' | 'FINDINGS_LIST' | 'EVIDENCE_INDEX' | 'SIGN_OFF';
  content?: string;
  table?: ReportStatementTable;
  metrics?: ReportMetricItem[];
  findings?: ReportFindingItem[];
  notes?: string[];
}

export interface ReportDataContract {
  reportId: string;
  workspaceId: string;
  clientName: string;
  version: string;
  generatedAt: string;
  generatedBy: string;
  signedOffBy: string;
  
  deliverableType: DeliverableType;
  deliverableTitle: string;
  audience: ReportAudience;
  purposeTone: ReportTone;
  depth: ReportDepth;
  
  scope: ReportScopeConfig;
  branding: ReportBrandingProfile;
  brandingMode: BrandingMode;
  templateLayout: ReportTemplateLayout;
  
  readinessState: SentinelReadinessState;
  accountingGateState: AccountingGateState;
  euclidVariance: number;
  
  canonicalFactSnapshotHash: string;
  sourceDocumentVersions: Array<{
    documentId: string;
    title: string;
    version: string;
    sha256: string;
  }>;
  
  sections: ReportSectionPayload[];
  provenanceLineageCount: number;
  isStale: boolean;
  supersededBy?: string;
  status?: string;
  dependentFactIds?: string[];
  dependentDerivationIds?: string[];
  invalidatedFactIds?: string[];
}
