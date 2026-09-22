import { renderRegistry } from '../utils/renderRegistry';
import { validatePresentationSourceIdentity } from '../lib/evidence/presentationSourceIdentity';
/**
 * EVE FRONTEND — authoritative presentation adapters.
 *
 * These adapters never invent source facts. They normalize the recorded period
 * and metric naming shapes used by the backend so already-persisted evidence can
 * be projected into the owner UI without re-running extraction.
 */

import {
  PracticeClientSummary,
  EngagementSummary,
  StatementLinePresentation,
  BalanceSheetIdentityCheck,
  RatioDerivationPresentation,
  NamedCpaAgentPresentation,
  OrganizationCategory
} from '../types/presentationModels';

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function extractFiscalYear(value: unknown): string | null {
  const text = String(value ?? '').trim();
  if (!text) return null;

  const fy = text.match(/\bFY\s*(20\d{2})\b/i);
  if (fy) return fy[1];

  const dateYears = [...text.matchAll(/\b(20\d{2})-\d{2}-\d{2}\b/g)].map(m => m[1]);
  if (dateYears.length) return dateYears[dateYears.length - 1];

  const year = text.match(/\b(20\d{2})\b/);
  return year ? year[1] : null;
}

export function matchesFiscalPeriod(f: any, period: string): boolean {
  if (!period || period === 'Period not recorded') return true;
  const source = f?.reportingPeriod || f?.periodOriginal || f?.fiscalYear || f?.period;
  const normalizedSource = String(source ?? '').replace(/^FY\s*/i, '').trim();
  const normalizedTarget = String(period ?? '').replace(/^FY\s*/i, '').trim();
  if (normalizedSource && normalizedSource === normalizedTarget) return true;

  const sourceYear = extractFiscalYear(source);
  const targetYear = extractFiscalYear(period);
  return Boolean(sourceYear && targetYear && sourceYear === targetYear);
}

function factMetricKeys(f: any): string[] {
  return [f?.canonicalMetric, f?.metric, f?.key, f?.labelNormalized, f?.labelOriginal]
    .map(normalizeText)
    .filter(Boolean);
}

function buildMetricMap(facts: any[]): Map<string, any> {
  const map = new Map<string, any>();
  for (const fact of facts) {
    for (const key of factMetricKeys(fact)) {
      if (!map.has(key)) map.set(key, fact);
    }
  }
  return map;
}

function findMetricFact(map: Map<string, any>, aliases: string[]): any | null {
  for (const alias of aliases.map(normalizeText)) {
    const exact = map.get(alias);
    if (exact) return exact;
  }
  return null;
}

function factNumber(fact: any): number | null {
  if (!fact) return null;
  const raw = fact.valueFunctional ?? fact.valueOriginal ?? fact.value;
  const num = typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
}

function factCurrency(fact: any, fallback: string): string {
  return fact?.functionalCurrency || fact?.currencyFunctional || fact?.currencyOriginal || fact?.currency || fallback;
}

function factScale(fact: any): string {
  return fact?.scale || fact?.scaleOriginal || fact?.unitScale || 'Source units';
}

function factSourceName(fact: any): string | undefined {
  return fact?.documentTitle || fact?.sourceDocument || fact?.documentName || fact?.documentId || undefined;
}

function factSourcePage(fact: any): number | undefined {
  const raw = fact?.pageNumber ?? fact?.page ?? fact?.sourcePage ?? fact?.extractorLocator;
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
}

function factSourceCoordinates(fact: any): any[] {
  const coordinates = fact?.sourceCoordinates || fact?.provenanceCoordinates || fact?.provenance?.provenanceCoordinates;
  if (Array.isArray(coordinates) && coordinates.length > 0) return coordinates;
  const single = fact?.sourceCoordinate || fact?.provenance?.sourceCoordinate;
  return single ? [single] : [];
}

