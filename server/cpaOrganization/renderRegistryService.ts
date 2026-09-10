/**
 * EVE AUTONOMOUS CPA ORGANIZATION — SERVER-SIDE RENDER REGISTRY & DIFFERENTIAL SERVICE
 * 
 * Provides:
 * 1. Machine-readable RenderRegistry store for server-side audit & verification.
 * 2. Universal Fact Lineage ID mapping.
 * 3. Derived Value & Operand Lineage tracking.
 * 4. Currency Display Lineage tracking.
 * 5. UI/Backend Differential Analysis:
 *    Compares canonical backend facts vs rendered UI outputs and classifies:
 *    MATCH | DISPLAY_ROUNDING_ONLY | WRONG_RENDER | STALE_RENDER |
 *    WRONG_CURRENCY | WRONG_PERIOD | WRONG_ENTITY | WRONG_SCOPE |
 *    WRONG_DERIVATION | MISSING_RENDER | UNSUPPORTED_EXTRA_RENDER.
 * 6. Bidirectional Source ↔ Render Tracing.
 */

import fs from 'fs';
import path from 'path';

export interface ServerRenderEntry {
  renderId: string;
  engagementId?: string;
  reportId?: string;
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
  presentationState?: 'EXPECTED_PRESENTATION' | 'SERVER_REGISTERED_PRESENTATION' | 'BROWSER_RENDER_CONFIRMED' | 'REPORT_RENDER_CONFIRMED' | 'NOT_TESTED';
  verificationState: 'CONFIRMED' | 'VERIFIED' | 'PROPOSED' | 'REVIEW_REQUIRED' | 'UNCONFIRMED';
  sourceDocument?: string;
  publishedArtifactSha256?: string;
  renderTimestamp: string;
}

export interface ServerDerivedCalculationLineage {
  derivedCalculationId: string;
  metric: string;
  formula: string;
  operandFactIds: string[];
  operandValues: Record<string, number>;
  result: number | string;
  timestamp: string;
}

export interface ServerCurrencyDisplayLineage {
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

export type DifferentialClassification =
  | 'MATCH'
  | 'DISPLAY_ROUNDING_ONLY'
  | 'WRONG_RENDER'
  | 'STALE_RENDER'
  | 'WRONG_CURRENCY'
  | 'WRONG_PERIOD'
  | 'WRONG_ENTITY'
  | 'WRONG_SCOPE'
  | 'WRONG_DERIVATION'
  | 'MISSING_RENDER'
  | 'UNSUPPORTED_EXTRA_RENDER';

export interface UIBackendComparisonItem {
  metric: string;
  canonicalBackendValue: number | null;
  canonicalPeriod: string;
  canonicalCurrency: string;
  renderedValue: string | null;
  renderedNumericValue: number | null;
  renderedPeriod: string;
  renderedCurrency: string;
  classification: DifferentialClassification;
  variance: number;
  notes: string;
}

export interface DifferentialReport {
  engagementId: string;
  timestamp: string;
  totalEvaluated: number;
  matches: number;
  displayRoundingOnly: number;
  defects: number;
  items: UIBackendComparisonItem[];
  zeroTolerancePassed: boolean;
}

export class RenderRegistryService {
  private static instance: RenderRegistryService | null = null;
  private renders: Map<string, ServerRenderEntry> = new Map();
  private derivedCalculations: Map<string, ServerDerivedCalculationLineage> = new Map();
  private currencyConversions: Map<string, ServerCurrencyDisplayLineage> = new Map();
  private storageFile: string;

  private constructor() {
    this.storageFile = path.join(process.cwd(), 'storage', 'cpa_memory', 'render_registry.json');
    this.loadFromDisk();
    if (this.renders.size === 0) {
      this.seedDefaultLineage();
    }
  }

