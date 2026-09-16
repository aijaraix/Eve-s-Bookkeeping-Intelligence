#!/usr/bin/env python3
from pathlib import Path
p=Path('server/tests/clientIsolationDeliverableTruth.test.ts')
t=p.read_text()
old="assert.equal(json.workspaceId,c.workspaceId);assert(!jsonText.includes(other.workspaceId));for(const x of otherShas)assert(!jsonText.includes(x));"
new="assert.equal(json.engagementId,c.engagementId);assert.equal(json.clientName,c.clientName);assert(!jsonText.includes(other.engagementId));assert(!jsonText.includes(other.clientName));for(const x of otherShas)assert(!jsonText.includes(x));"
if old not in t: raise SystemExit('CLIENT_ISOLATION_DELIVERABLE_FIX_TARGET_NOT_FOUND')
p.write_text(t.replace(old,new,1))
print('CLIENT_ISOLATION_JSON_CONTRACT_FIX=PASS')
