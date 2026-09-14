from pathlib import Path

# ---------------------------------------------------------------------------
# Workload-aware Lexicon routing. Small XBRL inventories stay on local Qwen;
# large real filings use cloud reasoning so semantic review does not fail merely
# because a 4B local model exceeds the bounded request window.
# ---------------------------------------------------------------------------
p = Path('server/cpaOrganization/hermesJobDispatchService.ts')
s = p.read_text()

anchor = "export interface SwarmExecutionSummary {"
if anchor not in s:
    raise SystemExit('Lexicon routing function insertion anchor missing')
helper = """export function selectLexiconSemanticTaskType(uniqueConcepts: number, customExtensions: number): 'ENTITY_MAPPING' | 'COMPLEX_POLICY_ANALYSIS' {\n  return customExtensions > 50 || uniqueConcepts > 500 ? 'COMPLEX_POLICY_ANALYSIS' : 'ENTITY_MAPPING';\n}\n\n"""
s = s.replace(anchor, helper + anchor, 1)

old = """        const customConcepts = Array.isArray(params.taxonomyMetrics?.customConcepts) ? params.taxonomyMetrics.customConcepts : [];

        // LEXICON is a REAL_AI_AGENT: always invoke authentic model runtime
        const lexiconReceipt = await executeRealAgentWork({"""
new = """        const customConcepts = Array.isArray(params.taxonomyMetrics?.customConcepts) ? params.taxonomyMetrics.customConcepts : [];
        const lexiconTaskType = selectLexiconSemanticTaskType(uniqueConcepts, customExts);
        const lexiconTier = lexiconTaskType === 'COMPLEX_POLICY_ANALYSIS' ? 'LEVEL_3_HEAVY_CLOUD' : 'LEVEL_1_LOCAL_QWEN';

        // LEXICON is a REAL_AI_AGENT: invoke an authentic model runtime. Preserve local-first
        // execution for smaller inventories, but route large physical XBRL inventories to
        // cloud reasoning instead of timing out the local 4B model.
        const lexiconReceipt = await executeRealAgentWork({"""
if old not in s:
    raise SystemExit('Lexicon workload setup anchor missing')
s = s.replace(old, new, 1)

old = """          taskType: 'ENTITY_MAPPING',
          systemPrompt: 'You are Lexicon, XBRL Taxonomy & Footnote Semantic Alignment Specialist. Evaluate the supplied physical XBRL taxonomy inventory. Do not invent counts or concepts.',
          userPrompt: `Perform semantic taxonomy anchor analysis for ${params.clientName}. Taxonomy version: ${taxonomyVersion}. Unique concepts: ${uniqueConcepts}, dimension contexts: ${dimContexts}, custom extensions: ${customExts}. The supplied customConcepts list is complete; customExtensionsEvaluated must equal ${customExts}.`,"""
new = """          taskType: lexiconTaskType,
          systemPrompt: 'You are Lexicon, XBRL Taxonomy & Footnote Semantic Alignment Specialist. Evaluate the supplied physical XBRL taxonomy inventory. Do not invent counts or concepts. The physical custom extension inventory is authoritative.',
          userPrompt: `Perform semantic taxonomy anchor analysis for ${params.clientName}. Taxonomy version: ${taxonomyVersion}. Unique concepts: ${uniqueConcepts}, dimension contexts: ${dimContexts}, custom extensions: ${customExts}. The supplied customConcepts list is complete; customExtensionsEvaluated must equal ${customExts}. Workload route: ${lexiconTaskType}.`,"""
if old not in s:
    raise SystemExit('Lexicon task type anchor missing')
s = s.replace(old, new, 1)

# Replace three hard-coded Lexicon provenance tiers: unavailable, invalid output, validated output.
old = "tier: 'LEVEL_1_LOCAL_QWEN',"
count = s.count(old)
if count < 3:
    raise SystemExit(f'expected at least 3 Lexicon tier anchors, found {count}')
