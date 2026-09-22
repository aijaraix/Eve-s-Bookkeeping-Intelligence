import fs from "fs";
import path from "path";
import crypto from "crypto";
import { isProofCompleteFact, selectProofCompleteFacts, deriveFiscalYear, deriveCurrentBalance, buildVerifiedFactDigest, VERIFIED_CONTINUATION_LOGIC_VERSION } from "../cpaOrganization/verifiedCustomerContinuationService.js";
import { academyMinervaLab } from "../cpaOrganization/academyMinervaLab.js";
import { buildDisclosureEvidenceLedger } from "../cpaOrganization/disclosureEvidenceLedgerService.js";
import { validateAthenaOutput, validateLexiconOutput } from "../cpaOrganization/agentOutputContractValidator.js";

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }

const base = { workspaceId: "ws", documentId: "doc", status: "approved", verificationStatus: "VERIFIED", evidenceStatus: "CONFIRMED", functionalCurrency: "USD", reportingScope: "CONSOLIDATED", statementType: "CONSOLIDATED_BALANCE_SHEET", reportingPeriod: "2024-12-31", sourceText: "source row", pageNumber: 53 };
const facts: any[] = [
  { ...base, id: "a", canonicalMetric: "totalAssets", labelOriginal: "Total assets", normalizedValue: 213396000000 },
  { ...base, id: "l", canonicalMetric: "totalLiabilities", labelOriginal: "Total liabilities", normalizedValue: 124899000000 },
  { ...base, id: "e", canonicalMetric: "totalEquity", labelOriginal: "Total equity", normalizedValue: 88497000000 },
  { ...base, id: "bad", canonicalMetric: "cash", normalizedValue: 100, evidenceStatus: "UNCONFIRMED" }
];
assert(isProofCompleteFact(facts[0]), "verified/evidence-confirmed fact must be proof complete");
assert(!isProofCompleteFact(facts[3]), "unconfirmed fact must fail proof-complete gate");
const proof = selectProofCompleteFacts(facts, "ws");
assert(proof.length === 3, "continuation must exclude review-required facts");
assert(deriveFiscalYear(proof) === "2024", "fiscal year must derive from persisted fact periods");
const bal = deriveCurrentBalance(proof, "2024");
assert(!!bal && bal.variance === 0, "verified Pfizer-class balance sheet must reconcile before continuation");

// Reproduce the physical Pfizer bug: comparative 2023 rows inherited 2024 statement
// context dates, while reportingPeriod correctly identifies the comparative date.
const pfizerLike: any[] = [
  { ...base, id: 'a24', canonicalMetric: 'assets', reportingPeriod: '2024-12-31', periodStart: '2024-01-01', periodEnd: '2024-12-31', normalizedValue: 213396000000 },
  { ...base, id: 'a23', canonicalMetric: 'assets', reportingPeriod: '2023-12-31', periodStart: '2024-01-01', periodEnd: '2024-12-31', normalizedValue: 226501000000 },
  { ...base, id: 'l24', canonicalMetric: 'liabilities', reportingPeriod: '2024-12-31', periodStart: '2024-01-01', periodEnd: '2024-12-31', normalizedValue: 124899000000 },
  { ...base, id: 'l23', canonicalMetric: 'liabilities', reportingPeriod: '2023-12-31', periodStart: '2024-01-01', periodEnd: '2024-12-31', normalizedValue: 137213000000 },
  { ...base, id: 'e24', canonicalMetric: 'stockholdersEquityIncludingPortionAttributableToNoncontrollingInterest', reportingPeriod: '2024-12-31', periodStart: '2024-01-01', periodEnd: '2024-12-31', normalizedValue: 88497000000 },
  { ...base, id: 'e23', canonicalMetric: 'stockholdersEquityIncludingPortionAttributableToNoncontrollingInterest', reportingPeriod: '2023-12-31', periodStart: '2024-01-01', periodEnd: '2024-12-31', normalizedValue: 89288000000 }
];
assert(deriveFiscalYear(pfizerLike) === '2024', 'current fiscal year must remain 2024');
const pfizerBalance = deriveCurrentBalance(pfizerLike, '2024');
assert(!!pfizerBalance, 'Pfizer canonical SEC aliases must produce a current-period balance');
assert(pfizerBalance!.assets === 213396000000 && pfizerBalance!.liabilities === 124899000000 && pfizerBalance!.equity === 88497000000, 'comparative 2023 rows must not contaminate the 2024 identity');
assert(pfizerBalance!.variance === 0, 'physical Pfizer 2024 balance sheet must reconcile exactly');
assert(VERIFIED_CONTINUATION_LOGIC_VERSION === 'v6-bounded-lexicon-review-package', 'continuation logic must be versioned so prior terminal evaluations can be safely reconsidered');
assert(buildVerifiedFactDigest(proof).every(f => f.verificationStatus === "VERIFIED" && f.evidenceStatus === "CONFIRMED"), "fact digest must retain proof lineage");

