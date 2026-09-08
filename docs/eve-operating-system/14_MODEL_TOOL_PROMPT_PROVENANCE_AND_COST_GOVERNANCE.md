# 14 — Model, Tool and Prompt Provenance; Cost Governance

## Purpose
Eve must be able to explain not only what evidence supports a conclusion, but what computation, model, tool and prompt/template produced the interpretation.

## Execution provenance
For every non-trivial model/tool execution persist:
- executionId
- tenant/project/engagement scope
- task type
- agent
- tool/service
- requested model
- actual model
- model/provider version where available
- deterministic vs local vs cloud tier
- prompt/template ID and version (not secrets)
- input reference IDs, not duplicated raw evidence where avoidable
- output object IDs
- start/end/latency
- token counts when available
- cost estimate/actual cost
- success/failure/fallback
- policy decision allowing the route

## Prompt governance
Prompts/templates used for accounting interpretation should be versioned artifacts with purpose, required output schema, allowed evidence scope and test cases. Do not let ad-hoc prompt text become untraceable production logic.

## Tool registry
Maintain capabilities and limits for parsers, OCR, XBRL, spreadsheet engine, browser, local Qwen, cloud models and deterministic accounting engines. Selection should be capability-based, not hardcoded provider assumptions.

## Cheapest reliable tier
Use deterministic parsers/math first, then local models, then cloud reasoning only when needed. Cost optimization must never justify evidence loss or unsupported conclusions.

## Cloud-data minimization
Send only necessary scoped evidence to cloud models. Record classification/policy decision. Never send secrets or unrelated customer context.

## Fallback truth
If a requested model fails and a fallback completes the task, the audit must report the actual fallback used. Routing decisions are not inference calls.

## Reproducibility
A later auditor should be able to determine why the same source may have produced a changed interpretation after a model/tool upgrade.

## Acceptance
No material AI-generated accounting assertion should exist without traceable model/tool execution provenance or an explicit deterministic rule ID.
