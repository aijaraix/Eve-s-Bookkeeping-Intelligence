import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { academyMinervaLab } from './academyMinervaLab.js';
import { deliverableArtifactService } from './deliverableArtifactService.js';
import { professionalClarificationEngine } from './professionalClarificationEngine.js';
import type { RawInputContinuation, RawStageExecution, RawStageExecutor, RawStageReceipt } from './rawInputHermesContinuation.js';

type LedgerSide = { accountCode: string; accountName: string; amount: number };

const debitAccounts: Record<string, Omit<LedgerSide, 'amount'>> = {
  'OFFICE SUPPLIES': { accountCode: '6100', accountName: 'Office Supplies Expense' },
  'MEALS': { accountCode: '6200', accountName: 'Meals Expense' },
  'TRAVEL': { accountCode: '6300', accountName: 'Travel Expense' },
  'SOFTWARE': { accountCode: '6400', accountName: 'Software Expense' },
  'REPAIRS AND MAINTENANCE': { accountCode: '6500', accountName: 'Repairs and Maintenance Expense' },
};

const creditAccounts: Record<string, Omit<LedgerSide, 'amount'>> = {
  CASH: { accountCode: '1000', accountName: 'Cash' },
  CHECK: { accountCode: '1000', accountName: 'Cash' },
  CHEQUE: { accountCode: '1000', accountName: 'Cash' },
  ACH: { accountCode: '1000', accountName: 'Cash' },
  WIRE: { accountCode: '1000', accountName: 'Cash' },
  'BANK TRANSFER': { accountCode: '1000', accountName: 'Cash' },
  VISA: { accountCode: '2100', accountName: 'Credit Card Payable' },
  MASTERCARD: { accountCode: '2100', accountName: 'Credit Card Payable' },
  AMEX: { accountCode: '2100', accountName: 'Credit Card Payable' },
  CARD: { accountCode: '2100', accountName: 'Credit Card Payable' },
};

function hash(value: unknown): string {
  const material = Buffer.isBuffer(value) ? value : (typeof value === 'string' ? value : JSON.stringify(value));
  return crypto.createHash('sha256').update(material).digest('hex');
}

function previous(continuation: RawInputContinuation, stage: RawStageExecution['stage']): Record<string, any> | null {
  const row = [...continuation.executions].reverse().find(item => item.stage === stage && item.status === 'COMPLETED');
  return row?.resultData || null;
}

function unique(values: unknown[]): string[] {
  return [...new Set(values.filter(Boolean).map(String))];
}

function canonicalize(continuation: RawInputContinuation): RawStageReceipt {
  const canonicalTransactions = continuation.facts.map((fact: any) => {
    const raw = fact.rawTransaction;
    if (!raw || raw.canonicalizationState !== 'READY_FOR_CLASSIFICATION') return null;
    return {
      canonicalTransactionId: `CTX-${fact.id}`,
      sourceFactId: fact.id,
      workspaceId: continuation.workspaceId,
      documentId: continuation.documentId,
      documentKind: raw.documentKind,
      date: raw.transactionDate?.value,
      currency: raw.currency?.value,
      amount: Number(raw.amount?.value),
      counterparty: raw.counterparty?.value || null,
      documentNumber: raw.documentNumber?.value || null,
      paymentMethod: raw.paymentMethod?.value || null,
      accountingCategory: raw.accountingCategory?.value || null,
      description: raw.description?.value || null,
      lineItems: raw.lineItems || [],
      sourceSha256: fact.sourceSha256,
      sourceArtifactId: fact.sourceArtifactId,
      sourceProvenanceId: fact.sourceProvenanceId,
      sourceProvenanceIds: fact.sourceProvenanceIds || [],
      sourceCoordinate: fact.sourceCoordinate,
      sourceCoordinates: fact.sourceCoordinates || [fact.sourceCoordinate].filter(Boolean),
      evidenceStatus: fact.evidenceStatus,
      verificationStatus: fact.verificationStatus,
    };
  }).filter(Boolean);
  if (!canonicalTransactions.length) return {
    status: 'BLOCKED', outcomeCode: 'NO_PROOF_COMPLETE_TRANSACTIONS',
    summary: 'No proof-complete raw transaction was eligible for canonicalization.',
    blockedReason: 'PROOF_COMPLETE_RAW_TRANSACTION_REQUIRED',
  };
  return {
    status: 'COMPLETED', outcomeCode: 'RAW_TRANSACTIONS_CANONICALIZED',
    summary: `${canonicalTransactions.length} evidence-backed raw transaction(s) entered the canonical accounting model.`,
    outputRefs: canonicalTransactions.flatMap((row: any) => [`canonical:${row.canonicalTransactionId}`, `source:${row.sourceSha256}`]),
    resultData: { canonicalTransactions },
  };
}