function sourceCoordinateLabel(coordinate: any, sourcePage?: number): string | undefined {
  if (!coordinate) return sourcePage ? `Page ${sourcePage}` : undefined;
  if (coordinate.sourceType === 'SPREADSHEET') {
    const cell = coordinate.cellAddress || coordinate.rangeAddress || 'cell not recorded';
    return `${coordinate.sheetName || 'Sheet'}!${cell}`;
  }
  if (coordinate.sourceType === 'CSV') {
    return `Row ${coordinate.rowIndex}${coordinate.columnIndex ? ` · Column ${coordinate.columnIndex}` : ''}`;
  }
  if (coordinate.sourceType === 'PDF') return `Page ${coordinate.pageNumber}`;
  if (coordinate.sourceType === 'IMAGE') {
    const box = coordinate.boundingBox;
    const page = coordinate.pageNumber ? `Page ${coordinate.pageNumber} · ` : '';
    if (!box) return `${page}Image region`;
    const pct = (n: any) => `${(Number(n || 0) * 100).toFixed(1)}%`;
    return `${page}Image region x=${pct(box.x)} y=${pct(box.y)} w=${pct(box.width)} h=${pct(box.height)}`;
  }
  return sourcePage ? `Page ${sourcePage}` : coordinate.sourceType;
}

function makeLine(
  id: string,
  canonicalMetric: string,
  label: string,
  fact: any,
  value: number,
  period: string,
  currency: string,
  options: Partial<StatementLinePresentation> = {}
): StatementLinePresentation {
  const lineCurrency = factCurrency(fact, currency);
  const sourceIdentity = validatePresentationSourceIdentity(fact);
  const claimedVerificationStatus = String(fact?.verificationStatus || 'review_required').toLowerCase();
  const effectiveVerificationStatus = claimedVerificationStatus === 'verified' && !sourceIdentity.valid
    ? 'review_required'
    : claimedVerificationStatus;
  return {
    id,
    label: fact?.labelNormalized || fact?.labelOriginal || label,
    canonicalMetric,
    level: 1,
    values: { [period]: value },
    formattedValues: { [period]: formatFinancialValue(value, lineCurrency) },
    currency: lineCurrency,
    scale: factScale(fact),
    verificationStatus: effectiveVerificationStatus as StatementLinePresentation['verificationStatus'],
    sourceDocName: factSourceName(fact),
    sourcePage: factSourcePage(fact),
    sourceText: fact?.sourceText || fact?.rawText || fact?.provenance?.sourceText,
    sourceRawValue: fact?.valueOriginal ?? fact?.rawValue,
    sourceProvenanceId: fact?.sourceProvenanceId || fact?.provenance?.sourceProvenanceId,
    sourceCoordinates: factSourceCoordinates(fact),
    sourceCoordinate: factSourceCoordinates(fact)[0],
    sourceType: factSourceCoordinates(fact)[0]?.sourceType,
    sourceLocationLabel: sourceCoordinateLabel(factSourceCoordinates(fact)[0], factSourcePage(fact)),
    sourceFormula: factSourceCoordinates(fact)[0]?.formula,
    sourceConfidence: factSourceCoordinates(fact)[0]?.confidence,
    sourceExtractionMethod: factSourceCoordinates(fact)[0]?.extractionMethod,
    sourceExtractionVersion: factSourceCoordinates(fact)[0]?.extractionVersion,
    factLineageId: fact?.id,
    renderId: fact?.id ? renderRegistry.registerRender({
      route: id.startsWith('bs-') ? 'financials-balance' : 'financials-income', screen: 'Financial statements',
      component: 'EveFinancialTable', widget: id, factLineageId: fact.id, canonicalFactId: fact.id,
      entityId: fact.entityId || fact.workspaceId || '', period, currency: lineCurrency, displayScale: factScale(fact),
      displayValue: formatFinancialValue(value, lineCurrency), normalizedBaseValue: value,
      verificationState: effectiveVerificationStatus === 'verified' ? 'VERIFIED' : 'REVIEW_REQUIRED'
    }) : undefined,
    ...options
  };
}

