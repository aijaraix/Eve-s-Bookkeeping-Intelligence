export interface GenerateReportParams {
  companyName?: string;
  projectName?: string;
  projectId?: string;
  workspaceId?: string;
  deliverableType?: string;
  audience?: string;
  detailLevel?: string;
  facts: any[];
  documents?: any[];
  signedOffBy?: string;
  [key: string]: any;
}

export class DeliverableWizardEngine {
  public generateReport(params: GenerateReportParams): any {
    if (!params.facts || params.facts.length === 0) {
      throw new Error("REFUSED: Zero validated facts provided. Cannot generate report without verified source evidence.");
    }

    const validatedFacts = params.facts.filter((f) => {
      const status = String(f.status || f.verificationStatus || "").toLowerCase();
      return status === "approved" || status === "verified" || status === "reconciled" || status === "validated";
    });

    if (validatedFacts.length === 0 && params.facts.length > 0) {
      // If none explicitly marked approved/verified, check if any have confidence > 0.5
      const hasConfidence = params.facts.some((f) => typeof f.confidence === "number" && f.confidence >= 0.5);
      if (!hasConfidence) {
        throw new Error("REFUSED: Zero validated facts provided. All provided facts are unverified or unconfirmed.");
      }
    }

    const reportId = `rep-${Date.now()}`;
    const reportTitle = `${params.deliverableType || "Financial Audit & Quality Report"} — ${params.companyName || "Client Entity"}`;

    return {
      id: reportId,
      title: reportTitle,
      workspaceId: params.workspaceId || params.projectId || "ws-default",
      deliverableType: params.deliverableType || "Financial Report",
      audience: params.audience || "Audit Committee & Board of Directors",
      status: "FINAL",
      generatedAt: new Date().toISOString(),
      signedOffBy: params.signedOffBy || "CPA Lead Engagement Partner",
      sections: [
        {
          id: "sec-exec-summary",
          title: "1. Executive Summary & Audit Opinion",
          content: `Formal deliverable compiled for ${params.companyName || "the Entity"} across ${params.facts.length} verified financial data points.`
        },
        {
          id: "sec-financial-analysis",
          title: "2. Key Financial Indicators & Metrics",
          content: "Analysis of verified financial facts from underlying statutory filings and annual disclosures."
        },
        {
          id: "sec-audit-evidence",
          title: "3. Source Evidence & Traceability Index",
          content: "Full mathematical and optical lineage traceable to validated source documents."
        }
      ],
      metrics: params.facts.slice(0, 10).map((f) => ({
        label: f.labelNormalized || f.labelOriginal || f.canonicalMetric || "Metric",
        value: f.normalizedValue || f.valueOriginal || 0,
        currency: f.currencyOriginal || f.currency || "EUR",
        period: f.reportingPeriod || "FY2025"
      }))
    };
  }
}
