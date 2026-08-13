import { CorporateEntity, EntityRelationship, FxRateRecord, FxConversionMeta, ExtractedFact } from "../src/types.js";

// Standard historical reference exchange rates relative to EUR (as base 1.0)
const REFERENCE_FX_RATES: Record<string, number> = {
  EUR: 1.0,
  USD: 1.085,
  GBP: 0.855,
  JPY: 162.5,
  CAD: 1.482,
  CHF: 0.952,
  AUD: 1.645,
  BRL: 5.920,
  SGD: 1.458,
  HKD: 8.480,
  CNY: 7.820,
  INR: 90.45,
  MXN: 20.15,
  PLN: 4.285
};

// Multilingual financial terms mapping dictionary
const MULTILINGUAL_DICTIONARY: Record<string, { english: string; canonicalMetric: string; statementType: string }> = {
  // Spanish
  "ingresos de actividades ordinarias": { english: "Revenue", canonicalMetric: "revenue", statementType: "income_statement" },
  "ventas netas": { english: "Net Sales", canonicalMetric: "revenue", statementType: "income_statement" },
  "coste de las ventas": { english: "Cost of Sales", canonicalMetric: "cost_of_sales", statementType: "income_statement" },
  "beneficio bruto": { english: "Gross Profit", canonicalMetric: "gross_profit", statementType: "income_statement" },
  "ganancia bruta": { english: "Gross Profit", canonicalMetric: "gross_profit", statementType: "income_statement" },
  "resultado de explotación": { english: "Operating Profit", canonicalMetric: "operating_profit", statementType: "income_statement" },
  "beneficio antes de impuestos": { english: "Profit Before Tax", canonicalMetric: "profit_before_tax", statementType: "income_statement" },
  "resultado del ejercicio": { english: "Net Income", canonicalMetric: "net_income", statementType: "income_statement" },
  "total activo": { english: "Total Assets", canonicalMetric: "total_assets", statementType: "balance_sheet" },
  "total pasivo": { english: "Total Liabilities", canonicalMetric: "total_liabilities", statementType: "balance_sheet" },
  "patrimonio neto": { english: "Total Equity", canonicalMetric: "total_equity", statementType: "balance_sheet" },
  "flujo de efectivo de las actividades de explotación": { english: "Operating Cash Flow", canonicalMetric: "operating_cash_flow", statementType: "cash_flow" },

  // German
  "umsatzerlöse": { english: "Revenue", canonicalMetric: "revenue", statementType: "income_statement" },
  "herstellungskosten": { english: "Cost of Sales", canonicalMetric: "cost_of_sales", statementType: "income_statement" },
  "bruttoergebnis vom umsatz": { english: "Gross Profit", canonicalMetric: "gross_profit", statementType: "income_statement" },
  "betriebsergebnis": { english: "Operating Profit", canonicalMetric: "operating_profit", statementType: "income_statement" },
  "ergebnis vor steuern": { english: "Profit Before Tax", canonicalMetric: "profit_before_tax", statementType: "income_statement" },
  "jahresüberschuss": { english: "Net Income", canonicalMetric: "net_income", statementType: "income_statement" },
  "bilanzsumme": { english: "Total Assets", canonicalMetric: "total_assets", statementType: "balance_sheet" },
  "eigenkapital": { english: "Total Equity", canonicalMetric: "total_equity", statementType: "balance_sheet" },
  "verbindlichkeiten": { english: "Total Liabilities", canonicalMetric: "total_liabilities", statementType: "balance_sheet" },

  // Polish (Required Scenario)
  "przychody ze sprzedaży": { english: "Revenue", canonicalMetric: "revenue", statementType: "income_statement" },
  "przychody": { english: "Revenue", canonicalMetric: "revenue", statementType: "income_statement" },
  "koszt własny sprzedaży": { english: "Cost of Sales", canonicalMetric: "cost_of_sales", statementType: "income_statement" },
  "zysk brutto": { english: "Gross Profit", canonicalMetric: "gross_profit", statementType: "income_statement" },
  "zysk operacyjny": { english: "Operating Profit", canonicalMetric: "operating_profit", statementType: "income_statement" },
  "zysk netto": { english: "Net Income", canonicalMetric: "net_income", statementType: "income_statement" },
  "aktywa razem": { english: "Total Assets", canonicalMetric: "total_assets", statementType: "balance_sheet" },
  "aktywa trwałe": { english: "Non-current Assets", canonicalMetric: "total_assets", statementType: "balance_sheet" },
  "aktywa obrotowe": { english: "Current Assets", canonicalMetric: "total_assets", statementType: "balance_sheet" },
  "zobowiązania": { english: "Total Liabilities", canonicalMetric: "total_liabilities", statementType: "balance_sheet" },
  "zobowiązania krótkoterminowe": { english: "Current Liabilities", canonicalMetric: "total_liabilities", statementType: "balance_sheet" },
  "zobowiązania długoterminowe": { english: "Non-current Liabilities", canonicalMetric: "total_liabilities", statementType: "balance_sheet" },
  "kapitał własny": { english: "Total Equity", canonicalMetric: "total_equity", statementType: "balance_sheet" },
  "środki pieniężne": { english: "Cash & Cash Equivalents", canonicalMetric: "cash", statementType: "balance_sheet" },

  // French
  "chiffre d'affaires": { english: "Revenue", canonicalMetric: "revenue", statementType: "income_statement" },
  "coût des ventes": { english: "Cost of Sales", canonicalMetric: "cost_of_sales", statementType: "income_statement" },
  "marge brute": { english: "Gross Profit", canonicalMetric: "gross_profit", statementType: "income_statement" },
  "résultat d'exploitation": { english: "Operating Profit", canonicalMetric: "operating_profit", statementType: "income_statement" },
  "résultat avant impôt": { english: "Profit Before Tax", canonicalMetric: "profit_before_tax", statementType: "income_statement" },
  "résultat net": { english: "Net Income", canonicalMetric: "net_income", statementType: "income_statement" },
  "total de l'actif": { english: "Total Assets", canonicalMetric: "total_assets", statementType: "balance_sheet" },
  "capitaux propres": { english: "Total Equity", canonicalMetric: "total_equity", statementType: "balance_sheet" },

  // Japanese
  "売上高": { english: "Revenue", canonicalMetric: "revenue", statementType: "income_statement" },
  "売上原価": { english: "Cost of Sales", canonicalMetric: "cost_of_sales", statementType: "income_statement" },
  "売上総利益": { english: "Gross Profit", canonicalMetric: "gross_profit", statementType: "income_statement" },
  "営業利益": { english: "Operating Profit", canonicalMetric: "operating_profit", statementType: "income_statement" },
  "経常利益": { english: "Ordinary Profit", canonicalMetric: "operating_profit", statementType: "income_statement" },
  "当期純利益": { english: "Net Income", canonicalMetric: "net_income", statementType: "income_statement" },
  "資産合計": { english: "Total Assets", canonicalMetric: "total_assets", statementType: "balance_sheet" },
  "純資産合計": { english: "Total Equity", canonicalMetric: "total_equity", statementType: "balance_sheet" }
};

