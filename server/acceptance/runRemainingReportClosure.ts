import fs from 'node:fs';
import path from 'node:path';
import { deliverableArtifactService } from '../cpaOrganization/deliverableArtifactService.js';
import { loadPersistedAdjudicationLineage } from '../cpaOrganization/verifiedCustomerContinuationService.js';

type ClosureProfile = {
  workspaceId: string;
  engagementId: string;
  reportId: string;
  clientName: string;
  documentIds: string[];
  includeAdjudication: boolean;
};

const PROFILES: Record<string, ClosureProfile> = {
  E_NORTH: {
    workspaceId: 'ws-1789679549908',
    engagementId: 'eng-customer-f200796a99bb46df',
    reportId: 'REP-ACCEPTANCE-E-NORTH',
    clientName: 'Orion North Isolation 3',
    documentIds: ['doc-1789679552078-rlpw'],
    includeAdjudication: false,
  },
  E_SOUTH: {
    workspaceId: 'ws-1789679552138',
    engagementId: 'eng-customer-c4be0362faab32d7',
    reportId: 'REP-ACCEPTANCE-E-SOUTH',
    clientName: 'Orion South Isolation 3',
    documentIds: ['doc-1789679554150-3fkf'],
    includeAdjudication: false,
  },
  D: {
    workspaceId: 'ws-1789683370090',
    engagementId: 'eng-customer-ed50a8f9244d2b0b',
    reportId: 'REP-ACCEPTANCE-D-ADJUDICATION',
    clientName: 'Cascade Works LLC — Synthetic Acceptance',
    documentIds: [
      'doc-1789683360026-j33y',
      'doc-1789683360208-v5bq',
      'doc-1789690494546-kat7',
    ],
    includeAdjudication: true,
  },
};

function storageFile(): string {
  return process.env.STORAGE_FILE || process.env.AI_CPA_STORAGE_FILE || path.join(process.cwd(), 'storage', 'ai_cpa_storage.json');
}

function mapFact(fact: any, document: any) {
  return {
    ...fact,
    canonicalMetric: fact.canonicalMetric || fact.factType || fact.labelNormalized || fact.labelOriginal,
    label: fact.labelNormalized || fact.labelOriginal || fact.canonicalMetric,
    value: Number(fact.normalizedValue ?? fact.valueFunctional ?? fact.valueOriginal),
    statement: fact.statementType || 'BOOKKEEPING_EVIDENCE_SCHEDULE',
    sourceDoc: document.originalName || document.filename,
    page: fact.pageNumber || fact.page,
    verificationStatus: fact.verificationStatus || fact.verification_state || 'PROPOSED',
    evidenceStatus: fact.evidenceStatus || 'CONFIRMED',
    factState: fact.status || 'PROPOSED',
    documentId: fact.documentId,
    reportingPeriod: fact.reportingPeriod || fact.periodEnd || fact.periodStart,
    sourceBlockIds: fact.sourceBlockIds || (fact.sourceBlockId ? [fact.sourceBlockId] : []),
    sourceExtractionMethod: fact.sourceExtractionMethod || fact.extractionMethod || fact.sourceCoordinate?.extractionMethod,
    sourceExtractionVersion: fact.sourceExtractionVersion || fact.sourceCoordinate?.extractionVersion,
  };
}

async function main() {
  if (process.env.TEST_QUEUE_AUTHORITY !== 'true') {
    throw new Error('ACCEPTANCE_REPORT_CLOSURE_DISABLED');
  }
  const key = String(process.argv[2] || '').toUpperCase();
  const profile = PROFILES[key];
  if (!profile) throw new Error(`UNKNOWN_CLOSURE_PROFILE:${key}`);
  const db = JSON.parse(fs.readFileSync(storageFile(), 'utf8'));
  const documents = db.documents.filter((document: any) => profile.documentIds.includes(document.id) && document.workspaceId === profile.workspaceId);
  if (documents.length !== profile.documentIds.length) throw new Error('PROFILE_DOCUMENT_SET_INCOMPLETE');
  const documentById = new Map(documents.map((document: any) => [document.id, document]));
  const persistedFacts = db.facts.filter((fact: any) =>
    profile.documentIds.includes(fact.documentId) &&
    (fact.workspaceId === profile.workspaceId || fact.project_id === profile.workspaceId) &&
    fact.sourceSha256 &&
    (fact.sourceCoordinate || (Array.isArray(fact.sourceCoordinates) && fact.sourceCoordinates.length > 0))
  );
  if (!persistedFacts.length) throw new Error('PROFILE_HAS_NO_LINEAGE_COMPLETE_FACTS');
  const facts = persistedFacts.map((fact: any) => mapFact(fact, documentById.get(fact.documentId)));
  const adjudicationLineage = profile.includeAdjudication
    ? loadPersistedAdjudicationLineage(profile.workspaceId, db.facts.filter((fact: any) => fact.workspaceId === profile.workspaceId || fact.project_id === profile.workspaceId))
    : undefined;
  if (profile.includeAdjudication && !adjudicationLineage) throw new Error('ADJUDICATION_LINEAGE_NOT_FOUND');
  const params = {
    reportId: profile.reportId,
    engagementId: profile.engagementId,
    workspaceId: profile.workspaceId,
    version: 'v1.0',
    title: `${profile.clientName} Evidence Review Package`,
    deliverableType: profile.includeAdjudication ? 'CONFLICT_ADJUDICATION_REVIEW' : 'TENANT_ISOLATION_EVIDENCE_REVIEW',
    audience: 'AUTHORIZED_REVIEW',
    clientName: profile.clientName,
    period: key === 'D' ? 'FY 2028' : 'FY 2026',
    currency: 'USD',
    status: 'AI_PREPARED',
    partnerName: 'READY_FOR_AUTHORIZED_HUMAN_REVIEW',
    requireFinalLineage: true,
    facts,
    adjudicationLineage,
  } as const;
  const first = await deliverableArtifactService.compileAndRegisterDeliverable(params);
  const second = await deliverableArtifactService.compileAndRegisterDeliverable(params);
  const canonical = deliverableArtifactService.getArtifacts(profile.engagementId)
    .filter((artifact) => artifact.reportId === profile.reportId && artifact.version === 'v1.0');
  if (canonical.length !== 1) throw new Error(`DUPLICATE_CANONICAL_REPORT:${canonical.length}`);
  console.log(JSON.stringify({
    profile: key,
    workspaceId: profile.workspaceId,
    engagementId: profile.engagementId,
    reportId: second.reportId,
    version: second.version,
    status: second.status,
    facts: facts.length,
    documentIds: profile.documentIds,
    sourceShas: [...new Set(facts.map((fact: any) => fact.sourceSha256))],
    canonicalRecords: canonical.length,
    firstArtifactHashes: Object.fromEntries(Object.entries(first.formats).map(([format, value]: [string, any]) => [format, value?.sha256])),
    finalArtifactHashes: Object.fromEntries(Object.entries(second.formats).map(([format, value]: [string, any]) => [format, value?.sha256])),
    files: Object.fromEntries(Object.entries(second.formats).map(([format, value]: [string, any]) => [format, value?.filepath])),
    adjudicationDecisionId: adjudicationLineage?.finalDecisionId || null,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