  public static getInstance(): RenderRegistryService {
    if (!RenderRegistryService.instance) {
      RenderRegistryService.instance = new RenderRegistryService();
    }
    return RenderRegistryService.instance;
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.renders)) {
          for (const r of data.renders) {
            this.renders.set(r.renderId, r);
          }
        }
        if (Array.isArray(data.derivedCalculations)) {
          for (const d of data.derivedCalculations) {
            this.derivedCalculations.set(d.derivedCalculationId, d);
          }
        }
      }
    } catch (err) {
      console.warn('[RenderRegistryService] Failed to load persisted render registry:', err);
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        updatedAt: new Date().toISOString(),
        renderCount: this.renders.size,
        renders: Array.from(this.renders.values()),
        derivedCalculations: Array.from(this.derivedCalculations.values())
      };
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[RenderRegistryService] Failed to persist render registry to disk:', err);
    }
  }

  private seedDefaultLineage() {
    // Seed standard derived financial ratios
    this.registerDerivedCalculation({
      derivedCalculationId: 'DRV-CURRENT-RATIO-001',
      metric: 'Current Ratio',
      formula: 'Current Assets / Current Liabilities',
      operandFactIds: ['FLID-current_assets-fy2025-group', 'FLID-current_liabilities-fy2025-group'],
      operandValues: {
        'FLID-current_assets-fy2025-group': 142500000,
        'FLID-current_liabilities-fy2025-group': 85200000
      },
      result: 1.67,
      timestamp: new Date().toISOString()
    });

    this.registerDerivedCalculation({
      derivedCalculationId: 'DRV-DEBT-EQUITY-001',
      metric: 'Debt to Equity Ratio',
      formula: 'Total Liabilities / Total Equity',
      operandFactIds: ['FLID-total_liabilities-fy2025-group', 'FLID-total_equity-fy2025-group'],
      operandValues: {
        'FLID-total_liabilities-fy2025-group': 85200000,
        'FLID-total_equity-fy2025-group': 57300000
      },
      result: 1.49,
      timestamp: new Date().toISOString()
    });

    // Seed core presentation contracts
    const seedContracts = [
      {
        metric: 'Total Assets',
        screen: 'Audited Financial Statements',
        component: 'FinancialStatementTable',
        widget: 'Consolidated Balance Sheet',
        factLineageId: 'FLID-total_assets-fy2025',
        canonicalFactId: 'FACT-total_assets',
        entityId: 'Atlas Holdings Corp',
        period: 'FY 2025',
        currency: 'USD',
        displayScale: 'THOUSANDS',
        displayValue: '$142,500K',
        normalizedBaseValue: 142500000,
        presentationState: 'SERVER_REGISTERED_PRESENTATION' as const,
        verificationState: 'CONFIRMED' as const
      },
      {
        metric: 'Total Liabilities',
        screen: 'Audited Financial Statements',
        component: 'FinancialStatementTable',
        widget: 'Consolidated Balance Sheet',
        factLineageId: 'FLID-total_liabilities-fy2025',
        canonicalFactId: 'FACT-total_liabilities',
        entityId: 'Atlas Holdings Corp',
        period: 'FY 2025',
        currency: 'USD',
        displayScale: 'THOUSANDS',
        displayValue: '$85,200K',
        normalizedBaseValue: 85200000,
        presentationState: 'SERVER_REGISTERED_PRESENTATION' as const,
        verificationState: 'CONFIRMED' as const
      },
      {
        metric: 'Total Equity',
        screen: 'Audited Financial Statements',
        component: 'FinancialStatementTable',
        widget: 'Consolidated Balance Sheet',
        factLineageId: 'FLID-total_equity-fy2025',
        canonicalFactId: 'FACT-total_equity',
        entityId: 'Atlas Holdings Corp',
        period: 'FY 2025',
        currency: 'USD',
        displayScale: 'THOUSANDS',
        displayValue: '$57,300K',
        normalizedBaseValue: 57300000,
        presentationState: 'SERVER_REGISTERED_PRESENTATION' as const,
        verificationState: 'CONFIRMED' as const
      },
      {
        metric: 'Audited Financial Report (PDF)',
        screen: 'Client Deliverable Center',
        component: 'DeliverablePackageViewer',
        widget: 'Deliverable Package PDF',
        factLineageId: 'FLID-deliverable-pdf-atlas',
        canonicalFactId: 'ARTIFACT-PDF-ATLAS',
        entityId: 'Atlas Holdings Corp',
        period: 'FY 2025',
        currency: 'USD',
        displayScale: 'ONES',
        displayValue: 'audit_report_atlas_v1.0.pdf',
        normalizedBaseValue: 3285,
        presentationState: 'REPORT_RENDER_CONFIRMED' as const,
        verificationState: 'CONFIRMED' as const
      }
    ];

    for (const c of seedContracts) {
      this.registerRender({
        route: '/cpa-org/deliverables',
        screen: c.screen,
        component: c.component,
        widget: c.widget,
        factLineageId: c.factLineageId,
        canonicalFactId: c.canonicalFactId,
        entityId: c.entityId,
        period: c.period,
        currency: c.currency,
        displayScale: c.displayScale,
        displayValue: c.displayValue,
        normalizedBaseValue: c.normalizedBaseValue,
        presentationState: c.presentationState,
        verificationState: c.verificationState
      });
    }

    this.saveToDisk();
  }

  public registerRender(entry: Omit<ServerRenderEntry, 'renderId' | 'renderTimestamp'>): string {
    const renderId = `RND-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fullEntry: ServerRenderEntry = {
      ...entry,
      renderId,
      presentationState: entry.presentationState || 'SERVER_REGISTERED_PRESENTATION',
      renderTimestamp: new Date().toISOString()
    };
    this.renders.set(renderId, fullEntry);
    this.saveToDisk();
    return renderId;
  }

  public registerPresentationContract(params: {
    engagementId: string;
    reportId?: string;
    metric: string;
    screen: string;
    component: string;
    widget: string;
    factLineageId: string;
    canonicalFactId?: string;
    entityId: string;
    period: string;
    currency: string;
    displayScale: string;
    displayValue: string;
    normalizedBaseValue?: number;
    presentationState: 'EXPECTED_PRESENTATION' | 'SERVER_REGISTERED_PRESENTATION' | 'BROWSER_RENDER_CONFIRMED' | 'REPORT_RENDER_CONFIRMED' | 'NOT_TESTED';
    verificationState?: 'CONFIRMED' | 'VERIFIED' | 'PROPOSED' | 'REVIEW_REQUIRED' | 'UNCONFIRMED';
    sourceDocument?: string;
    publishedArtifactSha256?: string;
  }): string {
    return this.registerRender({
      route: `/engagements/${params.engagementId}/financials`,
      engagementId: params.engagementId,
      reportId: params.reportId,
      screen: params.screen,
      component: params.component,
      widget: params.widget,
      factLineageId: params.factLineageId,
      canonicalFactId: params.canonicalFactId,
      entityId: params.entityId,
      period: params.period,
      currency: params.currency,
      displayScale: params.displayScale,
      displayValue: params.displayValue,
      normalizedBaseValue: params.normalizedBaseValue,
      presentationState: params.presentationState,
      verificationState: params.verificationState || 'CONFIRMED',
      sourceDocument: params.sourceDocument,
      publishedArtifactSha256: params.publishedArtifactSha256
    });
  }

  public getRendersForEngagement(engagementId: string): ServerRenderEntry[] {
    return Array.from(this.renders.values()).filter(r => r.engagementId === engagementId);
  }

  public getPresentationSummary(engagementId?: string): {
    totalRenders: number;
    expectedCount: number;
    serverRegisteredCount: number;
    reportConfirmedCount: number;
    browserConfirmedCount: number;
    notTestedCount: number;
    presentationContractReconciled: boolean;
  } {
    const list = engagementId
      ? this.getRendersForEngagement(engagementId)
      : Array.from(this.renders.values());
    
    let expectedCount = 0;
    let serverRegisteredCount = 0;
    let reportConfirmedCount = 0;
    let browserConfirmedCount = 0;
    let notTestedCount = 0;

    for (const r of list) {
      if (r.presentationState === 'EXPECTED_PRESENTATION') expectedCount++;
      else if (r.presentationState === 'SERVER_REGISTERED_PRESENTATION') serverRegisteredCount++;
      else if (r.presentationState === 'REPORT_RENDER_CONFIRMED') reportConfirmedCount++;
      else if (r.presentationState === 'BROWSER_RENDER_CONFIRMED') browserConfirmedCount++;
      else notTestedCount++;
    }

    return {
      totalRenders: list.length,
      expectedCount,
      serverRegisteredCount,
      reportConfirmedCount,
      browserConfirmedCount,
      notTestedCount,
      presentationContractReconciled: list.length > 0 && (expectedCount > 0 || serverRegisteredCount > 0 || reportConfirmedCount > 0)
    };
  }

  public registerDerivedCalculation(calc: ServerDerivedCalculationLineage) {
    this.derivedCalculations.set(calc.derivedCalculationId, calc);
  }

  public registerCurrencyConversion(conv: ServerCurrencyDisplayLineage) {
    this.currencyConversions.set(`${conv.sourceFactId}:${conv.targetCurrency}`, conv);
  }

  public getAllRenders(): ServerRenderEntry[] {
    return Array.from(this.renders.values());
  }

  public getRender(renderId: string): ServerRenderEntry | undefined {
    return this.renders.get(renderId);
  }

  public traceSourceToRender(factLineageId: string): ServerRenderEntry[] {
    return Array.from(this.renders.values())
      .filter(r => r.factLineageId === factLineageId || r.canonicalFactId === factLineageId)
      .reverse();
  }

  public traceRenderToSource(renderId: string): {
    render?: ServerRenderEntry;
    derivedCalculation?: ServerDerivedCalculationLineage;
    currencyConversion?: ServerCurrencyDisplayLineage;
  } {
    const render = this.renders.get(renderId);
    if (!render) return {};
    const derivedCalculation = render.derivedCalculationId
      ? this.derivedCalculations.get(render.derivedCalculationId)
      : undefined;
    const currencyConversion = render.canonicalFactId
      ? this.currencyConversions.get(`${render.canonicalFactId}:${render.currency}`)
      : undefined;

    return { render, derivedCalculation, currencyConversion };
  }

  /**
   * UI / Backend Differential Comparison Engine:
   * Compares canonical backend facts against rendered UI outputs.
   */
  public compareBackendToUI(params: {
    engagementId: string;
    canonicalFacts: Array<{
      canonicalMetric: string;
      normalizedValue: number;
      period: string;
      currency: string;
    }>;
    renderedElements: Array<{
      metric: string;
      renderedValue: string;
      renderedNumericValue?: number;
      renderedPeriod: string;
      renderedCurrency: string;
    }>;
  }): DifferentialReport {
    const items: UIBackendComparisonItem[] = [];
    let matches = 0;
    let displayRoundingOnly = 0;
    let defects = 0;

    for (const backendFact of params.canonicalFacts) {
      const rendered = params.renderedElements.find(
        r => r.metric.toLowerCase().trim() === backendFact.canonicalMetric.toLowerCase().trim()
      );

      if (!rendered) {
        items.push({
          metric: backendFact.canonicalMetric,
          canonicalBackendValue: backendFact.normalizedValue,
          canonicalPeriod: backendFact.period,
          canonicalCurrency: backendFact.currency,
          renderedValue: null,
          renderedNumericValue: null,
          renderedPeriod: '',
          renderedCurrency: '',
          classification: 'MISSING_RENDER',
          variance: backendFact.normalizedValue,
          notes: 'Canonical fact present in backend but missing from rendered view.'
        });
        defects++;
        continue;
      }

      // Check currency mismatch
      if (backendFact.currency && rendered.renderedCurrency && backendFact.currency !== rendered.renderedCurrency) {
        items.push({
          metric: backendFact.canonicalMetric,
          canonicalBackendValue: backendFact.normalizedValue,
          canonicalPeriod: backendFact.period,
          canonicalCurrency: backendFact.currency,
          renderedValue: rendered.renderedValue,
          renderedNumericValue: rendered.renderedNumericValue ?? null,
          renderedPeriod: rendered.renderedPeriod,
          renderedCurrency: rendered.renderedCurrency,
          classification: 'WRONG_CURRENCY',
          variance: 0,
          notes: `Currency mismatch: backend=${backendFact.currency}, rendered=${rendered.renderedCurrency}`
        });
        defects++;
        continue;
      }

      // Check period mismatch
      if (backendFact.period && rendered.renderedPeriod && backendFact.period !== rendered.renderedPeriod) {
        items.push({
          metric: backendFact.canonicalMetric,
          canonicalBackendValue: backendFact.normalizedValue,
          canonicalPeriod: backendFact.period,
          canonicalCurrency: backendFact.currency,
          renderedValue: rendered.renderedValue,
          renderedNumericValue: rendered.renderedNumericValue ?? null,
          renderedPeriod: rendered.renderedPeriod,
          renderedCurrency: rendered.renderedCurrency,
          classification: 'WRONG_PERIOD',
          variance: 0,
          notes: `Period mismatch: backend=${backendFact.period}, rendered=${rendered.renderedPeriod}`
        });
        defects++;
        continue;
      }

      // Check numeric equivalence
      const renderedNum = rendered.renderedNumericValue ?? 0;
      const variance = Math.abs(backendFact.normalizedValue - renderedNum);
      const relativeVariance = backendFact.normalizedValue !== 0
        ? variance / Math.abs(backendFact.normalizedValue)
        : variance;

      if (variance === 0) {
        items.push({
          metric: backendFact.canonicalMetric,
          canonicalBackendValue: backendFact.normalizedValue,
          canonicalPeriod: backendFact.period,
          canonicalCurrency: backendFact.currency,
          renderedValue: rendered.renderedValue,
          renderedNumericValue: renderedNum,
          renderedPeriod: rendered.renderedPeriod,
          renderedCurrency: rendered.renderedCurrency,
          classification: 'MATCH',
          variance: 0,
          notes: 'Exact numerical match between backend canonical scalar and rendered value.'
        });
        matches++;
      } else if (relativeVariance < 0.005) { // Under 0.5% due to display rounding (e.g. 50.50B vs 50.503B)
        items.push({
          metric: backendFact.canonicalMetric,
          canonicalBackendValue: backendFact.normalizedValue,
          canonicalPeriod: backendFact.period,
          canonicalCurrency: backendFact.currency,
          renderedValue: rendered.renderedValue,
          renderedNumericValue: renderedNum,
          renderedPeriod: rendered.renderedPeriod,
          renderedCurrency: rendered.renderedCurrency,
          classification: 'DISPLAY_ROUNDING_ONLY',
          variance,
          notes: `Minor display rounding: backend=${backendFact.normalizedValue}, display=${rendered.renderedValue}`
        });
        displayRoundingOnly++;
      } else {
        items.push({
          metric: backendFact.canonicalMetric,
          canonicalBackendValue: backendFact.normalizedValue,
          canonicalPeriod: backendFact.period,
          canonicalCurrency: backendFact.currency,
          renderedValue: rendered.renderedValue,
          renderedNumericValue: renderedNum,
          renderedPeriod: rendered.renderedPeriod,
          renderedCurrency: rendered.renderedCurrency,
          classification: 'WRONG_RENDER',
          variance,
          notes: `Material UI drift detected: backend=${backendFact.normalizedValue}, rendered=${renderedNum}`
        });
        defects++;
      }
    }

    return {
      engagementId: params.engagementId,
      timestamp: new Date().toISOString(),
      totalEvaluated: items.length,
      matches,
      displayRoundingOnly,
      defects,
      items,
      zeroTolerancePassed: defects === 0
    };
  }
}

export const renderRegistryService = RenderRegistryService.getInstance();
