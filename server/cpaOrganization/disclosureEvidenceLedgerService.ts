import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type DisclosureTopic = 'ASC_280_SEGMENTS' | 'ASC_606_REVENUE' | 'ASC_842_LEASES';

export interface DisclosureEvidenceRecord {
  evidenceId: string;
  topic: DisclosureTopic;
  documentId: string;
  sourceBlockIds: string[];
  pageNumbers: number[];
  sections: string[];
  excerpt: string;
  excerptSha256: string;
  sourceBlockSha256: string;
  matchedTerms: string[];
  classification: 'DERIVED_FROM_HASH_VERIFIED_SOURCE_BLOCK';
}

export interface DisclosureTaxonomyMetrics {
  taxonomyVersion: string;
  uniqueConceptsCount: number;
  usGaapConceptsCount: number;
  customExtensionsCount: number;
  customConcepts: string[];
  uniqueContextsCount: number;
  dimensionContextsCount: number;
  dimensionMembersCount: number;
}

export interface DisclosureEvidenceLedger {
  ledgerId: string;
  documentId: string;
  sourceSha256: string;
  expectedSourceSha256: string;
  sourceSha256Match: boolean;
  sourceBlockCount: number;
  evidenceCount: number;
  topicCounts: Record<DisclosureTopic, number>;
  evidenceDigestSha256: string;
  taxonomyMetrics: DisclosureTaxonomyMetrics;
  records: DisclosureEvidenceRecord[];
  createdAt: string;
  persistedPath?: string;
}

const TOPIC_TERMS: Record<DisclosureTopic, string[]> = {
  ASC_280_SEGMENTS: [
    'segment information',
    'operating segments',
    'chief operating decision maker',
    'reportable segment',
    'codm'
  ],
  ASC_606_REVENUE: [
    'revenue recognition',
    'remaining performance obligations',
    'alliance revenues',
    'royalty revenues',
    'contract liabilit',
    'deferred revenue'
  ],
  ASC_842_LEASES: [
    'right-of-use',
    'right of use',
    'operating lease',
    'finance lease',
    'lease liabilit',
    'lease cost',
    'leases'
  ]
};