const disclosureHtml = `<html xmlns:ix="http://www.xbrl.org/2013/inlineXBRL" xmlns:xbrli="http://www.xbrl.org/2003/instance" xmlns:xbrldi="http://xbrl.org/2006/xbrldi">
<ix:nonFraction name="us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax" contextRef="c1">100</ix:nonFraction>
<ix:nonNumeric name="pfe:CustomDisclosureMetric" contextRef="c1">x</ix:nonNumeric>
<xbrli:context id="c1"><xbrli:scenario><xbrldi:explicitMember dimension="us-gaap:StatementBusinessSegmentsAxis">pfe:BiopharmaMember</xbrldi:explicitMember></xbrli:scenario></xbrli:context>
<a href="https://fasb.org/us-gaap/2024">taxonomy</a></html>`;
const disclosureHash = crypto.createHash('sha256').update(disclosureHtml).digest('hex');
const disclosureBlocks = [
  { source_block_id: 'SB-1', document_id: 'doc-disc', page_number: 1, section: 'Note 17', text_content: 'A. Segment Information' },
  { source_block_id: 'SB-2', document_id: 'doc-disc', page_number: 1, section: 'Note 17', text_content: 'We manage operations through three operating segments and the Chief Operating Decision Maker reviews Biopharma reportable segment information.' },
  { source_block_id: 'SB-3', document_id: 'doc-disc', page_number: 1, section: 'Revenue Recognition', text_content: 'Revenue Recognition includes Alliance revenues and Royalty revenues and remaining performance obligations.' },
  { source_block_id: 'SB-4', document_id: 'doc-disc', page_number: 1, section: 'Leases', text_content: 'Operating lease right-of-use assets and lease liabilities are recognized at commencement date.' }
];
const disclosureLedger = buildDisclosureEvidenceLedger({ documentId: 'doc-disc', sourceBytes: disclosureHtml, expectedSourceSha256: disclosureHash, sourceBlocks: disclosureBlocks });
assert(disclosureLedger.sourceSha256Match, 'disclosure evidence must be bound to the exact physical source hash');
assert(disclosureLedger.topicCounts.ASC_280_SEGMENTS > 0 && disclosureLedger.topicCounts.ASC_606_REVENUE > 0 && disclosureLedger.topicCounts.ASC_842_LEASES > 0, 'disclosure ledger must surface segment, revenue, and lease evidence separately');
assert(disclosureLedger.taxonomyMetrics.taxonomyVersion === '2024', 'physical XBRL taxonomy version must be derived from source bytes');
assert(disclosureLedger.taxonomyMetrics.uniqueConceptsCount === 2 && disclosureLedger.taxonomyMetrics.customExtensionsCount === 1, 'physical XBRL concept inventory must be measured rather than defaulted');
assert(disclosureLedger.taxonomyMetrics.dimensionContextsCount === 1 && disclosureLedger.taxonomyMetrics.dimensionMembersCount === 1, 'physical dimensional XBRL context metrics must be measured');
assert(disclosureLedger.records.every(r => r.classification === 'DERIVED_FROM_HASH_VERIFIED_SOURCE_BLOCK' && r.sourceBlockIds.length > 0), 'disclosure evidence must retain source-block lineage');
let disclosureHashRejected = false;
try { buildDisclosureEvidenceLedger({ documentId: 'doc-disc', sourceBytes: disclosureHtml + 'tamper', expectedSourceSha256: disclosureHash, sourceBlocks: disclosureBlocks }); } catch { disclosureHashRejected = true; }
assert(disclosureHashRejected, 'disclosure ledger must fail closed on physical source hash mismatch');
const allowedEvidence = disclosureLedger.records.map(r => r.evidenceId);
const athenaBase = {
  reviewStatus: 'TECHNICAL_REVIEW_COMPLETE_PENDING_HUMAN_APPROVAL', standardsEvaluated: ['ASC 280','ASC 606','ASC 842'],
  asc280SegmentCompliance: 'Evidence reviewed', asc606RevenueDisaggregation: 'Evidence reviewed', asc842LeaseDisclosures: 'Evidence reviewed',
  technicalSignOff: 'PENDING_HUMAN_APPROVAL', evidenceReferences: [allowedEvidence[0]], findings: [], uncertainties: []
};
assert(validateAthenaOutput(athenaBase, { allowedEvidenceReferences: allowedEvidence }).isValid, 'Athena may cite real disclosure evidence IDs supplied by the ledger');
assert(!validateAthenaOutput({ ...athenaBase, evidenceReferences: ['EVD-INVENTED'] }, { allowedEvidenceReferences: allowedEvidence }).isValid, 'Athena must fail closed on invented disclosure evidence references');
const lexiconValidation = validateLexiconOutput({ semanticAnchorStatus: 'REVIEWED', taxonomyVersion: '2024', customExtensionsEvaluated: 1, semanticAlignments: [], disposition: 'REVIEW_COMPLETE' }, { customExts: 1, requireCompleteCustomExtensionEvaluation: true });
assert(lexiconValidation.isValid, 'Lexicon may validate when its evaluated extension count matches the physical XBRL inventory');
assert(!validateLexiconOutput({ semanticAnchorStatus: 'REVIEWED', taxonomyVersion: '2024', customExtensionsEvaluated: 0, semanticAlignments: [], disposition: 'REVIEW_COMPLETE' }, { customExts: 1, requireCompleteCustomExtensionEvaluation: true }).isValid, 'Lexicon must fail closed when it does not evaluate the complete supplied extension inventory');

