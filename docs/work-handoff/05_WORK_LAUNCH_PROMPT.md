# EVE BOOKKEEPING — WORK LAUNCH PROMPT

Use the following as the launch instruction in ChatGPT Work with Codex and Astra Ultra reasoning:

---

Continue the existing Eve Bookkeeping implementation. Do not restart or redesign the project.

Repository: `aijaraix/Eve-s-Bookkeeping-Intelligence`

First fetch CURRENT remote state and read every file in `docs/work-handoff/` in numeric order, beginning with `00_EVE_WORK_MASTER_DIRECTIVE.md`. The SHA recorded in those documents is a handoff baseline only. Preserve any legitimate newer work.

Your objective is to get the currently authorized Eve Bookkeeping production scope across the finish line with the least possible owner intervention.

Use Codex as the implementation and physical-verification engineer. Establish current source/runtime truth before making changes; reconcile Git versus deployed state; inspect and reuse existing infrastructure, integrations, secret references, databases, persistent storage, queues, workers, Hermes, OpenClaw and model services; repair proven gaps; deploy safely where authorized; and perform the physical acceptance specified in the handoff package.

Use Astra Ultra as an independent adversarial acceptance authority. Astra must attempt to falsify READY and independently inspect the evidence for deployment identity, persistence, scheduler/queue/worker integrity, real-model execution, Company 1 continuity, professional-review gates, restart survival, observability and owner-facing usability. A green test suite or healthy service alone is not sufficient.

Do not ask the owner to redo configuration, reconnect services, recreate credentials, paste secrets, or repeat setup unless you first prove the existing authorized path cannot be reused and the action meets the OWNER-ONLY policy. Do not expose secrets. Do not create duplicate infrastructure for convenience. Do not erase prior evidence. Do not arm broader autonomy or Academy merely to pass acceptance. Do not represent AI-prepared work as licensed CPA certification without required human professional approval.

Continue through agent-remediable failures instead of stopping. Interrupt the owner only for a genuine owner-only approval defined in `04_OWNER_APPROVAL_AND_FINAL_HANDOFF.md`. When approval is unavoidable, ask for the smallest exact action and resume from the same checkpoint afterward.

Finish only when Astra has independently evaluated the full acceptance matrix. Final status must be exactly one of:

`EVE_BOOKKEEPING_READY_FOR_OWNER_HANDOFF`

or

`EVE_BOOKKEEPING_NOT_READY`

If NOT READY, distinguish owner-only blockers from agent-remediable blockers and do not stop while agent-remediable blockers remain within available authority.

---