function derivedLineage(metric: string, period: string, currency: string, operands: any[], values: number[], result: number, formula: string) {
  const operandFactIds = operands.map(f => f?.id);
  if (operandFactIds.some(id => !id)) return {};
  const derivedCalculationId = `DER-${metric}-${period}-${operandFactIds.join('-')}`;
  renderRegistry.registerDerivedCalculation({ derivedCalculationId, metric, formula, operandFactIds,
    operandValues: Object.fromEntries(operandFactIds.map((id, i) => [id, values[i]])), result, timestamp: new Date().toISOString() });
  const renderId = renderRegistry.registerRender({ route: metric === 'gross_profit' ? 'financials-income' : 'financials-balance',
    screen: 'Financial statements', component: 'EveFinancialTable', widget: metric, factLineageId: '', derivedCalculationId,
    entityId: operands[0]?.workspaceId || '', period, currency, displayScale: 'Source units',
    displayValue: formatFinancialValue(result, currency), normalizedBaseValue: result, verificationState: 'REVIEW_REQUIRED' });
  return { derivedCalculationId, operandFactIds, renderId };
}

export function formatFinancialValue(
  val: number | null | undefined,
  currency: string = 'USD',
  _scale: string = 'Source units'
): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  const sign = val < 0 ? '-' : '';
  const numStr = Math.abs(val).toLocaleString('en-US', { maximumFractionDigits: 6 });
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  return `${sign}${symbol}${numStr}`;
}

export function adaptUniversalEngagementsToClients(engagements: any[] = []): PracticeClientSummary[] {
  const clientMap = new Map<string, PracticeClientSummary>();
  engagements.forEach((eng) => {
    const clientId = eng.engagementId;
    if (!clientMap.has(clientId)) {
      let category: OrganizationCategory = 'REAL_CUSTOMER';
      if (eng.classification === 'CANARY' || eng.engagementId?.includes('canary')) category = 'TEST_FIXTURE';
      else if (eng.classification === 'ACADEMY' || !eng.isCustomer) category = 'ACADEMY_CASE';

      clientMap.set(clientId, {
        id: clientId,
        name: eng.clientName || 'Client Entity',
        legalName: eng.entityName || eng.clientName || 'Client Entity',
        jurisdiction: eng.jurisdiction || 'United States',
        industry: eng.industry || 'Commercial Enterprise',
        category,
        activeEngagementsCount: 1,
        latestPeriod: eng.period || 'Period not recorded',
        status: eng.currentStage === 'ENGAGEMENT_COMPLETE' ? 'Active' : 'Pending Review',
        openReviewItemsCount: eng.openReviewNotesCount || 0,
        lastActivity: eng.lastActivityAt || eng.startedAt || '',
        reportingCurrency: eng.functionalCurrency || 'USD'
      });
    } else {
      clientMap.get(clientId)!.activeEngagementsCount += 1;
    }
  });
  return Array.from(clientMap.values());
}

export function adaptWorkspacesToClients(workspaces: any[] = []): PracticeClientSummary[] {
  return workspaces.map((ws) => {
    const category: OrganizationCategory = ws.isCustomer === true ? 'REAL_CUSTOMER' : ws.classification === 'CANARY' ? 'TEST_FIXTURE' : 'ACADEMY_CASE';
    const clientName = ws.name || 'Unnamed Client';
    return {
      id: ws.id,
      name: clientName,
      legalName: clientName,
      jurisdiction: ws.jurisdiction || ws.country || 'Not recorded',
      industry: ws.industry || 'Enterprise',
      category,
      activeEngagementsCount: 1,
      latestPeriod: ws.period || ws.fiscalYear || 'Period not recorded',
      status: 'Active',
      openReviewItemsCount: ws.openReviewNotesCount || 0,
      lastActivity: ws.updatedAt || ws.createdAt || '',
      reportingCurrency: ws.currency || 'USD'
    };
  });
}

export function adaptUniversalToEngagementSummaries(engagements: any[] = []): EngagementSummary[] {
  return engagements.map((eng) => ({
    id: eng.engagementId,
    clientId: eng.engagementId,
    clientName: eng.clientName || 'Client Entity',
    name: eng.title || `${eng.period || 'Period not recorded'} Annual Audit & Attestation`,
    period: eng.period || 'Period not recorded',
    framework: eng.framework || 'US_GAAP',
    reportingCurrency: eng.functionalCurrency || 'USD',
    status: eng.currentStage === 'ENGAGEMENT_COMPLETE' ? 'Review Required' : (eng.openReviewNotesCount > 0 ? 'Review Required' : 'In Progress'),
    readinessState: eng.currentStage === 'ENGAGEMENT_COMPLETE' ? 'REVIEW_REQUIRED' : (eng.openReviewNotesCount > 0 ? 'REVIEW_REQUIRED' : 'DATA_VERIFICATION_REQUIRED'),
    openFindingsCount: eng.openReviewNotesCount || 0,
    documentsCount: eng.documentsCount || 0,
    factsCount: eng.canonicalFactsCount || 0,
    lastActivity: eng.lastActivityAt || eng.startedAt || '',
    nextAction: eng.currentStage === 'ENGAGEMENT_COMPLETE' ? 'Review draft and authorization requirements' : 'Continue audit verification'
  }));
}

