import { CorporateEntity, EntityRelationship, FxRateRecord, FxConversionMeta, ExtractedFact } from "../src/types.js";

// Standard historical exchange rates relative to EUR (as base 1.0)
const DEFAULT_FX_RATES: Record<string, number> = {
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
  MXN: 20.15
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
    Object.entries(DEFAULT_FX_RATES).forEach(([curr, rate]) => {
      const id = `FX-EUR-${curr}`;
      this.fxRates.set(id, {
        id,
        sourceCurrency: "EUR",
        targetCurrency: curr,
        exchangeRate: rate,
        effectiveDate: today,
        rateSource: "ECB",
        lastUpdated: new Date().toISOString()
      });
    });
  }

  // 2.1 Entity & Relationship Registry
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
    if (list.length === 0) {
      // Seed initial parent and subsidiary for workspace
      const parent = this.createEntity({
        workspaceId,
        name: "Group Holding Parent Corp",
        legalName: "Group Holding Parent Corporation S.A.",
        jurisdiction: "EU / Global",
        reportingCurrency: "EUR",
        entityType: "PARENT",
        ownershipPercentage: 100,
        scope: "Consolidated",
        notes: "Ultimate consolidating parent entity"
      });

      const sub1 = this.createEntity({
        workspaceId,
        name: "Operating Subsidiary UK",
        legalName: "Operating Subsidiary UK Ltd",
        jurisdiction: "United Kingdom",
        reportingCurrency: "GBP",
        entityType: "SUBSIDIARY",
        ownershipPercentage: 100,
        scope: "Subsidiary",
        notes: "100% owned operating subsidiary"
      });

      const sub2 = this.createEntity({
        workspaceId,
        name: "Operating Subsidiary US",
        legalName: "Operating Subsidiary US LLC",
        jurisdiction: "United States",
        reportingCurrency: "USD",
        entityType: "SUBSIDIARY",
        ownershipPercentage: 100,
        scope: "Subsidiary",
        notes: "100% owned operating subsidiary"
      });

      this.createRelationship({
        workspaceId,
        parentEntityId: parent.id,
        childEntityId: sub1.id,
        relationshipType: "PARENT_OF",
        ownershipPercentage: 100,
        consolidationMethod: "FULL"
      });

      this.createRelationship({
        workspaceId,
        parentEntityId: parent.id,
        childEntityId: sub2.id,
        relationshipType: "PARENT_OF",
        ownershipPercentage: 100,
        consolidationMethod: "FULL"
      });

      return Array.from(this.entities.values()).filter(e => e.workspaceId === workspaceId);
    }
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

  // 2.2 Entity Scope Tagging
  public classifyDocumentScope(docTitle: string, docText: string): {
    scope: 'Consolidated' | 'Parent Only' | 'Subsidiary';
    entityType: 'PARENT' | 'SUBSIDIARY';
  } {
    const combined = `${docTitle} ${docText.substring(0, 1000)}`.toLowerCase();
    if (combined.includes("consolidated") || combined.includes("consolidado") || combined.includes("konsolidiert") || combined.includes("group financial statements")) {
      return { scope: "Consolidated", entityType: "PARENT" };
    }
    if (combined.includes("parent company") || combined.includes("standalone") || combined.includes("sociedad matriz") || combined.includes("muttergesellschaft")) {
      return { scope: "Parent Only", entityType: "PARENT" };
    }
    return { scope: "Subsidiary", entityType: "SUBSIDIARY" };
  }

  // 2.3 Multi-Currency Conversion Layer with FX Provenance
  public convertCurrency(
    originalAmount: number,
    sourceCurrency: string,
    targetCurrency: string,
    effectiveDate: string = new Date().toISOString().split('T')[0],
    customRateSource?: 'ECB' | 'FED' | 'USER_OVERRIDE' | 'EXTRACTED_NOTES'
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
          rateSource: customRateSource || "ECB",
          originalAmount,
          functionalAmount: originalAmount
        }
      };
    }

    const srcRateToEur = DEFAULT_FX_RATES[src] || 1.0;
    const tgtRateToEur = DEFAULT_FX_RATES[tgt] || 1.0;

    // Convert via EUR base cross rate
    // Amount in EUR = originalAmount / srcRateToEur
    // Amount in Target = (originalAmount / srcRateToEur) * tgtRateToEur
    const crossRate = tgtRateToEur / srcRateToEur;
    const convertedAmount = Math.round(originalAmount * crossRate * 100) / 100;

    return {
      convertedAmount,
      fxMeta: {
        sourceCurrency: src,
        targetCurrency: tgt,
        exchangeRate: Math.round(crossRate * 100000) / 100000,
        effectiveDate,
        rateSource: customRateSource || "ECB",
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

  // 2.4 Multilingual Detection & Label Preservation
  public processMultilingualLabel(rawLabel: string): {
    labelOriginal: string;
    labelNormalized: string;
    detectedLanguage: string;
    canonicalMetric?: string;
    statementType?: string;
    translationQualityScore: number;
  } {
    const cleanRaw = (rawLabel || "").trim();
    const lowerRaw = cleanRaw.toLowerCase();

    // Check exact dictionary match
    if (MULTILINGUAL_DICTIONARY[lowerRaw]) {
      const match = MULTILINGUAL_DICTIONARY[lowerRaw];
      return {
        labelOriginal: cleanRaw,
        labelNormalized: match.english,
        detectedLanguage: lowerRaw.includes("ingresos") || lowerRaw.includes("ventas") ? "es" : lowerRaw.includes("umsatz") ? "de" : lowerRaw.includes("chiffre") ? "fr" : "ja",
        canonicalMetric: match.canonicalMetric,
        statementType: match.statementType,
        translationQualityScore: 0.98
      };
    }

    // Check partial key phrase match
    for (const [key, val] of Object.entries(MULTILINGUAL_DICTIONARY)) {
      if (lowerRaw.includes(key)) {
        return {
          labelOriginal: cleanRaw,
          labelNormalized: val.english,
          detectedLanguage: key.includes("ingresos") ? "es" : key.includes("umsatz") ? "de" : "fr",
          canonicalMetric: val.canonicalMetric,
          statementType: val.statementType,
          translationQualityScore: 0.92
        };
      }
    }

    // Default English or unknown preservation
    return {
      labelOriginal: cleanRaw,
      labelNormalized: cleanRaw,
      detectedLanguage: "en",
      translationQualityScore: 1.0
    };
  }
}

export const corporateGroupService = new CorporateGroupService();
