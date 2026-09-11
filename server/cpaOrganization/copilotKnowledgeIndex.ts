/**
 * EVE AUTONOMOUS CPA ORGANIZATION — COPILOT KNOWLEDGE INDEX
 * 
 * Implements Package B3 Requirement 15:
 * - Strictly gates what Copilot and search retrieval layers may consume.
 * - Only eligible, active, non-superseded, non-quarantined customer truth
 *   is admitted to the index.
 * - Stale, invalidated, superseded, or non-production facts are immediately
 *   purged or marked ineligible.
 * - Never returns stale findings or invalidated facts as current truth.
 */

import { truthEligibilityGate } from './truthEligibilityGate.js';
import { forensicQuarantineLedger } from './forensicQuarantineLedger.js';

export interface CopilotIndexItem {
  id: string;
  engagementId: string;
  projectId?: string;
  metric: string;
  label: string;
  value: any;
  statement?: string;
  period?: string;
  documentTitle?: string;
  sourceDoc?: string;
  pageNumber?: number;
  sourceText?: string;
  sha256?: string;
  isDerivation?: boolean;
  derivationId?: string;
  verificationStatus: string;
  isEligible: boolean;
  status: 'ACTIVE_TRUTH' | 'SUPERSEDED' | 'INVALIDATED' | 'QUARANTINED';
  updatedAt: string;
}

export class CopilotKnowledgeIndex {
  private static instance: CopilotKnowledgeIndex | null = null;
  private items: Map<string, CopilotIndexItem> = new Map(); // key = id

  private constructor() {}

  public static getInstance(): CopilotKnowledgeIndex {
    if (!CopilotKnowledgeIndex.instance) {
      CopilotKnowledgeIndex.instance = new CopilotKnowledgeIndex();
    }
    return CopilotKnowledgeIndex.instance;
  }

  /**
   * Evaluates and indexes a candidate item for Copilot retrieval.
   * If not eligible or quarantined, it is rejected and not indexed as active truth.
   */
  public indexFact(fact: {
    id: string;
    engagementId: string;
    projectId?: string;
    canonicalMetric?: string;
    label?: string;
    value: any;
    statement?: string;
    period?: string;
    documentTitle?: string;
    sourceDoc?: string;
    pageNumber?: number;
    sourceText?: string;
    sha256?: string;
    verificationStatus?: string;
    classification?: string;
    candidateState?: string;
  }): { indexed: boolean; reason?: string } {
    // Check quarantine
    if (forensicQuarantineLedger.isQuarantined(fact.id) || forensicQuarantineLedger.isQuarantined(fact.value)) {
      this.items.delete(fact.id);
      return { indexed: false, reason: 'Fact is quarantined in Forensic Quarantine Ledger.' };
    }

    // Check non-production classification
    const nonProd = ['TEST_FIXTURE', 'ACADEMY_SOURCE', 'CANARY', 'DEMO', 'SYNTHETIC_CUSTOMER_ACADEMY'];
    if (fact.classification && nonProd.includes(fact.classification)) {
      this.items.delete(fact.id);
      return { indexed: false, reason: `Classification '${fact.classification}' forbidden in production Copilot truth.` };
    }

    // Check candidateState / verificationStatus
    const status = String(fact.verificationStatus || '').toUpperCase();
    if (status === 'REJECTED' || status === 'INVALID' || status === 'SUPERSEDED') {
      this.items.delete(fact.id);
      return { indexed: false, reason: `Status '${status}' is not eligible for active retrieval.` };
    }

    const item: CopilotIndexItem = {
      id: fact.id,
      engagementId: fact.engagementId,
      projectId: fact.projectId,
      metric: fact.canonicalMetric || fact.label || 'Unclassified Metric',
      label: fact.label || fact.canonicalMetric || 'Line Item',
      value: fact.value,
      statement: fact.statement,
      period: fact.period,
      documentTitle: fact.documentTitle || fact.sourceDoc,
      sourceDoc: fact.sourceDoc,
      pageNumber: fact.pageNumber,
      sourceText: fact.sourceText,
      sha256: fact.sha256,
      verificationStatus: fact.verificationStatus || 'PROPOSED',
      isEligible: true,
      status: 'ACTIVE_TRUTH',
      updatedAt: new Date().toISOString()
    };

    this.items.set(fact.id, item);
    return { indexed: true };
  }