export function adaptWorkspacesToEngagements(
  workspaces: any[] = [],
  _factsCount: number = 0,
  _docsCount: number = 0,
  findingsCount: number = 0
): EngagementSummary[] {
  return workspaces.map((ws) => ({
    id: ws.engagementId || ws.id,
    clientId: ws.id,
    clientName: ws.name || 'Client',
    name: `${ws.period || 'Period not recorded'} Annual Audit & Attestation`,
    period: ws.period || 'Period not recorded',
    framework: ws.reportingStandard || 'US_GAAP',
    reportingCurrency: ws.currency || 'USD',
    status: 'Review Required',
    readinessState: 'REVIEW_REQUIRED',
    openFindingsCount: ws.openReviewNotesCount ?? findingsCount,
    documentsCount: ws.documentsCount ?? 0,
    factsCount: ws.canonicalFactsCount ?? 0,
    lastActivity: ws.updatedAt || '',
    nextAction: 'Review source evidence and draft findings'
  }));
}

const REVENUE_ALIASES = ['revenue', 'total_revenue', 'total_revenues', 'revenues', 'sales'];
const COGS_ALIASES = ['cost_of_goods_sold', 'cost_of_revenue', 'cogs', 'cost_of_sales'];
const RD_ALIASES = ['research_and_development', 'research_and_development_expenses', 'r_and_d', 'rd_expense'];
const SGA_ALIASES = ['selling_general_and_administrative', 'selling_informational_and_administrative_expenses', 'sga', 'operating_expenses', 'sg_and_a'];
const OPERATING_INCOME_ALIASES = ['operating_income', 'operating_profit', 'ebit'];
const NET_INCOME_ALIASES = [
  'net_income',
  'net_profit',
  'profit_loss',
  'net_income_attributable_to_pfizer_inc_common_shareholders',
  'net_income_attributable_to_common_shareholders',
  'net_income_before_allocation_to_noncontrolling_interests'
];
const CASH_ALIASES = ['cash', 'cash_and_equivalents', 'cash_and_cash_equivalents', 'cash_and_cash_equivalents_at_carrying_value', 'liquid_funds'];
const ASSET_ALIASES = ['total_assets', 'assets'];
const LIABILITY_ALIASES = ['total_liabilities', 'liabilities'];
const EQUITY_ALIASES = [
  'total_equity',
  'stockholders_equity',
  'equity',
  'shareholders_equity',
  'stockholders_equity_including_portion_attributable_to_noncontrolling_interest'
];