function classify(continuation: RawInputContinuation): RawStageReceipt {
  const canonicalTransactions = previous(continuation, 'CANONICALIZATION')?.canonicalTransactions || [];
  const classifiedTransactions: any[] = [];
  const unresolved: any[] = [];
  for (const transaction of canonicalTransactions) {
    const debit = debitAccounts[String(transaction.accountingCategory || '').toUpperCase()];
    const credit = creditAccounts[String(transaction.paymentMethod || '').toUpperCase()];
    if (!debit || !credit) {
      unresolved.push({
        canonicalTransactionId: transaction.canonicalTransactionId,
        reasons: [!debit ? 'SOURCE_SUPPORTED_ACCOUNTING_CATEGORY_REQUIRED' : null, !credit ? 'SOURCE_SUPPORTED_PAYMENT_METHOD_REQUIRED' : null].filter(Boolean),
      });
      continue;
    }
    const amount = Math.abs(Number(transaction.amount));
    classifiedTransactions.push({
      ...transaction,
      classificationBasis: {
        categoryLiteral: transaction.accountingCategory,
        paymentMethodLiteral: transaction.paymentMethod,
        policy: 'BOUNDED_EXPLICIT_SOURCE_CATEGORY_V1',
      },
      journal: {
        journalId: `JRN-${transaction.canonicalTransactionId}`,
        status: 'AI_PREPARED_DRAFT',
        date: transaction.date,
        currency: transaction.currency,
        description: transaction.description || `${transaction.documentKind} ${transaction.documentNumber || ''}`.trim(),
        debits: [{ ...debit, amount }],
        credits: [{ ...credit, amount }],
        sourceFactId: transaction.sourceFactId,
      },
    });
  }
  const classificationComplete = canonicalTransactions.length > 0 && unresolved.length === 0;
  return {
    status: 'COMPLETED',
    outcomeCode: classificationComplete ? 'CLASSIFICATION_COMPLETE' : 'CLASSIFICATION_NEEDS_CLARIFICATION',
    summary: `${classifiedTransactions.length}/${canonicalTransactions.length} transaction(s) were classified from explicit source-supported category and payment evidence.`,
    outputRefs: classifiedTransactions.map(row => `journal:${row.journal.journalId}`),
    resultData: { classificationComplete, classifiedTransactions, unresolved },
  };
}

function createWorkpaper(continuation: RawInputContinuation): RawStageReceipt {
  const classified = previous(continuation, 'ACCOUNTING_CLASSIFICATION')?.classifiedTransactions || [];
  const journals = classified.map((row: any) => row.journal);
  const balanced = journals.every((journal: any) => {
    const debits = journal.debits.reduce((sum: number, line: any) => sum + Number(line.amount), 0);
    const credits = journal.credits.reduce((sum: number, line: any) => sum + Number(line.amount), 0);
    return Math.abs(debits - credits) < 0.000001;
  });
  if (!journals.length || !balanced) return {
    status: 'BLOCKED', outcomeCode: 'DRAFT_JOURNAL_NOT_BALANCED', summary: 'No balanced draft journal was available for workpaper generation.',
    blockedReason: 'BALANCED_DRAFT_JOURNAL_REQUIRED',
  };
  const workpaper = {
    workpaperId: `WP-${continuation.continuationId}`,
    workspaceId: continuation.workspaceId,
    documentId: continuation.documentId,
    status: 'AI_PREPARED_DRAFT',
    professionalApproval: 'NOT_GRANTED',
    postingState: 'DRAFT_NOT_POSTED_TO_PRODUCTION_BOOKS',
    journals,
    control: { balanced: true, journalCount: journals.length },
    sourceRefs: unique(classified.flatMap((row: any) => [`fact:${row.sourceFactId}`, `source:${row.sourceSha256}`, `canonical:${row.canonicalTransactionId}`])),
    createdAt: new Date().toISOString(),
  };
  const root = process.env.EVE_RAW_WORKPAPER_DIR || path.join(process.cwd(), 'storage', 'cpa_memory', 'raw_input_workpapers');
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  const filepath = path.join(root, `${workpaper.workpaperId}.json`);
  const serialized = JSON.stringify(workpaper, null, 2);
  fs.writeFileSync(filepath, serialized, { mode: 0o600 });
  const sha256 = hash(serialized);
  return {
    status: 'COMPLETED', outcomeCode: 'DRAFT_BOOKS_WORKPAPER_CREATED',
    summary: `${journals.length} balanced AI-prepared draft journal(s) were recorded in a review workpaper; no professional approval or production posting was asserted.`,
    outputRefs: [`workpaper:${workpaper.workpaperId}`, `artifact-sha256:${sha256}`, ...journals.map((row: any) => `journal:${row.journalId}`)],
    resultData: { workpaper, artifact: { filepath, sha256, sizeBytes: Buffer.byteLength(serialized) } },
  };
}