export class CorporateGroupService {
  private entities: Map<string, CorporateEntity> = new Map();
  private relationships: Map<string, EntityRelationship> = new Map();
  private fxRates: Map<string, FxRateRecord> = new Map();

  constructor() {
    this.seedDefaultFxRates();
  }

  private seedDefaultFxRates() {
    const today = new Date().toISOString().split('T')[0];
    Object.entries(REFERENCE_FX_RATES).forEach(([curr, rate]) => {
      const id = `FX-EUR-${curr}`;
      this.fxRates.set(id, {
        id,
        sourceCurrency: "EUR",
        targetCurrency: curr,
        exchangeRate: rate,
        effectiveDate: today,
        // MANDATORY REGULATORY RULE: Label fallback rates as REFERENCE_RATE_NOT_FOR_REPORTING, NOT ECB
        rateSource: "REFERENCE_RATE_NOT_FOR_REPORTING",
        lastUpdated: new Date().toISOString()
      });
    });
  }

  // Entity & Relationship Registry
  public createEntity(entity: Omit<CorporateEntity, "id" | "createdAt">): CorporateEntity {
    const id = `ENT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newEntity: CorporateEntity = {
      ...entity,
      id,
      createdAt: new Date().toISOString()
    };
    this.entities.set(id, newEntity);
    return newEntity;
  }

  public getEntitiesForWorkspace(workspaceId: string): CorporateEntity[] {
    const list = Array.from(this.entities.values()).filter(e => e.workspaceId === workspaceId);
    // MANDATORY REGULATORY RULE: NO FAKE ENTITY CREATION. Return empty list if no entities discovered.
    return list;
  }

  public createRelationship(rel: Omit<EntityRelationship, "id">): EntityRelationship {
    const id = `REL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newRel: EntityRelationship = { ...rel, id };
    this.relationships.set(id, newRel);
    return newRel;
  }

  public getRelationshipsForWorkspace(workspaceId: string): EntityRelationship[] {
    return Array.from(this.relationships.values()).filter(r => r.workspaceId === workspaceId);
  }