export function adaptFactsToIncomeStatement(facts: any[] = [], period: string = 'Period not recorded', currency: string = 'USD'): StatementLinePresentation[] {
  const periodFacts = facts.filter(f => matchesFiscalPeriod(f, period));
  if (!periodFacts.length) return [];
  const map = buildMetricMap(periodFacts);
  const lines: StatementLinePresentation[] = [];

  const revFact = findMetricFact(map, REVENUE_ALIASES);
  const revVal = factNumber(revFact);
  if (revVal !== null) {
    lines.push({ id: 'is-header-rev', label: 'Operating Revenues', level: 0, isHeader: true, values: {}, formattedValues: {}, currency, scale: 'Source units', verificationStatus: 'review_required' });
    lines.push(makeLine('is-rev', 'revenue', 'Total Revenue', revFact, revVal, period, currency));
  }

  const cogsFact = findMetricFact(map, COGS_ALIASES);
  const cogsVal = factNumber(cogsFact);
  if (cogsVal !== null) lines.push(makeLine('is-cogs', 'cost_of_goods_sold', 'Cost of Sales', cogsFact, cogsVal, period, currency));

  const gpFact = findMetricFact(map, ['gross_profit', 'gross_margin']);
  const gpDirect = factNumber(gpFact);
  const grossProfit = gpDirect !== null ? gpDirect : (revVal !== null && cogsVal !== null ? revVal - cogsVal : null);
  if (grossProfit !== null) {
    lines.push(makeLine('is-gross-profit', 'gross_profit', 'Gross Profit / (Loss)', gpFact, grossProfit, period, currency, {
      isSubtotal: true,
      verificationStatus: gpDirect !== null ? 'review_required' : 'calculated',
      factLineageId: gpFact?.id,
      ...(gpDirect === null ? derivedLineage('gross_profit', period, currency, [revFact, cogsFact], [revVal!, cogsVal!], grossProfit, 'revenue - cost_of_goods_sold') : {})
    }));
  }

  const rdFact = findMetricFact(map, RD_ALIASES);
  const rdVal = factNumber(rdFact);
  const sgaFact = findMetricFact(map, SGA_ALIASES);
  const sgaVal = factNumber(sgaFact);
  if (rdVal !== null || sgaVal !== null) {
    lines.push({ id: 'is-header-costs', label: 'Operating Expenses', level: 0, isHeader: true, values: {}, formattedValues: {}, currency, scale: 'Source units', verificationStatus: 'review_required' });
    if (rdVal !== null) lines.push(makeLine('is-rd', 'research_and_development', 'Research and Development', rdFact, rdVal, period, currency));
    if (sgaVal !== null) lines.push(makeLine('is-sga', 'selling_general_and_administrative', 'Selling, Informational and Administrative Expenses', sgaFact, sgaVal, period, currency));
  }

  const opFact = findMetricFact(map, OPERATING_INCOME_ALIASES);
  const opVal = factNumber(opFact);
  if (opVal !== null) lines.push(makeLine('is-op-income', 'operating_income', 'Operating Income / (EBIT)', opFact, opVal, period, currency, { isSubtotal: true }));

  const netFact = findMetricFact(map, NET_INCOME_ALIASES);
  const netVal = factNumber(netFact);
  if (netVal !== null) lines.push(makeLine('is-net-income', 'net_income', 'Net Income', netFact, netVal, period, currency, { level: 0, isTotal: true }));

  return lines;
}

