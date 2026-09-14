import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { executeRealAgentWork, RealAgentExecutionReceipt, RealAgentAdapterFn } from './realAgentExecutionAdapter.js';

const VERSION = 'lexicon-name-batches-v1';
const CATEGORIES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE', 'CASH_FLOW', 'DISCLOSURE', 'UNKNOWN'];
const MAX_ATTEMPTS = 2;
export interface LexiconBatchItem { ref: string; concept: string }
export interface LexiconBatch { index: number; items: LexiconBatchItem[] }
export type BatchReceipt = RealAgentExecutionReceipt & { batchReceiptPaths?: string[]; modelExecutionIds?: string[] };
const hash = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

/** Bound both item count and input size. No sampling, truncation, or invented completion. */
export function planLexiconBatches(concepts: string[]): LexiconBatch[] {
  if (!Array.isArray(concepts) || concepts.length > 2000 || new Set(concepts).size !== concepts.length) throw new Error('LEXICON_INVALID_INVENTORY');
  const batches: LexiconBatch[] = [];
  let items: LexiconBatchItem[] = [], chars = 0;
  for (const concept of concepts) {
    if (typeof concept !== 'string' || !concept.trim() || concept.length > 1800) throw new Error('LEXICON_INVALID_CONCEPT');
    if (items.length && (items.length >= 16 || chars + concept.length > 2400)) {
      batches.push({ index: batches.length, items }); items = []; chars = 0;
    }
    items.push({ ref: String(items.length), concept }); chars += concept.length;
  }
  if (items.length) batches.push({ index: batches.length, items });
  return batches;
}

export function lexiconBatchSchema(batch: LexiconBatch, version: string): Record<string, any> {
  const choices = batch.items.flatMap(x => CATEGORIES.map(c => `${x.ref}|${c}`));
  return { type: 'object', additionalProperties: false, properties: {
    semanticAnchorStatus: { type: 'string', enum: ['PROVISIONAL_NAME_REVIEW'] },
    taxonomyVersion: { type: 'string', enum: [version] },
    customExtensionsEvaluated: { type: 'integer', enum: [batch.items.length] },
    semanticAlignments: { type: 'array', minItems: batch.items.length, maxItems: batch.items.length, items: { type: 'string', enum: choices } },
    disposition: { type: 'string', enum: ['DEFINITION_REVIEW_REQUIRED'] }
  }, required: ['semanticAnchorStatus', 'taxonomyVersion', 'customExtensionsEvaluated', 'semanticAlignments', 'disposition'] };
}

/** Validate membership and uniqueness independently of model-reported counts. */
export function validateLexiconBatch(raw: any, batch: LexiconBatch, version: string): boolean {
  if (!raw || Array.isArray(raw) || typeof raw !== 'object') return false;
  const keys = ['semanticAnchorStatus','taxonomyVersion','customExtensionsEvaluated','semanticAlignments','disposition'];
  if (Object.keys(raw).length !== keys.length || Object.keys(raw).some(k => !keys.includes(k))) return false;
  if (raw.semanticAnchorStatus !== 'PROVISIONAL_NAME_REVIEW' || raw.disposition !== 'DEFINITION_REVIEW_REQUIRED' || raw.taxonomyVersion !== version) return false;
  if (raw.customExtensionsEvaluated !== batch.items.length || !Array.isArray(raw.semanticAlignments) || raw.semanticAlignments.length !== batch.items.length) return false;
  const seen = new Set<string>();
  for (const v of raw.semanticAlignments) {
    if (typeof v !== 'string') return false;
    const parts = v.split('|');
    if (parts.length !== 2 || !batch.items.some(x => x.ref === parts[0]) || !CATEGORIES.includes(parts[1]) || seen.has(parts[0])) return false;
    seen.add(parts[0]);
  }
  return seen.size === batch.items.length;
}

function persist(file: string, value: any): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  const fd = fs.openSync(temp, 'wx', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(value)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(temp, file);
  const dir = fs.openSync(path.dirname(file), 'r');
  try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
}

