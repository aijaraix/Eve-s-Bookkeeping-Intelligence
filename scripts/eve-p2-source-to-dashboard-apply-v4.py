#!/usr/bin/env python3
from pathlib import Path
import runpy
runpy.run_path('scripts/eve-p2-source-to-dashboard-apply-v3.py', run_name='__main__')

p=Path('src/utils/renderRegistry.ts'); text=p.read_text()
old="""  private renders: Map<string, RenderEntry> = new Map();
  private derivedCalculations: Map<string, DerivedCalculationLineage> = new Map();
  private currencyConversions: Map<string, CurrencyDisplayLineage> = new Map();
"""
new="""  private renders: Map<string, RenderEntry> = new Map();
  private renderIdentityIndex: Map<string, string> = new Map();
  private derivedCalculations: Map<string, DerivedCalculationLineage> = new Map();
  private currencyConversions: Map<string, CurrencyDisplayLineage> = new Map();
"""
if old not in text: raise SystemExit('RENDER_MAP_ANCHOR_MISSING')
text=text.replace(old,new,1)
old="""  public registerRender(entry: Omit<RenderEntry, 'renderId' | 'renderTimestamp'>): string {
    const renderId = `RND-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fullEntry: RenderEntry = {
      ...entry,
      renderId,
      renderTimestamp: new Date().toISOString()
    };
    this.renders.set(renderId, fullEntry);
    return renderId;
  }
"""
new="""  public registerRender(entry: Omit<RenderEntry, 'renderId' | 'renderTimestamp'>): string {
    // React may recompute presentation adapters many times while opening drawers or
    // changing local UI state. The same physical presentation must keep one render
    // identity so reverse-render lineage does not go stale merely because of a rerender.
    // A material presentation change (value, verification state, route/widget, period,
    // currency, source fact or derivation) intentionally creates a new identity.
    const identityKey = JSON.stringify([
      entry.route, entry.screen, entry.component, entry.widget,
      entry.factLineageId, entry.canonicalFactId || '', entry.derivedCalculationId || '',
      entry.entityId, entry.period, entry.currency, entry.displayScale,
      entry.displayValue, entry.normalizedBaseValue ?? null, entry.verificationState
    ]);
    const existingId = this.renderIdentityIndex.get(identityKey);
    if (existingId && this.renders.has(existingId)) return existingId;

    const renderId = `RND-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fullEntry: RenderEntry = {
      ...entry,
      renderId,
      renderTimestamp: new Date().toISOString()
    };
    this.renders.set(renderId, fullEntry);
    this.renderIdentityIndex.set(identityKey, renderId);
    return renderId;
  }
"""
if old not in text: raise SystemExit('REGISTER_RENDER_ANCHOR_MISSING')
text=text.replace(old,new,1)
old="""  public clear() {
    this.renders.clear();
    this.derivedCalculations.clear();
    this.currencyConversions.clear();
  }
"""
new="""  public clear() {
    this.renders.clear();
    this.renderIdentityIndex.clear();
    this.derivedCalculations.clear();
    this.currencyConversions.clear();
  }
"""
if old not in text: raise SystemExit('RENDER_CLEAR_ANCHOR_MISSING')
text=text.replace(old,new,1); p.write_text(text)

p=Path('server/tests/sourceToDashboardPresentationIntegrity.test.ts'); text=p.read_text()
old="""assert.equal(renderRegistry.getRender(net.renderId)?.verificationState,'REVIEW_REQUIRED');
const proof="""
new="""assert.equal(renderRegistry.getRender(net.renderId)?.verificationState,'REVIEW_REQUIRED');
const rerendered=adaptFactsToIncomeStatement([spreadsheet,receipt,tampered],'FY 2026','USD');
const rerenderByFact=(id:string)=>rerendered.find((l:any)=>l.factLineageId===id) as any;
assert.equal(rerenderByFact(SOURCE_DASHBOARD_SPREADSHEET_FACT_ID).renderId,rev.renderId,'same spreadsheet presentation must keep stable render lineage');
assert.equal(rerenderByFact(SOURCE_DASHBOARD_RECEIPT_FACT_ID).renderId,sga.renderId,'same receipt presentation must keep stable render lineage');
assert.equal(rerenderByFact(SOURCE_DASHBOARD_TAMPERED_FACT_ID).renderId,net.renderId,'same review-required presentation must keep stable render lineage');
const proof="""
if old not in text: raise SystemExit('PRESENTATION_STABILITY_TEST_ANCHOR_MISSING')
p.write_text(text.replace(old,new,1))
print('SOURCE_TO_DASHBOARD_PATCH_V4_APPLIED')
