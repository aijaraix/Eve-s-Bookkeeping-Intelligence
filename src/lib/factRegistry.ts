export interface ProvenanceRecord {
  fact_id: string;
  document_id: string;
  project_id: string;
  source_filename: string;
  source_url?: string | null;
  page?: number;
  slide?: number;
  sheet?: string;
  cell_range?: string; // e.g. "TB 2025:F121"
  section_title?: string;
  source_text: string;
  source_table_id?: string;
  original_label: string;
  normalized_label: string;
  original_value: string;
  normalized_value: number;
  currency: string;
  unit_scale: 'Units' | 'Thousands' | 'Millions' | 'Billions';
  reporting_period: string;
  extraction_method: string;
  confidence: number;
  validation_status: 'DETECTED' | 'EXTRACTED' | 'NORMALIZED' | 'CROSS-CHECKED' | 'VALIDATED' | 'PUBLISHED' | 'DISPUTED' | 'REJECTED';
  validator_notes?: string;
  created_at: string;
}

export class FactRegistry {
  private facts: Map<string, ProvenanceRecord> = new Map();

  public addFact(fact: ProvenanceRecord): void {
    this.facts.set(fact.fact_id, fact);
  }

  public getFact(factId: string): ProvenanceRecord | undefined {
    return this.facts.get(factId);
  }

  public getFactsForProject(projectId: string): ProvenanceRecord[] {
    return Array.from(this.facts.values()).filter(f => f.project_id === projectId);
  }

  public getValidatedFactsForProject(projectId: string): ProvenanceRecord[] {
    return Array.from(this.facts.values()).filter(
      f => f.project_id === projectId && (f.validation_status === 'VALIDATED' || f.validation_status === 'PUBLISHED')
    );
  }

  public updateFactStatus(factId: string, status: ProvenanceRecord['validation_status'], notes?: string): ProvenanceRecord | undefined {
    const fact = this.facts.get(factId);
    if (fact) {
      fact.validation_status = status;
      if (notes) fact.validator_notes = notes;
      return fact;
    }
    return undefined;
  }

  public clearProject(projectId: string): void {
    const keys = Array.from(this.facts.keys());
    keys.forEach(k => {
      if (this.facts.get(k)?.project_id === projectId) {
        this.facts.delete(k);
      }
    });
  }

  public static toProvenanceRecord(fact: any): ProvenanceRecord {
    return {
      fact_id: fact.id || `fct-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      document_id: fact.documentId || "",
      project_id: fact.workspaceId || "",
      source_filename: fact.provenance?.rawSnippet || fact.sourceText || "document.pdf",
      page: fact.pageNumber || fact.provenance?.pageNumber || 1,
      cell_range: fact.provenance?.cellRange,
      section_title: fact.provenance?.sectionTitle,
      source_text: fact.sourceText || fact.provenance?.rawSnippet || "",
      source_table_id: fact.provenance?.tableId,
      original_label: fact.labelOriginal || "",
      normalized_label: fact.labelNormalized || "",
      original_value: fact.valueOriginal || "",
      normalized_value: parseFloat(fact.valueFunctional || "0") || 0,
      currency: fact.functionalCurrency || fact.currencyOriginal || "USD",
      unit_scale: fact.unitScale || 'Units',
      reporting_period: fact.reportingPeriod || fact.periodEnd || "FY 2026",
      extraction_method: fact.extractionMethod || "UNSPECIFIED",
      confidence: typeof fact.confidence === "number" ? fact.confidence : 0,
      validation_status: fact.status === 'APPROVED' || fact.status === 'approved' ? 'VALIDATED' : fact.status === 'DISCREPANCY' ? 'DISPUTED' : fact.status === 'pending_review' || fact.status === 'PROPOSED' ? 'DETECTED' : 'EXTRACTED',
      validator_notes: fact.verificationNotes,
      created_at: new Date().toISOString()
    };
  }
}

export const globalFactRegistry = new FactRegistry();