# Restrict replacements to the LEXICON case only.
start = s.index("      case 'LEXICON': {")
end = s.index("      case 'QUINN': {", start)
prefix, block, suffix = s[:start], s[start:end], s[end:]
block_count = block.count(old)
if block_count != 3:
    raise SystemExit(f'expected exactly 3 Lexicon tier anchors in case block, found {block_count}')
block = block.replace(old, 'tier: lexiconTier,')
s = prefix + block + suffix
p.write_text(s)

# ---------------------------------------------------------------------------
# Advance downstream logic version. Same completed Pfizer Attempt 9 may rerun
# CPA specialist/review work, but intake/extraction/canonical facts remain intact.
# ---------------------------------------------------------------------------
p = Path('server/cpaOrganization/verifiedCustomerContinuationService.ts')
s = p.read_text()
old = "export const VERIFIED_CONTINUATION_LOGIC_VERSION = 'v5-disclosure-evidence-ledger';"
new = "export const VERIFIED_CONTINUATION_LOGIC_VERSION = 'v6-lexicon-workload-routing';"
if old not in s:
    raise SystemExit('continuation version anchor missing')
p.write_text(s.replace(old, new, 1))

# ---------------------------------------------------------------------------
# Targeted regression: both sides of the routing threshold must remain explicit.
# ---------------------------------------------------------------------------
p = Path('server/tests/company1VerifiedContinuation.test.ts')
t = p.read_text()
old = 'import { isProofCompleteFact, selectProofCompleteFacts, deriveFiscalYear, deriveCurrentBalance, buildVerifiedFactDigest, VERIFIED_CONTINUATION_LOGIC_VERSION } from "../cpaOrganization/verifiedCustomerContinuationService.js";'
new = old + '\nimport { selectLexiconSemanticTaskType } from "../cpaOrganization/hermesJobDispatchService.js";'
if old not in t:
    raise SystemExit('test continuation import anchor missing')
t = t.replace(old, new, 1)

old = "assert(VERIFIED_CONTINUATION_LOGIC_VERSION === 'v5-disclosure-evidence-ledger', 'continuation logic must be versioned so prior terminal evaluations can be safely reconsidered');"
new = """assert(VERIFIED_CONTINUATION_LOGIC_VERSION === 'v6-lexicon-workload-routing', 'continuation logic must be versioned so prior terminal evaluations can be safely reconsidered');
assert(selectLexiconSemanticTaskType(200, 20) === 'ENTITY_MAPPING', 'small XBRL inventories must remain local-first on the entity-mapping route');
assert(selectLexiconSemanticTaskType(500, 50) === 'ENTITY_MAPPING', 'threshold-sized XBRL inventories must remain local-first');
assert(selectLexiconSemanticTaskType(501, 50) === 'COMPLEX_POLICY_ANALYSIS', 'large concept inventories must escalate to cloud semantic analysis');
assert(selectLexiconSemanticTaskType(200, 51) === 'COMPLEX_POLICY_ANALYSIS', 'large custom-extension inventories must escalate to cloud semantic analysis');
assert(selectLexiconSemanticTaskType(839, 166) === 'COMPLEX_POLICY_ANALYSIS', 'physical Pfizer-scale XBRL inventory must use the heavy cloud route');"""
if old not in t:
    raise SystemExit('test v6 version anchor missing')
t = t.replace(old, new, 1)

static_anchor = "assert(routerSource.includes(\"format: 'json', think: false\"), 'Ollama specialist calls must request JSON output in the response channel with thinking disabled');"
if static_anchor not in t:
    raise SystemExit('routing static test anchor missing')
t = t.replace(static_anchor, static_anchor + "\nassert(fs.readFileSync(\"server/cpaOrganization/hermesJobDispatchService.ts\", \"utf8\").includes(\"const lexiconTaskType = selectLexiconSemanticTaskType(uniqueConcepts, customExts)\"), 'Lexicon runtime must apply workload-aware semantic routing');", 1)
p.write_text(t)