export async function executeLexiconBatches(input: {
  engagementId: string; sourceSha256: string; taxonomyVersion: string;
  customConcepts: string[]; expectedCount: number; inputObjectReferences: string[];
}, test?: { rootDir: string; execute: RealAgentAdapterFn }): Promise<BatchReceipt> {
  if (test && process.env.NODE_ENV === 'production') throw new Error('LEXICON_TEST_ADAPTER_PROHIBITED');
  const invoke = test?.execute || executeRealAgentWork;
  if (input.customConcepts.length !== input.expectedCount || !/^[a-f0-9]{64}$/.test(input.sourceSha256)) throw new Error('LEXICON_INVENTORY_CUSTODY_MISMATCH');
  const batches = planLexiconBatches([...input.customConcepts].sort());
  if (!batches.length) throw new Error('LEXICON_EMPTY_BATCH_INVENTORY');
  const identity = hash(JSON.stringify({ version: VERSION, engagement: input.engagementId, source: input.sourceSha256, taxonomy: input.taxonomyVersion, batches }));
  const root = path.join(test?.rootDir || path.join(process.cwd(), 'storage', 'cpa_memory', 'lexicon_batches'), identity);
  const receipts: RealAgentExecutionReceipt[] = [], receiptPaths: string[] = [], alignments: any[] = [];
  for (const batch of batches) {
    let accepted: RealAgentExecutionReceipt | null = null, failure: RealAgentExecutionReceipt | null = null;
    const requestHash = hash(JSON.stringify({ identity, batch }));
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const file = path.join(root, `batch-${batch.index}-attempt-${attempt}.json`);
      let saved: any = null;
      if (fs.existsSync(file)) {
        saved = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (saved.requestHash !== requestHash) throw new Error('LEXICON_CHECKPOINT_INPUT_MISMATCH');
        const r = saved.receipt;
        if (saved.status === 'VALIDATED' && r?.modelExecutionId && r.executionStatus === 'SUCCESS' && saved.outputHash === hash(JSON.stringify(r.parsedOutput)) && validateLexiconBatch(r.parsedOutput, batch, input.taxonomyVersion)) {
          accepted = r; receiptPaths.push(file); break;
        }
        failure = r || failure;
        // A previous STARTED attempt also consumes budget after interruption.
        continue;
      }
      persist(file, { identity, requestHash, batch, attempt, status: 'STARTED', startedAt: new Date().toISOString() });
      const r = await invoke({
        taskId: `task-lexicon-${identity.slice(0,16)}-b${batch.index}-a${attempt}`,
        agentId: 'LEXICON', taskType: 'ENTITY_MAPPING', engagementId: input.engagementId,
        systemPrompt: 'Classify XBRL concept NAMES into provisional accounting categories. Names alone cannot establish authoritative taxonomy anchors. Do not invent definitions, standard-concept equivalence, or approval.',
        userPrompt: `Return compact JSON for this batch only. Each semanticAlignments entry must be ref|CATEGORY, one for EVERY supplied ref, no duplicates. Categories: ${CATEGORIES.join(',')}. Use UNKNOWN when ambiguous. semanticAnchorStatus=PROVISIONAL_NAME_REVIEW; disposition=DEFINITION_REVIEW_REQUIRED; taxonomyVersion=${input.taxonomyVersion}; customExtensionsEvaluated=${batch.items.length}. No explanatory text in the output.`,
        contextData: { concepts: batch.items }, inputObjectReferences: input.inputObjectReferences,
        structuredSchema: lexiconBatchSchema(batch, input.taxonomyVersion), maxOutputTokens: 512, localModelTimeoutMs: 75000,
        promptTemplateVersion: VERSION
      });
      const valid = r.executionStatus === 'SUCCESS' && Boolean(r.modelExecutionId) && validateLexiconBatch(r.parsedOutput, batch, input.taxonomyVersion);
      persist(file, { identity, requestHash, batch, attempt, status: valid ? 'VALIDATED' : 'FAILED', completedAt: new Date().toISOString(), outputHash: hash(JSON.stringify(r.parsedOutput)), receipt: r });
      if (valid) { accepted = r; receiptPaths.push(file); break; }
      failure = r;
    }
    if (!accepted) {
      if (!failure) throw new Error(`LEXICON_BATCH_ATTEMPTS_EXHAUSTED:${batch.index}`);
      return { ...failure, executionStatus: 'INVALID_MODEL_OUTPUT', outputValidationStatus: 'INVALID_MODEL_OUTPUT', parsedOutput: null,
        error: `LEXICON_BATCH_BLOCKED:${batch.index}; completed=${receipts.length}/${batches.length}; bounded attempts exhausted; no partial result accepted`,
        batchReceiptPaths: receiptPaths, modelExecutionIds: receipts.map(r => r.modelExecutionId) };
    }
    receipts.push(accepted);
    for (const item of batch.items) {
      const encoded = accepted.parsedOutput!.semanticAlignments.find((s: string) => s.split('|')[0] === item.ref);
      alignments.push({ concept: item.concept, provisionalCategory: encoded.split('|')[1], authority: 'NAME_ONLY_PROPOSAL', authoritativeAnchorVerified: false, modelExecutionId: accepted.modelExecutionId });
    }
  }
  if (alignments.length !== input.expectedCount || new Set(alignments.map(x => x.concept)).size !== input.expectedCount) throw new Error('LEXICON_BATCH_CONSERVATION_FAILED');
  // This is an explicit reduction of real receipts, not a fabricated model invocation.
  const last = receipts[receipts.length - 1];
  const output = { semanticAnchorStatus: 'PROVISIONAL_NAME_REVIEW_NOT_AUTHORITATIVE_ANCHOR', taxonomyVersion: input.taxonomyVersion,
    customExtensionsEvaluated: alignments.length, semanticAlignments: alignments, disposition: 'NAME_REVIEW_COMPLETE_DEFINITION_REVIEW_REQUIRED' };
  persist(path.join(root, 'manifest.json'), { identity, classification: 'VALIDATED_REAL_MODEL_BATCH_REDUCTION', inputCount: input.expectedCount, outputCount: alignments.length, batchCount: batches.length, receiptPaths, modelExecutionIds: receipts.map(r=>r.modelExecutionId), outputHash: hash(JSON.stringify(output)), output, authoritativeAnchorsVerified: 0 });
  return { ...last, parsedOutput: output, rawModelResponseRef: path.join(root, 'manifest.json'), rawModelResponseHash: undefined,
    batchReceiptPaths: receiptPaths, modelExecutionIds: receipts.map(r=>r.modelExecutionId),
    usage: { promptTokens: receipts.reduce((n,r)=>n+(r.usage?.promptTokens||0),0), completionTokens: receipts.reduce((n,r)=>n+(r.usage?.completionTokens||0),0) },
    executionStartedAt: receipts[0].executionStartedAt, latencyMs: receipts.reduce((n,r)=>n+r.latencyMs,0),
    costUsd: 0, costMeasurement: 'NOT_REPORTED', outputValidationStatus: 'VALIDATED' };
}
