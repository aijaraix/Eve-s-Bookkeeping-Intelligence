/**
 * EVE AUTONOMOUS CPA ORGANIZATION — RENDER REGISTRY & UNIVERSAL FACT LINEAGE
 * 
 * Implements machine-readable UI traceability for Phase H.9.13:
 * - SOURCE → FACT → CANONICAL → RENDER traceability.
 * - Machine-readable invisible DOM attributes:
 *   data-fact-lineage-id, data-canonical-fact-id, data-entity-id,
 *   data-period-id, data-currency, data-verification-state, data-derivation-id.
 * - Derived value calculations and operand lineage.
 * - Multi-currency FX conversion lineage.
 * - Bidirectional source-to-render and render-to-source traceability.
 */

export interface RenderEntry {
  renderId: string;
  route: string;
  screen: string;
  component: string;
  widget: string;
  factLineageId: string;
  canonicalFactId?: string;
  derivedCalculationId?: string;
  entityId: string;
  period: string;
  currency: string;
  displayScale: string;
  displayValue: string;
  normalizedBaseValue?: number;
  verificationState: 'CONFIRMED' | 'VERIFIED' | 'PROPOSED' | 'REVIEW_REQUIRED' | 'UNCONFIRMED';
  renderTimestamp: string;
}

export interface DerivedCalculationLineage {
  derivedCalculationId: string;
  metric: string;
  formula: string;
  operandFactIds: string[];
  operandValues: Record<string, number>;
  result: number | string;
  timestamp: string;
}

export interface CurrencyDisplayLineage {
  sourceFactId: string;
  sourceCurrency: string;
  targetCurrency: string;
  fxRate: number;
  fxRateSource: string;
  fxDate: string;
  conversionFormula: string;
  convertedBaseValue: number;
  displayValue: string;
}

export function generateFactLineageId(fact: {
  id?: string;
  canonicalMetric?: string;
  metric?: string;
  period?: string;
  entityId?: string;
}): string {
  const metric = (fact.canonicalMetric || fact.metric || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const period = (fact.period || 'current')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const entity = (fact.entityId || 'group')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  return `FLID-${metric}-${period}-${entity}`;
}

export function getRenderLineageAttributes(entry: {
  factLineageId?: string;
  canonicalFactId?: string;
  entityId?: string;
  period?: string;
  currency?: string;
  verificationState?: string;
  derivedCalculationId?: string;
}): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (entry.factLineageId) attrs['data-fact-lineage-id'] = entry.factLineageId;
  if (entry.canonicalFactId) attrs['data-canonical-fact-id'] = entry.canonicalFactId;
  if (entry.entityId) attrs['data-entity-id'] = entry.entityId;
  if (entry.period) attrs['data-period-id'] = entry.period;
  if (entry.currency) attrs['data-currency'] = entry.currency;
  if (entry.verificationState) attrs['data-verification-state'] = entry.verificationState;
  if (entry.derivedCalculationId) attrs['data-derivation-id'] = entry.derivedCalculationId;
  return attrs;
}

export class RenderRegistry {
  private static instance: RenderRegistry | null = null;
  private renders: Map<string, RenderEntry> = new Map();
  private derivedCalculations: Map<string, DerivedCalculationLineage> = new Map();
  private currencyConversions: Map<string, CurrencyDisplayLineage> = new Map();

  private constructor() {}

  public static getInstance(): RenderRegistry {
    if (!RenderRegistry.instance) {
      RenderRegistry.instance = new RenderRegistry();
    }
    return RenderRegistry.instance;
  }

  public registerRender(entry: Omit<RenderEntry, 'renderId' | 'renderTimestamp'>): string {
    const renderId = `RND-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fullEntry: RenderEntry = {
      ...entry,
      renderId,
      renderTimestamp: new Date().toISOString()
    };
    this.renders.set(renderId, fullEntry);
    return renderId;
  }

  public registerDerivedCalculation(calculation: DerivedCalculationLineage) {
    this.derivedCalculations.set(calculation.derivedCalculationId, calculation);
  }

  public registerCurrencyConversion(conversion: CurrencyDisplayLineage) {
    const key = `${conversion.sourceFactId}:${conversion.targetCurrency}`;
    this.currencyConversions.set(key, conversion);
  }

  public getRender(renderId: string): RenderEntry | undefined {
    return this.renders.get(renderId);
  }

  public getAllRenders(): RenderEntry[] {
    return Array.from(this.renders.values());
  }

  public getDerivedCalculation(id: string): DerivedCalculationLineage | undefined {
    return this.derivedCalculations.get(id);
  }

  public getAllDerivedCalculations(): DerivedCalculationLineage[] {
    return Array.from(this.derivedCalculations.values());
  }

  public getCurrencyConversion(sourceFactId: string, targetCurrency: string): CurrencyDisplayLineage | undefined {
    return this.currencyConversions.get(`${sourceFactId}:${targetCurrency}`);
  }

  /**
   * Source -> Render Trace:
   * Finds all rendered components, screens, and widgets that display or consume a given fact.
   */
  public traceSourceToRender(factLineageId: string): RenderEntry[] {
    return Array.from(this.renders.values()).filter(
      r => r.factLineageId === factLineageId || r.canonicalFactId === factLineageId
    );
  }

  /**
   * Render -> Source Trace:
   * Given a render ID or DOM element reference, returns the complete lineage back to canonical fact.
   */
  public traceRenderToSource(renderId: string): {
    render?: RenderEntry;
    derivedCalculation?: DerivedCalculationLineage;
    currencyConversion?: CurrencyDisplayLineage;
  } {
    const render = this.renders.get(renderId);
    if (!render) return {};

    const derivedCalculation = render.derivedCalculationId
      ? this.derivedCalculations.get(render.derivedCalculationId)
      : undefined;

    const currencyConversion = render.canonicalFactId
      ? this.currencyConversions.get(`${render.canonicalFactId}:${render.currency}`)
      : undefined;

    return {
      render,
      derivedCalculation,
      currencyConversion
    };
  }

  public clear() {
    this.renders.clear();
    this.derivedCalculations.clear();
    this.currencyConversions.clear();
  }
}

export const renderRegistry = RenderRegistry.getInstance();