export function adaptFactsToBalanceSheet(facts: any[] = [], period: string = 'Period not recorded', currency: string = 'USD'): {
  lines: StatementLinePresentation[];
  identityCheck: BalanceSheetIdentityCheck;
} {
  const periodFacts = facts.filter(f => matchesFiscalPeriod(f, period));
  if (!periodFacts.length) {
    return {
      lines: [],
      identityCheck: { totalAssets: null, totalLiabilities: null, totalEquity: null, variance: 0, currency, gateState: 'NOT_TESTABLE', operandsFound: { assets: false, liabilities: false, equity: false } }
    };
  }

  const map = buildMetricMap(periodFacts);
  const cashFact = findMetricFact(map, CASH_ALIASES);
  const assetsFact = findMetricFact(map, ASSET_ALIASES);
  const liabilitiesFact = findMetricFact(map, LIABILITY_ALIASES);
  const equityFact = findMetricFact(map, EQUITY_ALIASES);
  const cashVal = factNumber(cashFact);
  const totalAssetsVal = factNumber(assetsFact);
  const totalLiabVal = factNumber(liabilitiesFact);
  const totalEquityVal = factNumber(equityFact);
  const lines: StatementLinePresentation[] = [];

  if (cashVal !== null || totalAssetsVal !== null) {
    lines.push({ id: 'bs-header-assets', label: 'ASSETS', level: 0, isHeader: true, values: {}, formattedValues: {}, currency, scale: 'Source units', verificationStatus: 'review_required' });
    if (cashVal !== null) lines.push(makeLine('bs-cash', 'cash', 'Cash and Cash Equivalents', cashFact, cashVal, period, currency));
    if (totalAssetsVal !== null) lines.push(makeLine('bs-total-assets', 'total_assets', 'Total Assets', assetsFact, totalAssetsVal, period, currency, { level: 0, isTotal: true }));
  }

  if (totalLiabVal !== null || totalEquityVal !== null) {
    lines.push({ id: 'bs-header-liab', label: 'LIABILITIES AND STOCKHOLDERS EQUITY', level: 0, isHeader: true, values: {}, formattedValues: {}, currency, scale: 'Source units', verificationStatus: 'review_required' });
    if (totalLiabVal !== null) lines.push(makeLine('bs-total-liab', 'total_liabilities', 'Total Liabilities', liabilitiesFact, totalLiabVal, period, currency, { isSubtotal: true }));
    if (totalEquityVal !== null) lines.push(makeLine('bs-total-equity', 'total_equity', 'Total Stockholders Equity', equityFact, totalEquityVal, period, currency, { isSubtotal: true }));
    if (totalLiabVal !== null && totalEquityVal !== null) {
      const sum = totalLiabVal + totalEquityVal;
      lines.push({ ...derivedLineage('total_liabilities_and_equity', period, currency, [liabilitiesFact, equityFact], [totalLiabVal, totalEquityVal], sum, 'total_liabilities + total_equity'), id: 'bs-total-liab-equity', label: 'Total Liabilities and Stockholders Equity', canonicalMetric: 'total_liabilities_and_equity', level: 0, isTotal: true, values: { [period]: sum }, formattedValues: { [period]: formatFinancialValue(sum, currency) }, currency, scale: 'Source units', verificationStatus: 'calculated' });
    }
  }

  const hasAssets = totalAssetsVal !== null;
  const hasLiab = totalLiabVal !== null;
  const hasEquity = totalEquityVal !== null;
  let variance = 0;
  let gateState: BalanceSheetIdentityCheck['gateState'] = 'NOT_TESTABLE';
  if (hasAssets && hasLiab && hasEquity) {
    variance = totalAssetsVal! - (totalLiabVal! + totalEquityVal!);
    gateState = Math.abs(variance) < 1 ? 'PASS' : 'REVIEW_REQUIRED';
  }

  return {
    lines,
    identityCheck: {
      totalAssets: totalAssetsVal,
      totalLiabilities: totalLiabVal,
      totalEquity: totalEquityVal,
      variance,
      currency,
      gateState,
      operandsFound: { assets: hasAssets, liabilities: hasLiab, equity: hasEquity }
    }
  };
}

