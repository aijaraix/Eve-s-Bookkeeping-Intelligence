import fs from "fs";
import { applyPrimaryStatementAuthority } from "../hybridExtraction/HybridExtractionOrchestrator.js";
import { CanonicalFactResolver } from "../canonicalFactResolver.js";

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }

const candidates: any[] = [
  { rowLabel: "Total assets", rawValue: "213396", currency: "USD", period: "2024-12-31", statementType: "CONSOLIDATED_BALANCE_SHEET", physicalPage: 53, confidence: .99, sourceQuote: "Total assets $ 213,396 $ 226,501" },
  { rowLabel: "Total assets", rawValue: "226501", currency: "EUR", period: "2023-12-31", statementType: "CONSOLIDATED_BALANCE_SHEET", physicalPage: 53, confidence: .99, sourceQuote: "Total assets $ 213,396 $ 226,501" }
];
const fixed = applyPrimaryStatementAuthority(candidates as any, { statementType: "CONSOLIDATED_BALANCE_SHEET", reportingEntity: "Pfizer Inc." }, "USD", "USD", "Pfizer Inc.");
assert(fixed.every(f => f.currency === "USD"), "authoritative primary reporting currency must override inconsistent row currency");
assert(fixed.every(f => f.reportingScope === "CONSOLIDATED"), "consolidated statement scope must be authoritative");
assert(fixed.every(f => f.reportingEntity === "Pfizer Inc."), "missing reporting entity must inherit authoritative statement issuer");
const entityPresented = applyPrimaryStatementAuthority(candidates as any, { statementType: "BALANCE_SHEET", reportingEntity: "Synthetic Entity LLC" }, "USD", "USD", "Synthetic Entity LLC");
assert(entityPresented.every(f => f.reportingScope === "ENTITY_AS_PRESENTED"), "identified entity statements must carry bounded entity-as-presented scope");
const unidentified = applyPrimaryStatementAuthority(candidates as any, { statementType: "BALANCE_SHEET" }, "USD", "USD");
assert(unidentified.every(f => !f.reportingScope), "scope must remain unresolved without an identified reporting entity");
const promoted = CanonicalFactResolver.promotePrimaryStatementFacts(entityPresented.map((f, index) => ({
  ...f,
  id: `scope-proof-${index}`,
  workspaceId: "ws-scope-proof",
  documentId: "doc-scope-proof",
  labelOriginal: f.rowLabel,
  labelNormalized: f.rowLabel,
  canonicalMetric: "total_assets",
  valueOriginal: f.rawValue,
  valueFunctional: Number(f.rawValue),
  normalizedValue: Number(f.rawValue),
  currencyOriginal: f.currency,
  functionalCurrency: f.currency,
  reportingPeriod: f.period,
  pageNumber: f.physicalPage,
  sourceText: f.sourceQuote,
  evidenceStatus: "CONFIRMED",
  status: "approved",
  verificationStatus: "EVIDENCE_CONFIRMED"
})) as any);
assert(promoted.every(f => f.status === "APPROVED" && f.verificationStatus === "VERIFIED"), "confirmed entity-as-presented facts must reach proof-complete technical eligibility");
const src = fs.readFileSync("server/backgroundQueue.ts", "utf8");
assert(src.includes("hybridRes.documentMap?.primaryReportingCurrency"), "queue must bind resolved document-map currency into job state");
const server = fs.readFileSync("server.ts", "utf8");
assert(server.includes("ws.currency = resolvedWorkspaceCurrency"), "workspace currency must follow resolved reporting currency");
assert(server.includes("doc.currency = resolvedWorkspaceCurrency"), "document currency must follow resolved reporting currency");
console.log("✓ Company 1 authoritative primary-statement currency tests passed");