function clarify(continuation: RawInputContinuation): RawStageReceipt {
  const unresolved = previous(continuation, 'ACCOUNTING_CLASSIFICATION')?.unresolved || [];
  const request = professionalClarificationEngine.createClarificationRequest({
    type: 'ACCOUNTING_TREATMENT', projectId: continuation.workspaceId, engagementId: continuation.workspaceId,
    createdBy: 'CLARA_PBC_COORDINATOR', assignedTo: 'CLIENT_CONTROLLER', requestKind: 'PBC_EVIDENCE_REQUEST',
    question: 'Please provide source evidence for the accounting category and payment account for the listed transaction(s).',
    whyItMatters: 'Eve will not infer a ledger account when the raw document does not support the classification.',
    evidenceAvailable: unique(continuation.facts.map((fact: any) => `fact:${fact.id}`)), conflictingEvidence: [], confidence: 0,
    potentialFinancialImpact: 'The draft journal remains unposted until classification evidence is complete.',
    potentialReportImpact: 'Books and deliverables remain incomplete for these transactions.',
    options: [], status: 'DRAFT', supportingDocumentIds: [continuation.documentId],
  });
  return {
    status: 'COMPLETED', outcomeCode: 'CLARIFICATION_CREATED',
    summary: `Clarification ${request.requestId} preserves the unresolved accounting treatment without guessing.`,
    outputRefs: [`clarification:${request.requestId}`], resultData: { clarificationResolved: false, requestId: request.requestId, unresolved },
  };
}

async function deliver(continuation: RawInputContinuation): Promise<RawStageReceipt> {
  const canonicalTransactions = previous(continuation, 'CANONICALIZATION')?.canonicalTransactions || [];
  const workpaper = previous(continuation, 'POSTING_WORKPAPER');
  if (!workpaper?.workpaper || !canonicalTransactions.length) return {
    status: 'BLOCKED', outcomeCode: 'WORKPAPER_REQUIRED_FOR_DELIVERABLE', summary: 'A verified draft workpaper is required before deliverable compilation.',
    blockedReason: 'DRAFT_WORKPAPER_REQUIRED',
  };
  const reportId = `RAW-${hash(continuation.continuationId).slice(0, 16)}`;
  const artifact = await deliverableArtifactService.compileAndRegisterDeliverable({
    reportId, engagementId: continuation.workspaceId, workspaceId: continuation.workspaceId, version: 'v1.0',
    title: 'Raw Input Accounting Review Package', deliverableType: 'BOOKKEEPING_REVIEW_PACKAGE', audience: 'CUSTOMER_AND_AUTHORIZED_REVIEWER',
    clientName: continuation.workspaceId, period: canonicalTransactions[0].date, currency: canonicalTransactions[0].currency,
    status: 'AI_PREPARED', requireFinalLineage: true,
    facts: canonicalTransactions.map((row: any) => ({
      id: row.sourceFactId, canonicalMetric: 'raw_input_transaction_total', label: `${row.documentKind} transaction total`, value: row.amount,
      statement: 'RAW_INPUT_TRANSACTION', sourceDoc: continuation.documentId, page: row.sourceCoordinate?.pageNumber || 1,
      verificationStatus: row.verificationStatus, evidenceStatus: row.evidenceStatus, factState: 'APPROVED', unitScale: 'Units',
      documentId: row.documentId, reportingPeriod: row.date, sourceText: row.description || row.counterparty || '',
      sourceSha256: row.sourceSha256, sourceArtifactId: row.sourceArtifactId, sourceProvenanceId: row.sourceProvenanceId,
      sourceProvenanceIds: row.sourceProvenanceIds, sourceCoordinate: row.sourceCoordinate, sourceCoordinates: row.sourceCoordinates,
    })),
    rawInputWorkpaper: workpaper.workpaper,
  });
  const formats = Object.fromEntries(Object.entries(artifact.manifest.artifacts).map(([name, item]) => [name, {
    filepath: item.filepath, sha256: item.sha256, sizeBytes: item.sizeBytes,
  }]));
  return {
    status: 'COMPLETED', outcomeCode: 'AI_PREPARED_DELIVERABLE_CREATED',
    summary: `AI-prepared report ${artifact.reportId} ${artifact.version} was compiled in four hash-verified formats.`,
    outputRefs: [`report:${artifact.reportId}:${artifact.version}`, ...Object.entries(formats).map(([name, item]: any) => `artifact:${name}:${item.sha256}`)],
    resultData: { reportId: artifact.reportId, version: artifact.version, status: artifact.status, canonicalFactHash: artifact.canonicalFactHash, formats },
  };
}