export function deriveFinancialRatios(facts: any[] = [], period: string = 'Period not recorded', currency: string = 'USD'): RatioDerivationPresentation[] {
  const periodFacts = facts.filter(f => matchesFiscalPeriod(f, period));
  if (!periodFacts.length) return [];
  const map = buildMetricMap(periodFacts);

  const revenueFact = findMetricFact(map, REVENUE_ALIASES);
  const netIncomeFact = findMetricFact(map, NET_INCOME_ALIASES);
  const operatingIncomeFact = findMetricFact(map, OPERATING_INCOME_ALIASES);
  const liabilitiesFact = findMetricFact(map, LIABILITY_ALIASES);
  const equityFact = findMetricFact(map, EQUITY_ALIASES);

  const revenue = factNumber(revenueFact);
  const netIncome = factNumber(netIncomeFact);
  const operatingIncome = factNumber(operatingIncomeFact);
  const liabilities = factNumber(liabilitiesFact);
  const equity = factNumber(equityFact);
  const ratios: RatioDerivationPresentation[] = [];

  if (revenue !== null && revenue > 0 && netIncome !== null) {
    const margin = (netIncome / revenue) * 100;
    ratios.push({ id: 'ratio-net-margin', name: 'Net Profit Margin', category: 'Profitability', value: margin, formattedValue: `${margin.toFixed(2)}%`, formulaDescription: 'Net Income / Total Revenue', numeratorMetric: 'net_income', numeratorValue: netIncome, numeratorLabel: 'Net Income', denominatorMetric: 'revenue', denominatorValue: revenue, denominatorLabel: 'Total Revenue', period, benchmark: '> 20.0%', status: margin >= 20 ? 'Normal' : 'Monitor', derivedCalculationId: 'calc-net-margin', currency });
  }

  if (revenue !== null && revenue > 0 && operatingIncome !== null) {
    const margin = (operatingIncome / revenue) * 100;
    ratios.push({ id: 'ratio-op-margin', name: 'Operating Margin', category: 'Profitability', value: margin, formattedValue: `${margin.toFixed(2)}%`, formulaDescription: 'Operating Income / Total Revenue', numeratorMetric: 'operating_income', numeratorValue: operatingIncome, numeratorLabel: 'Operating Income', denominatorMetric: 'revenue', denominatorValue: revenue, denominatorLabel: 'Total Revenue', period, benchmark: '> 25.0%', status: margin >= 25 ? 'Normal' : 'Monitor', derivedCalculationId: 'calc-op-margin', currency });
  }

  if (netIncome !== null && equity !== null && equity > 0) {
    const roe = (netIncome / equity) * 100;
    ratios.push({ id: 'ratio-roe', name: 'Return on Equity (ROE)', category: 'Profitability', value: roe, formattedValue: `${roe.toFixed(2)}%`, formulaDescription: 'Net Income / Total Stockholders Equity', numeratorMetric: 'net_income', numeratorValue: netIncome, numeratorLabel: 'Net Income', denominatorMetric: 'total_equity', denominatorValue: equity, denominatorLabel: 'Total Equity', period, benchmark: '> 15.0%', status: roe >= 15 ? 'Normal' : 'Monitor', derivedCalculationId: 'calc-roe', currency });
  }

  if (liabilities !== null && equity !== null && equity > 0) {
    const debtToEquity = liabilities / equity;
    ratios.push({ id: 'ratio-debt-equity', name: 'Debt-to-Equity Ratio', category: 'Solvency', value: debtToEquity, formattedValue: debtToEquity.toFixed(2), formulaDescription: 'Total Liabilities / Total Stockholders Equity', numeratorMetric: 'total_liabilities', numeratorValue: liabilities, numeratorLabel: 'Total Liabilities', denominatorMetric: 'total_equity', denominatorValue: equity, denominatorLabel: 'Total Equity', period, benchmark: '< 1.50', status: debtToEquity < 1.5 ? 'Normal' : 'Monitor', derivedCalculationId: 'calc-debt-equity', currency });
  }

  return ratios;
}

export function adaptBackendAgents(rawAgents: any[] = []): NamedCpaAgentPresentation[] {
  const colors: Record<string, string> = {
    HERMES: 'bg-indigo-600', ATHENA: 'bg-amber-600', LEDGER: 'bg-emerald-600', ATLAS: 'bg-teal-600', MERCURY: 'bg-blue-600', EUCLID: 'bg-cyan-600', VERITAS: 'bg-violet-600', ARGUS: 'bg-rose-600', SCRIBE: 'bg-fuchsia-600', LEXICON: 'bg-sky-600', SENTINEL: 'bg-red-600', DARWIN: 'bg-orange-600', MINERVA: 'bg-purple-600', CLARA: 'bg-pink-600', QUINN: 'bg-emerald-700'
  };
  return rawAgents.map((a) => {
    const callsign = (a.name || a.id || '').toUpperCase();
    return {
      id: a.id || callsign.toLowerCase(),
      name: a.name || callsign,
      callsign,
      role: (a.role || 'CPA Specialist').replace(/_/g, ' '),
      charter: a.charter || 'Charter not recorded',
      status: ['ACTIVE', 'IDLE', 'PROCESSING', 'COOLDOWN'].includes(String(a.status).toUpperCase()) ? String(a.status).toUpperCase() as NamedCpaAgentPresentation['status'] : 'NOT_MEASURED',
      modelTier: a.modelTier || a.model || 'Not recorded',
      currentJob: a.currentJob || null,
      recentTasksCount: a.tasksCompleted ?? a.recentTasksCount ?? null,
      successRatePct: a.successRate ?? a.successRatePct ?? null,
      reviewRatePct: a.reviewRatePct ?? null,
      academyCompetencyScore: a.academyCompetencyScore ?? null,
      learningIncidentsCount: a.learningIncidentsCount ?? null,
      lastActivityAt: a.lastActivityAt ?? null,
      avatarColor: colors[callsign] || 'bg-slate-700'
    };
  });
}
