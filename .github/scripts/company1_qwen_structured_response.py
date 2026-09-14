from pathlib import Path

p = Path('server/cpaOrganization/cpaModelRouter.ts')
s = p.read_text()
old = "...(params.jsonMode ? { format: 'json' } : {})"
new = "...(params.jsonMode ? { format: 'json', think: false } : {})"
if old not in s:
    raise SystemExit('Qwen JSON mode anchor missing')
s = s.replace(old, new, 1)
p.write_text(s)

p = Path('server/cpaOrganization/verifiedCustomerContinuationService.ts')
s = p.read_text()
old = "export const VERIFIED_CONTINUATION_LOGIC_VERSION = 'v3-structured-agent-contracts';"
new = "export const VERIFIED_CONTINUATION_LOGIC_VERSION = 'v4-qwen-response-channel';"
if old not in s:
    raise SystemExit('continuation logic version anchor missing')
p.write_text(s.replace(old, new, 1))

p = Path('server/tests/company1VerifiedContinuation.test.ts')
t = p.read_text()
old = "assert(VERIFIED_CONTINUATION_LOGIC_VERSION === 'v3-structured-agent-contracts', 'continuation logic must be versioned so prior terminal evaluations can be safely reconsidered');"
new = "assert(VERIFIED_CONTINUATION_LOGIC_VERSION === 'v4-qwen-response-channel', 'continuation logic must be versioned so prior terminal evaluations can be safely reconsidered');"
if old not in t:
    raise SystemExit('test version anchor missing')
t = t.replace(old, new, 1)
old = "assert(routerSource.includes(\"format: 'json'\"), 'Ollama specialist calls must request JSON output');"
new = "assert(routerSource.includes(\"format: 'json', think: false\"), 'Ollama specialist calls must request JSON output in the response channel with thinking disabled');"
if old not in t:
    raise SystemExit('Qwen static test anchor missing')
t = t.replace(old, new, 1)
p.write_text(t)