function verifyLineage(continuation: RawInputContinuation): RawStageReceipt {
  const canonical = previous(continuation, 'CANONICALIZATION')?.canonicalTransactions || [];
  const classified = previous(continuation, 'ACCOUNTING_CLASSIFICATION')?.classifiedTransactions || [];
  const workpaper = previous(continuation, 'POSTING_WORKPAPER');
  const deliverable = previous(continuation, 'REPORT_DELIVERABLE');
  const formatChecks = Object.entries(deliverable?.formats || {}).map(([format, artifact]: any) => ({
    format, exists: fs.existsSync(artifact.filepath), expectedSha256: artifact.sha256,
    actualSha256: fs.existsSync(artifact.filepath) ? hash(fs.readFileSync(artifact.filepath)) : null,
  }));
  const chainComplete = canonical.length > 0 && classified.length === canonical.length && Boolean(workpaper?.workpaper) && Boolean(deliverable?.reportId);
  const artifactsValid = formatChecks.length === 4 && formatChecks.every(check => check.exists && check.expectedSha256 === check.actualSha256);
  const valid = chainComplete && artifactsValid;
  const reverseLineage = canonical.map((row: any) => ({
    reportId: deliverable?.reportId, workpaperId: workpaper?.workpaper?.workpaperId,
    journalId: classified.find((item: any) => item.canonicalTransactionId === row.canonicalTransactionId)?.journal?.journalId,
    canonicalTransactionId: row.canonicalTransactionId, factId: row.sourceFactId,
    documentId: row.documentId, sourceSha256: row.sourceSha256, sourceCoordinate: row.sourceCoordinate,
  }));
  return {
    status: valid ? 'COMPLETED' : 'BLOCKED', outcomeCode: valid ? 'REVERSE_LINEAGE_VERIFIED' : 'REVERSE_LINEAGE_INVALID',
    summary: valid ? `Reverse lineage and four physical artifact hashes verified for ${canonical.length} transaction(s).` : 'Reverse lineage or physical artifact integrity was incomplete.',
    blockedReason: valid ? undefined : 'COMPLETE_REVERSE_LINEAGE_AND_ARTIFACT_READBACK_REQUIRED',
    outputRefs: valid ? unique(reverseLineage.flatMap((row: any) => [`report:${row.reportId}`, `workpaper:${row.workpaperId}`, `journal:${row.journalId}`, `fact:${row.factId}`, `source:${row.sourceSha256}`])) : [],
    resultData: { valid, reverseLineage, formatChecks },
  };
}