  // Entity Scope Tagging
  public classifyDocumentScope(docTitle: string, docText: string): {
    scope: 'Consolidated' | 'Parent Only' | 'Subsidiary' | 'UNKNOWN';
    entityType: 'PARENT' | 'SUBSIDIARY' | 'UNKNOWN';
  } {
    const combined = `${docTitle} ${docText.substring(0, 1000)}`.toLowerCase();
    if (combined.includes("consolidated") || combined.includes("consolidado") || combined.includes("konsolidiert") || combined.includes("group financial statements")) {
      return { scope: "Consolidated", entityType: "PARENT" };
    }
    if (combined.includes("parent company") || combined.includes("standalone") || combined.includes("sociedad matriz") || combined.includes("muttergesellschaft")) {
      return { scope: "Parent Only", entityType: "PARENT" };
    }
    if (combined.includes("subsidiary") || combined.includes("filial")) {
      return { scope: "Subsidiary", entityType: "SUBSIDIARY" };
    }
    // MANDATORY REGULATORY RULE: Return UNKNOWN when uncertain, NOT Subsidiary.
    return { scope: "UNKNOWN", entityType: "UNKNOWN" };
  }

  public processMultilingualLabel(label: string): {
    labelOriginal: string;
    labelNormalized: string;
    canonicalMetric: string;
    statementType: string;
    detectedLanguage: string;
    translationQualityScore: number;
  } {
    if (!label) return {
      labelOriginal: "Metric",
      labelNormalized: "Metric",
      canonicalMetric: "unknown_metric",
      statementType: "general",
      detectedLanguage: "en",
      translationQualityScore: 0.8
    };
    const lower = label.trim().toLowerCase();
    const entry = MULTILINGUAL_DICTIONARY[lower];
    if (entry) {
      return {
        labelOriginal: label,
        labelNormalized: entry.english,
        canonicalMetric: entry.canonicalMetric,
        statementType: entry.statementType,
        detectedLanguage: "auto",
        translationQualityScore: 0.98
      };
    }
    return {
      labelOriginal: label,
      labelNormalized: label,
      canonicalMetric: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      statementType: "general",
      detectedLanguage: "en",
      translationQualityScore: 0.95
    };
  }

  // Multi-Currency Conversion Layer with FX Provenance
  public convertCurrency(
    originalAmount: number,
    sourceCurrency: string,
    targetCurrency: string,
    effectiveDate: string = new Date().toISOString().split('T')[0],
    customRateSource?: 'ECB' | 'FED' | 'USER_OVERRIDE' | 'EXTRACTED_NOTES' | 'REFERENCE_RATE_NOT_FOR_REPORTING'
  ): { convertedAmount: number; fxMeta: FxConversionMeta } {
    const src = (sourceCurrency || "EUR").toUpperCase();
    const tgt = (targetCurrency || "EUR").toUpperCase();

    if (src === tgt) {
      return {
        convertedAmount: originalAmount,
        fxMeta: {
          sourceCurrency: src,
          targetCurrency: tgt,
          exchangeRate: 1.0,
          effectiveDate,
          rateSource: customRateSource || "REFERENCE_RATE_NOT_FOR_REPORTING",
          originalAmount,
          functionalAmount: originalAmount
        }
      };
    }

    const srcRateToEur = REFERENCE_FX_RATES[src] || 1.0;
    const tgtRateToEur = REFERENCE_FX_RATES[tgt] || 1.0;

    const crossRate = tgtRateToEur / srcRateToEur;
    const convertedAmount = Math.round(originalAmount * crossRate * 100) / 100;

    return {
      convertedAmount,
      fxMeta: {
        sourceCurrency: src,
        targetCurrency: tgt,
        exchangeRate: Math.round(crossRate * 100000) / 100000,
        effectiveDate,
        rateSource: customRateSource || "REFERENCE_RATE_NOT_FOR_REPORTING",
        originalAmount,
        functionalAmount: convertedAmount
      }
    };
  }

  public getFxRates(): FxRateRecord[] {
    return Array.from(this.fxRates.values());
  }

  public getEntities(workspaceId?: string): CorporateEntity[] {
    const list = Array.from(this.entities.values());
    return list.filter(e => !workspaceId || e.workspaceId === workspaceId);
  }

  public updateFxRate(id: string, rate: number, source: 'USER_OVERRIDE' | 'EXTRACTED_NOTES' = 'USER_OVERRIDE'): FxRateRecord | null {
    const rec = this.fxRates.get(id);
    if (!rec) return null;
    rec.exchangeRate = rate;
    rec.rateSource = source;
    rec.lastUpdated = new Date().toISOString();
    return rec;
  }
}

export const corporateGroupService = new CorporateGroupService();