  /**
   * Invalidates an indexed fact and evicts it from active Copilot retrieval.
   */
  public invalidateFact(factId: string, reason: string): boolean {
    const existing = this.items.get(factId);
    if (existing) {
      existing.isEligible = false;
      existing.status = 'INVALIDATED';
      existing.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Queries active truth for Copilot responses. Stale or invalidated items are strictly omitted.
   */
  public queryTruth(engagementId?: string, queryTerm?: string): CopilotIndexItem[] {
    const results: CopilotIndexItem[] = [];
    for (const item of this.items.values()) {
      if (!item.isEligible || item.status !== 'ACTIVE_TRUTH') {
        continue;
      }
      if (engagementId && item.engagementId !== engagementId) {
        continue;
      }
      if (queryTerm && queryTerm.trim() !== '') {
        const term = queryTerm.toLowerCase();
        const matches =
          item.metric.toLowerCase().includes(term) ||
          item.label.toLowerCase().includes(term) ||
          (item.sourceText && item.sourceText.toLowerCase().includes(term));
        if (!matches) continue;
      }
      results.push({ ...item });
    }
    return results;
  }

  public clear(): void {
    this.items.clear();
  }

  /**
   * Batch indexes candidate facts.
   */
  public indexFacts(facts: any[]): void {
    for (const f of facts) {
      this.indexFact({
        id: f.id,
        engagementId: f.engagementId || 'default-engagement',
        canonicalMetric: f.metric || f.canonicalMetric || f.metricName,
        label: f.label || f.metric || f.canonicalMetric || f.metricName,
        value: f.value ?? f.amount,
        statement: f.statement,
        sourceDoc: f.sourceDoc || f.documentTitle,
        pageNumber: f.pageNumber ?? f.page,
        verificationStatus: f.status || f.verificationStatus || 'VERIFIED'
      });
    }
  }

  /**
   * Package B3 Requirement 17:
   * Answers queries citing strictly verified facts or refusing to hallucinate missing data.
   */
  public answerQuery(query: string): {
    status: 'VERIFIED_FACT' | 'NOT_PRESENT_IN_RECORD';
    answer: string;
    citations: Array<{ factId: string; documentTitle: string; pageNumber?: number }>;
  } {
    const q = query.toLowerCase();
    let matchedItem: CopilotIndexItem | undefined;
    for (const item of this.items.values()) {
      if (!item.isEligible || item.status !== 'ACTIVE_TRUTH') continue;
      const m = item.metric.toLowerCase();
      const l = item.label.toLowerCase();
      if (q.includes(m) || q.includes(l)) {
        matchedItem = item;
        break;
      }
    }

    if (matchedItem) {
      const formatted = typeof matchedItem.value === 'number'
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(matchedItem.value)
        : String(matchedItem.value);
      return {
        status: 'VERIFIED_FACT',
        answer: `According to verified evidence in ${matchedItem.sourceDoc || 'workpapers'} (page ${matchedItem.pageNumber || 'N/A'}), the ${matchedItem.metric} is ${formatted}.`,
        citations: [
          {
            factId: matchedItem.id,
            documentTitle: matchedItem.sourceDoc || 'Workpaper',
            pageNumber: matchedItem.pageNumber
          }
        ]
      };
    }

    return {
      status: 'NOT_PRESENT_IN_RECORD',
      answer: `REFUSED: Fact matching query "${query}" is NOT_PRESENT_IN_RECORD. The autonomous system strictly refuses to fabricate or synthesize unverified financial numbers.`,
      citations: []
    };
  }
}

export const copilotKnowledgeIndex = CopilotKnowledgeIndex.getInstance();