const deliverable = fs.readFileSync("server/cpaOrganization/deliverableArtifactService.ts", "utf8");
for (const forbidden of ["CLEARED_CONCURRING_PARTNER", "CRYPTOGRAPHICALLY_VERIFIED", "CPA-PCAOB-982410", "Eve Autonomous CPA Firm"]) {
  assert(!deliverable.includes(forbidden), `deliverable service must not contain legacy false claim: ${forbidden}`);
}
assert(deliverable.includes("ALL_ARTIFACT_HASHES_VERIFIED"), "artifact manifest must describe binary integrity, not professional verification");
assert(deliverable.includes("humanPartnerSignOff: 'PENDING'"), "deliverable must preserve pending human sign-off");

const adapterSource = fs.readFileSync("server/cpaOrganization/realAgentExecutionAdapter.ts", "utf8");
const routerSource = fs.readFileSync("server/cpaOrganization/cpaModelRouter.ts", "utf8");
assert(adapterSource.includes('AUTHORITATIVE_CONTEXT_JSON'), 'real-agent adapter must deliver authoritative context data to the physical model');
assert(adapterSource.includes('getRoleStructuredOutputInstruction'), 'real-agent adapter must attach role-specific structured output contracts');
assert(adapterSource.includes('requireRealModel: true'), 'REAL_AI_AGENT execution must require a physical model rather than deterministic substitution');
assert(routerSource.includes("responseMimeType: 'application/json'"), 'Gemini specialist calls must use provider-native JSON response mode');
assert(routerSource.includes("format: 'json', think: false"), 'Ollama specialist calls must request JSON output in the response channel with thinking disabled');
const continuationSourceForDisclosure = fs.readFileSync("server/cpaOrganization/verifiedCustomerContinuationService.ts", "utf8");
assert(continuationSourceForDisclosure.includes('disclosureEvidenceLedgerService.buildAndPersist'), 'continuation must build a hash-bound disclosure evidence ledger from the existing source');
assert(continuationSourceForDisclosure.includes('sourceBlocks: Array.isArray(db?.sourceBlocks)'), 'disclosure evidence must derive from persisted source blocks rather than manufactured note facts');
assert(continuationSourceForDisclosure.includes('prior?.logicVersion === VERIFIED_CONTINUATION_LOGIC_VERSION && prior?.deliverable?.reportId'), 'deliverable reuse must be scoped to the current continuation logic version');
assert(routerSource.includes('boundedOllamaGenerate') && routerSource.includes('num_predict'), 'local model must use a whole-response deadline and finite output budget');
assert(routerSource.includes("? 'CUSTOMER_PRIORITY' : 'SYNTHETIC_ACADEMY'"), 'production specialist model events must be classified as customer-priority work');

