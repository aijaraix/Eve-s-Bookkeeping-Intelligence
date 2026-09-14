import fs from "fs";
import { CanonicalFactResolver } from "../canonicalFactResolver.js";

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }

const confirmed: any = {
  id: "fact-confirmed", workspaceId: "ws", documentId: "doc",
  status: "approved", verificationStatus: "EVIDENCE_CONFIRMED",
  statementType: "CONSOLIDATED_INCOME_STATEMENT", reportingScope: "CONSOLIDATED_GROUP",
  labelOriginal: "Total revenues", canonicalMetric: "revenue",
  currency: "USD", functionalCurrency: "USD", reportingPeriod: "2024-FY",
  pageNumber: 51, sourceText: "Total revenues $ 63,627", normalizedValue: 63627000000
};
const promoted = CanonicalFactResolver.promotePrimaryStatementFacts([confirmed]);
assert(promoted.length === 1, "confirmed primary fact should survive promotion");
assert(String(promoted[0].status).toLowerCase() === "approved", "confirmed primary fact should promote to approved");
assert(String(promoted[0].verificationStatus).toUpperCase() === "VERIFIED", "confirmed primary fact should become VERIFIED only after canonical gates");

const src = fs.readFileSync("server/hybridExtraction/HybridExtractionOrchestrator.ts", "utf8");
assert(src.includes("reportingScope: c.reportingScope"), "hybrid fact must preserve reporting scope");
assert(src.includes("const evidenceEligibleFacts = rawFactList.filter"), "hybrid pipeline must have explicit evidence eligibility gate");
assert(src.includes("const reviewRequiredFacts = rawFactList.filter"), "review-required facts must remain separate from promotion candidates");
assert(src.includes("validateWorkspace(params.workspaceId, verifiedCanonicalFacts)"), "accounting validation must consume verified canonical facts only");
assert(src.includes("factsCanonicalCount: verifiedCanonicalFacts.length"), "canonical count must count verified canonical facts only");
console.log("✓ Company 1 canonical evidence-promotion integrity tests passed");