function sha256(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function normalizeWhitespace(value: any): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function blockId(block: any, index: number): string {
  return String(block?.source_block_id || block?.sourceBlockId || `source-block-${index + 1}`);
}

function blockDocumentId(block: any): string {
  return String(block?.document_id || block?.documentId || '');
}

function blockText(block: any): string {
  return String(block?.text_content || block?.raw_text || block?.text || '');
}

function blockPage(block: any): number {
  const v = Number(block?.page_number ?? block?.pageNumber ?? block?.page ?? 1);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

function blockSection(block: any): string {
  return normalizeWhitespace(block?.section || block?.sectionTitle || 'Main Content') || 'Main Content';
}

function topicMatches(text: string, topic: DisclosureTopic): string[] {
  const lower = text.toLowerCase();
  return TOPIC_TERMS[topic].filter(term => lower.includes(term));
}

function buildTaxonomyMetrics(sourceHtml: string): DisclosureTaxonomyMetrics {
  const concepts = [...sourceHtml.matchAll(/\bname=["']([A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+)["']/g)].map(m => m[1]);
  const uniqueConcepts = [...new Set(concepts)].sort();
  const usGaapConcepts = uniqueConcepts.filter(x => x.startsWith('us-gaap:'));
  const customConcepts = uniqueConcepts.filter(x => x.startsWith('pfe:'));

  const contextRefs = [...sourceHtml.matchAll(/\bcontextRef=["']([^"']+)["']/g)].map(m => m[1]);
  const contextIds = [...sourceHtml.matchAll(/<xbrli:context\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
  const uniqueContexts = [...new Set([...contextRefs, ...contextIds])];

  const dimensionContexts = new Set<string>();
  for (const match of sourceHtml.matchAll(/<xbrli:context\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/xbrli:context>/gi)) {
    if (/<xbrldi:(?:explicitMember|typedMember)\b/i.test(match[2])) dimensionContexts.add(match[1]);
  }
  const dimensionMembersCount = (sourceHtml.match(/<xbrldi:(?:explicitMember|typedMember)\b/gi) || []).length;
  const versions = [...sourceHtml.matchAll(/fasb\.org\/us-gaap\/(20\d{2})/g)].map(m => m[1]);
  const taxonomyVersion = [...new Set(versions)].sort().at(-1) || 'UNKNOWN';

  return {
    taxonomyVersion,
    uniqueConceptsCount: uniqueConcepts.length,
    usGaapConceptsCount: usGaapConcepts.length,
    customExtensionsCount: customConcepts.length,
    customConcepts,
    uniqueContextsCount: uniqueContexts.length,
    dimensionContextsCount: dimensionContexts.size,
    dimensionMembersCount
  };
}

export function buildDisclosureEvidenceLedger(input: {
  documentId: string;
  sourceBytes: Buffer | string;
  expectedSourceSha256: string;
  sourceBlocks: any[];
  maxRecordsPerTopic?: number;
}): DisclosureEvidenceLedger {
  const bytes = Buffer.isBuffer(input.sourceBytes) ? input.sourceBytes : Buffer.from(input.sourceBytes, 'utf8');
  const actualSourceSha256 = sha256(bytes);
  if (!input.expectedSourceSha256 || actualSourceSha256 !== input.expectedSourceSha256) {
    throw new Error(`DISCLOSURE_SOURCE_HASH_MISMATCH: expected=${input.expectedSourceSha256 || 'NONE'} actual=${actualSourceSha256}`);
  }

  const scopedBlocks = (Array.isArray(input.sourceBlocks) ? input.sourceBlocks : [])
    .filter(b => !blockDocumentId(b) || blockDocumentId(b) === input.documentId);
  const maxPerTopic = Math.max(1, Math.min(20, input.maxRecordsPerTopic || 8));
  const records: DisclosureEvidenceRecord[] = [];

  for (const topic of Object.keys(TOPIC_TERMS) as DisclosureTopic[]) {
    const candidates: Array<{ score: number; record: DisclosureEvidenceRecord; signature: string }> = [];
    for (let i = 0; i < scopedBlocks.length; i++) {
      const directText = normalizeWhitespace(blockText(scopedBlocks[i]));
      const directMatches = topicMatches(directText, topic);
      if (directMatches.length === 0) continue;

      const neighborhood = [i - 1, i, i + 1]
        .filter(idx => idx >= 0 && idx < scopedBlocks.length)
        .map(idx => ({ idx, block: scopedBlocks[idx], text: normalizeWhitespace(blockText(scopedBlocks[idx])) }))
        .filter(x => x.text.length > 0 && x.text.length <= 5000);

      const sourceBlockIds = neighborhood.map(x => blockId(x.block, x.idx));
      const exactSourceText = neighborhood.map(x => blockText(x.block)).join('\n---SOURCE-BLOCK---\n');
      const excerpt = neighborhood.map(x => x.text).join(' ').slice(0, 2200);
      const matchedTerms = [...new Set(topicMatches(excerpt, topic))];
      const evidenceId = `EVD-${topic}-${sha256(`${input.documentId}|${sourceBlockIds.join('|')}|${excerpt}`).slice(0, 16)}`;
      const pageNumbers = [...new Set(neighborhood.map(x => blockPage(x.block)))];
      const sections = [...new Set(neighborhood.map(x => blockSection(x.block)))];
      const record: DisclosureEvidenceRecord = {
        evidenceId,
        topic,
        documentId: input.documentId,
        sourceBlockIds,
        pageNumbers,
        sections,
        excerpt,
        excerptSha256: sha256(excerpt),
        sourceBlockSha256: sha256(exactSourceText),
        matchedTerms,
        classification: 'DERIVED_FROM_HASH_VERIFIED_SOURCE_BLOCK'
      };
      const richness = Math.min(excerpt.length, 2200) / 100;
      const score = directMatches.length * 1000 + matchedTerms.length * 200 + richness;
      candidates.push({ score, record, signature: `${topic}|${sourceBlockIds.join('|')}` });
    }

    const seen = new Set<string>();
    for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
      if (seen.has(candidate.signature)) continue;
      seen.add(candidate.signature);
      records.push(candidate.record);
      if (records.filter(r => r.topic === topic).length >= maxPerTopic) break;
    }
  }

  records.sort((a, b) => a.topic.localeCompare(b.topic) || a.evidenceId.localeCompare(b.evidenceId));
  const topicCounts = {
    ASC_280_SEGMENTS: records.filter(r => r.topic === 'ASC_280_SEGMENTS').length,
    ASC_606_REVENUE: records.filter(r => r.topic === 'ASC_606_REVENUE').length,
    ASC_842_LEASES: records.filter(r => r.topic === 'ASC_842_LEASES').length
  };
  const digestMaterial = records.map(r => ({
    evidenceId: r.evidenceId,
    topic: r.topic,
    documentId: r.documentId,
    sourceBlockIds: r.sourceBlockIds,
    excerptSha256: r.excerptSha256,
    sourceBlockSha256: r.sourceBlockSha256,
    matchedTerms: r.matchedTerms,
    classification: r.classification
  }));
  const evidenceDigestSha256 = sha256(JSON.stringify(digestMaterial));
  const taxonomyMetrics = buildTaxonomyMetrics(bytes.toString('utf8'));
  const ledgerId = `DISC-${sha256(`${input.documentId}|${actualSourceSha256}|${evidenceDigestSha256}`).slice(0, 20)}`;

  return {
    ledgerId,
    documentId: input.documentId,
    sourceSha256: actualSourceSha256,
    expectedSourceSha256: input.expectedSourceSha256,
    sourceSha256Match: true,
    sourceBlockCount: scopedBlocks.length,
    evidenceCount: records.length,
    topicCounts,
    evidenceDigestSha256,
    taxonomyMetrics,
    records,
    createdAt: new Date().toISOString()
  };
}

export class DisclosureEvidenceLedgerService {
  private static instance: DisclosureEvidenceLedgerService | null = null;
  private readonly storageDir = path.join(process.cwd(), 'storage', 'cpa_memory', 'disclosure_evidence');

  private constructor() {
    fs.mkdirSync(this.storageDir, { recursive: true });
  }

  public static getInstance(): DisclosureEvidenceLedgerService {
    if (!DisclosureEvidenceLedgerService.instance) DisclosureEvidenceLedgerService.instance = new DisclosureEvidenceLedgerService();
    return DisclosureEvidenceLedgerService.instance;
  }

  public buildAndPersist(params: {
    documentId: string;
    sourceFilePath: string;
    expectedSourceSha256: string;
    sourceBlocks: any[];
    maxRecordsPerTopic?: number;
  }): DisclosureEvidenceLedger {
    if (!params.sourceFilePath || !fs.existsSync(params.sourceFilePath)) {
      throw new Error(`DISCLOSURE_SOURCE_FILE_MISSING: ${params.sourceFilePath || 'NONE'}`);
    }
    const ledger = buildDisclosureEvidenceLedger({
      documentId: params.documentId,
      sourceBytes: fs.readFileSync(params.sourceFilePath),
      expectedSourceSha256: params.expectedSourceSha256,
      sourceBlocks: params.sourceBlocks,
      maxRecordsPerTopic: params.maxRecordsPerTopic
    });
    const filename = `${params.documentId}-${ledger.sourceSha256.slice(0, 16)}.json`;
    const target = path.join(this.storageDir, filename);
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(ledger, null, 2), 'utf8');
    const fd = fs.openSync(tmp, 'r');
    try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, target);
    try {
      const dfd = fs.openSync(this.storageDir, 'r');
      try { fs.fsyncSync(dfd); } finally { fs.closeSync(dfd); }
    } catch {}
    ledger.persistedPath = target;
    return ledger;
  }
}

export const disclosureEvidenceLedgerService = DisclosureEvidenceLedgerService.getInstance();
