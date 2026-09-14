import fs from "fs";
import path from "path";
import crypto from "crypto";
import { isProofCompleteFact, selectProofCompleteFacts, deriveFiscalYear, deriveCurrentBalance, buildVerifiedFactDigest, VERIFIED_CONTINUATION_LOGIC_VERSION } from "../cpaOrganization/verifiedCustomerContinuationService.js";
import { academyMinervaLab } from "../cpaOrganization/academyMinervaLab.js";

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
assert(VERIFIED_CONTINUATION_LOGIC_VERSION === 'v2-balance-period-aliases', 'continuation logic must be versioned so prior terminal evaluations can be safely reconsidered');
assert(buildVerifiedFactDigest(proof).every(f => f.verificationStatus === "VERIFIED" && f.evidenceStatus === "CONFIRMED"), "fact digest must retain proof lineage");

const deliverable = fs.readFileSync("server/cpaOrganization/deliverableArtifactService.ts", "utf8");
for (const forbidden of ["CLEARED_CONCURRING_PARTNER", "CRYPTOGRAPHICALLY_VERIFIED", "CPA-PCAOB-982410", "Eve Autonomous CPA Firm"]) {
  assert(!deliverable.includes(forbidden), `deliverable service must not contain legacy false claim: ${forbidden}`);
}
assert(deliverable.includes("ALL_ARTIFACT_HASHES_VERIFIED"), "artifact manifest must describe binary integrity, not professional verification");
assert(deliverable.includes("humanPartnerSignOff: 'PENDING'"), "deliverable must preserve pending human sign-off");

const hermes = fs.readFileSync("server/cpaOrganization/hermesJobDispatchService.ts", "utf8");
assert(hermes.includes("verifiedFacts?: Array<Record<string, any>>"), "Hermes swarm must accept actual verified fact digest");
assert(hermes.includes("verifiedFacts: params.verifiedFacts || []"), "real model contexts must receive verified facts, not counts alone");
assert(hermes.includes("evidenceConfirmedFactsCount: verifiedFactCount"), "Veritas must report evidence-confirmed count");

const server = fs.readFileSync("server.ts", "utf8");
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