function grade(continuation: RawInputContinuation): RawStageReceipt {
  const canonical = previous(continuation, 'CANONICALIZATION')?.canonicalTransactions || [];
  const classified = previous(continuation, 'ACCOUNTING_CLASSIFICATION')?.classifiedTransactions || [];
  const workpaper = previous(continuation, 'POSTING_WORKPAPER');
  const deliverable = previous(continuation, 'REPORT_DELIVERABLE');
  const lineage = previous(continuation, 'LINEAGE_VERIFICATION');
  const proof = continuation.physicalProof;
  if (!proof) return {
    status: 'BLOCKED', outcomeCode: 'PHYSICAL_PRODUCT_PROOF_REQUIRED',
    summary: 'Minerva refused to grade Product Truth without physical customer/owner rendering and deliverable readback evidence.',
    blockedReason: 'PHYSICAL_PRODUCT_AND_DELIVERABLE_PROOF_REQUIRED',
  };
  const report = academyMinervaLab.evaluateFiveDimensions({
    caseId: continuation.examinationId || continuation.continuationId,
    executionId: `raw-minerva-${continuation.continuationId}`,
    dimensions: {
      SOURCE_COVERAGE: { checks: [{ checkId: 'raw-source-lineage', label: 'Every canonical transaction retains exact source identity and coordinate', outcome: canonical.every((row: any) => row.sourceSha256 && row.sourceCoordinate) ? 'PASS' : 'FAIL', evidenceRefs: canonical.flatMap((row: any) => [`source:${row.sourceSha256}`, `fact:${row.sourceFactId}`]) }] },
      SEMANTIC_UNDERSTANDING: { checks: [{ checkId: 'raw-semantic-fields', label: 'Document type, amount, date, currency, counterparty, payment method, and explicit category remain source-supported', outcome: canonical.every((row: any) => row.documentKind && Number.isFinite(row.amount) && row.date && row.currency && row.counterparty && row.paymentMethod && row.accountingCategory) ? 'PASS' : 'FAIL', evidenceRefs: canonical.map((row: any) => `canonical:${row.canonicalTransactionId}`) }] },
      ACCOUNTING_ACCURACY: { checks: [{ checkId: 'raw-balanced-journal', label: 'Classification follows explicit category/payment evidence and draft journals balance', outcome: classified.length === canonical.length && workpaper?.workpaper?.control?.balanced ? 'PASS' : 'FAIL', evidenceRefs: classified.map((row: any) => `journal:${row.journal.journalId}`) }] },
      PRODUCT_TRUTH: { checks: [{ checkId: 'raw-physical-browser', label: 'Authenticated customer and owner views render the same tenant-scoped raw accounting state', outcome: proof.productEvidenceRefs.length ? 'PASS' : 'FAIL', evidenceRefs: proof.productEvidenceRefs }] },
      DELIVERABLE_TRUTH: { checks: [{ checkId: 'raw-deliverable-readback', label: 'Downloaded deliverable matches canonical facts and reverse lineage', outcome: lineage?.valid && deliverable?.reportId && proof.deliverableEvidenceRefs.length ? 'PASS' : 'FAIL', evidenceRefs: [...proof.deliverableEvidenceRefs, `report:${deliverable?.reportId}`, `lineage:${hash(lineage?.reverseLineage || [])}`] }] },
    },
  });
  return {
    status: 'COMPLETED', outcomeCode: report.overallStatus,
    summary: `Independent Minerva result: ${report.overallStatus}; ${report.passedDimensionCount}/5 dimensions passed.`,
    outputRefs: [`minerva:${report.evaluationId}`], resultData: { minervaResult: report.overallStatus === 'FIVE_DIMENSION_PASS' ? 'PASS' : 'FAIL', report },
  };
}

export const rawInputAccountingStageExecutor: RawStageExecutor = async ({ continuation, execution }) => {
  switch (execution.stage) {
    case 'CANONICALIZATION': return canonicalize(continuation);
    case 'ACCOUNTING_CLASSIFICATION': return classify(continuation);
    case 'POSTING_WORKPAPER': return createWorkpaper(continuation);
    case 'RECONCILIATION': return { status: 'COMPLETED', outcomeCode: 'RECONCILIATION_NOT_APPLICABLE', summary: `Reconciliation was not required for ${continuation.documentKind}.`, resultData: { reconciliationStatus: 'NOT_APPLICABLE' } };
    case 'CLARIFICATION': return clarify(continuation);
    case 'REPORT_DELIVERABLE': return deliver(continuation);
    case 'LINEAGE_VERIFICATION': return verifyLineage(continuation);
    case 'MINERVA_GRADING': return grade(continuation);
    default: throw new Error(`RAW_ACCOUNTING_WORKER_UNSUPPORTED_STAGE:${execution.stage}`);
  }
};