const hermes = fs.readFileSync("server/cpaOrganization/hermesJobDispatchService.ts", "utf8");
assert(hermes.includes("verifiedFacts?: Array<Record<string, any>>"), "Hermes swarm must accept actual verified fact digest");
assert(hermes.includes("verifiedFacts: params.verifiedFacts || []"), "real model contexts must receive verified facts, not counts alone");
assert(hermes.includes("evidenceConfirmedFactsCount: verifiedFactCount"), "Veritas must report evidence-confirmed count");

const server = fs.readFileSync("server.ts", "utf8");
assert(server.includes('unitScale: f.unitScale') && server.includes('normalizedScaleMultiplier: f.normalizedScaleMultiplier'), 'durable fact persistence must retain source scale authority for deliverables');
assert(server.includes("runtimeAuthorityManifestManager.isLeader()"), "continuation sweep must be leader-only");
assert(server.includes("continueCompletedHybridJob(job, db)"), "completed hybrid jobs must flow into verified continuation");
const continuationSource = fs.readFileSync("server/cpaOrganization/verifiedCustomerContinuationService.ts", "utf8");
assert(continuationSource.includes("state.logicVersion !== VERIFIED_CONTINUATION_LOGIC_VERSION"), "terminal continuation state must be version-scoped");

const tmp = path.join('/tmp', `eve-minerva-${Date.now()}.txt`);
fs.writeFileSync(tmp, 'authoritative source');
const sha = crypto.createHash('sha256').update(fs.readFileSync(tmp)).digest('hex');
const good = academyMinervaLab.evaluateLiveEngagement({ facts: proof, assets: 213396000000, liabilities: 124899000000, equity: 88497000000, variance: 0, physicalFilePath: tmp, physicalSha256: sha });
assert(good.certifiedStatus === 'TECHNICAL_VALIDATION_PASSED', 'Minerva live validation should pass proof-complete balanced facts with authentic source hash');
const bad = academyMinervaLab.evaluateLiveEngagement({ facts: [facts[3]], assets: 213396000000, liabilities: 124899000000, equity: 88497000000, variance: 0, physicalFilePath: tmp, physicalSha256: sha });
assert(bad.certifiedStatus !== 'TECHNICAL_VALIDATION_PASSED', 'Minerva must fail closed on unconfirmed fact evidence');
fs.unlinkSync(tmp);
console.log('✓ Company 1 verified customer continuation tests passed');
