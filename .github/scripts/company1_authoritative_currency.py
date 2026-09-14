from pathlib import Path
import json

p = Path('server/hybridExtraction/HybridExtractionOrchestrator.ts')
s = p.read_text()
anchor = "export interface HybridExtractionResult {\n"
helper = """export function applyPrimaryStatementAuthority(
  candidates: StatementFactCandidate[],
  statement: any,
  documentMapCurrency?: string,
  fallbackCurrency?: string,
  documentIssuer?: string
): StatementFactCandidate[] {
  const statementType = String(statement?.statementType || '');
  const authoritativeCurrency = String(statement?.currency || documentMapCurrency || fallbackCurrency || '').trim().toUpperCase();
  const authoritativeScope = statement?.scope ||
    (statementType.startsWith('CONSOLIDATED_') ? 'CONSOLIDATED' :
      (statementType.startsWith('PARENT_COMPANY_') ? 'STANDALONE' : undefined));
  const authoritativeEntity = statement?.reportingEntity || documentIssuer;

  return candidates.map(candidate => ({
    ...candidate,
    ...(authoritativeCurrency ? { currency: authoritativeCurrency } : {}),
    ...(authoritativeScope ? { reportingScope: authoritativeScope } : {}),
    ...(!candidate.reportingEntity && authoritativeEntity ? { reportingEntity: authoritativeEntity } : {})
  }));
}

"""
if helper.strip() not in s:
    if anchor not in s:
        raise SystemExit('Hybrid result interface anchor missing')
    s = s.replace(anchor, helper + anchor, 1)
old = """          allExtractedCandidates.push(...candidates);
          semanticTaskManager.updateTaskStatus(stmtTask.taskId, 'COMPLETED', { factsProduced: candidates.length });"""
new = """          const authoritativeCandidates = applyPrimaryStatementAuthority(
            candidates,
            statement,
            currencyFromMap,
            params.currency,
            docMap.documentIssuer
          );
          allExtractedCandidates.push(...authoritativeCandidates);
          semanticTaskManager.updateTaskStatus(stmtTask.taskId, 'COMPLETED', { factsProduced: authoritativeCandidates.length });"""
if old not in s:
    raise SystemExit('primary candidate append anchor missing')
s = s.replace(old, new, 1)
p.write_text(s)

q = Path('server/backgroundQueue.ts')
s = q.read_text()
old = """        if (hybridRes.success) {
          const canonicalFacts = hybridRes.canonicalFacts.map(f => ({"""
new = """        if (hybridRes.success) {
          const resolvedReportingCurrency = String(
            hybridRes.documentMap?.primaryReportingCurrency ||
            hybridRes.documentMap?.currencies?.[0] ||
            queuedJob.functionalCurrency ||
            ''
          ).trim().toUpperCase();
          if (resolvedReportingCurrency) {
            queuedJob.functionalCurrency = resolvedReportingCurrency;
          }

          const canonicalFacts = hybridRes.canonicalFacts.map(f => ({"""
if old not in s:
    raise SystemExit('hybrid success anchor missing')
s = s.replace(old, new, 1)
q.write_text(s)

srv = Path('server.ts')
s = srv.read_text()
old = """    const ws = db.workspaces.find(w => w.id === job.workspaceId);
    const wsCurrency = ws?.currency || \"EUR\";

    job.result.facts.forEach((f: any) => {"""
new = """    const ws = db.workspaces.find(w => w.id === job.workspaceId);
    const resolvedWorkspaceCurrency = String(job.functionalCurrency || ws?.currency || '').trim().toUpperCase();
    if (ws && resolvedWorkspaceCurrency) {
      ws.currency = resolvedWorkspaceCurrency;
    }
    const wsCurrency = resolvedWorkspaceCurrency || ws?.currency || '';

    job.result.facts.forEach((f: any) => {"""
if old not in s:
    raise SystemExit('workspace currency anchor missing')
s = s.replace(old, new, 1)
old = """      doc.status = \"Completed\";
      if ((job as any).pagesTotal) doc.pageCount = (job as any).pagesTotal;"""
new = """      doc.status = \"Completed\";
      if (resolvedWorkspaceCurrency) doc.currency = resolvedWorkspaceCurrency;
      if ((job as any).pagesTotal) doc.pageCount = (job as any).pagesTotal;"""
if old not in s:
    raise SystemExit('document currency anchor missing')
s = s.replace(old, new, 1)
srv.write_text(s)

test = Path('server/tests/company1AuthoritativeCurrency.test.ts')
test.write_text('''import fs from "fs";\nimport { applyPrimaryStatementAuthority } from "../hybridExtraction/HybridExtractionOrchestrator.js";\n\nfunction assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }\n\nconst candidates: any[] = [\n  { rowLabel: "Total assets", rawValue: "213396", currency: "USD", period: "2024-12-31", statementType: "CONSOLIDATED_BALANCE_SHEET", physicalPage: 53, confidence: .99, sourceQuote: "Total assets $ 213,396 $ 226,501" },\n  { rowLabel: "Total assets", rawValue: "226501", currency: "EUR", period: "2023-12-31", statementType: "CONSOLIDATED_BALANCE_SHEET", physicalPage: 53, confidence: .99, sourceQuote: "Total assets $ 213,396 $ 226,501" }\n];\nconst fixed = applyPrimaryStatementAuthority(candidates as any, { statementType: "CONSOLIDATED_BALANCE_SHEET", reportingEntity: "Pfizer Inc." }, "USD", "USD", "Pfizer Inc.");\nassert(fixed.every(f => f.currency === "USD"), "authoritative primary reporting currency must override inconsistent row currency");\nassert(fixed.every(f => f.reportingScope === "CONSOLIDATED"), "consolidated statement scope must be authoritative");\nassert(fixed.every(f => f.reportingEntity === "Pfizer Inc."), "missing reporting entity must inherit authoritative statement issuer");\nconst src = fs.readFileSync("server/backgroundQueue.ts", "utf8");\nassert(src.includes("hybridRes.documentMap?.primaryReportingCurrency"), "queue must bind resolved document-map currency into job state");\nconst server = fs.readFileSync("server.ts", "utf8");\nassert(server.includes("ws.currency = resolvedWorkspaceCurrency"), "workspace currency must follow resolved reporting currency");\nassert(server.includes("doc.currency = resolvedWorkspaceCurrency"), "document currency must follow resolved reporting currency");\nconsole.log("✓ Company 1 authoritative primary-statement currency tests passed");\n''')

pkg = json.loads(Path('package.json').read_text())
marker = 'tsx server/tests/company1AuthoritativeCurrency.test.ts'
if marker not in pkg['scripts']['test']:
    pkg['scripts']['test'] += ' && ' + marker
Path('package.json').write_text(json.dumps(pkg, indent=2) + '\n')
