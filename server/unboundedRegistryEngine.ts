import { ExtractedFact, FactCandidate, AccountingReconciliationRule } from "../src/types.js";

export class UnboundedRegistryEngine {

  // 3.1 Fast Query & Filtering over thousands of facts
  public queryFacts(
    allFacts: ExtractedFact[],
    params: {
      workspaceId?: string;
      candidateState?: string;
      disclosureCategory?: string;
      verificationStage?: string;
      searchQuery?: string;
      page?: number;
      limit?: number;
    }
  ): {
    facts: ExtractedFact[];
    total: number;
    page: number;
    totalPages: number;
    stats: {
      totalFacts: number;
      proposedCandidates: number;
      secondPassDisclosures: number;
      verifiedFacts: number;
    };
  } {
    let filtered = [...allFacts];

    if (params.workspaceId) {
      filtered = filtered.filter(f => f.workspaceId === params.workspaceId);
    }

    if (params.candidateState && params.candidateState !== 'ALL') {
      filtered = filtered.filter(f => f.candidateState === params.candidateState);
    }

    if (params.disclosureCategory && params.disclosureCategory !== 'ALL') {
      filtered = filtered.filter(f => f.disclosureCategory === params.disclosureCategory);
    }

    if (params.verificationStage && params.verificationStage !== 'ALL') {
      filtered = filtered.filter(f => f.verificationStage === params.verificationStage);
    }

    if (params.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        (f.labelNormalized && f.labelNormalized.toLowerCase().includes(q)) ||
        (f.labelOriginal && f.labelOriginal.toLowerCase().includes(q)) ||
        (f.canonicalMetric && f.canonicalMetric.toLowerCase().includes(q)) ||
        (f.sourceText && f.sourceText.toLowerCase().includes(q)) ||
        (f.noteReference && f.noteReference.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const page = params.page || 1;
    const limit = params.limit || 50;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const stats = {
      totalFacts: allFacts.length,
      proposedCandidates: allFacts.filter(f => f.candidateState === 'PROPOSED').length,
      secondPassDisclosures: allFacts.filter(f => f.isNoteDisclosure).length,
      verifiedFacts: allFacts.filter(f => f.verificationStage === 'PASS_2_RECONCILED' || f.status === 'validated' || f.status === 'approved').length
    };

    return { facts: paginated, total, page, totalPages, stats };
  }

  // 3.2 BackfillAgent candidate conversion (outputs PROPOSED candidates only)
  public generateBackfillCandidates(allFacts: ExtractedFact[], sourceBlocks: any[]): FactCandidate[] {
    const candidates: FactCandidate[] = [];

    // Check for missing standard metrics and create PROPOSED candidates
    const hasGrossProfit = allFacts.some(f => f.canonicalMetric === 'gross_profit');
    const hasRevenue = allFacts.some(f => f.canonicalMetric === 'revenue');
    const hasCostOfSales = allFacts.some(f => f.canonicalMetric === 'cost_of_sales');

    if (!hasGrossProfit && hasRevenue && hasCostOfSales) {
      const revFact = allFacts.find(f => f.canonicalMetric === 'revenue');
      const cosFact = allFacts.find(f => f.canonicalMetric === 'cost_of_sales');

      if (revFact && cosFact) {
        const revVal = parseFloat(revFact.valueFunctional || '0');
        const cosVal = parseFloat(cosFact.valueFunctional || '0');
        const calculatedGrossProfit = revVal - cosVal;

        candidates.push({
          id: `cand-gp-${Date.now()}`,
          workspaceId: revFact.workspaceId,
          documentId: revFact.documentId,
          proposedLabel: 'Calculated Gross Profit Candidate',
          canonicalMetric: 'gross_profit',
          proposedValue: calculatedGrossProfit,
          currency: revFact.functionalCurrency || 'EUR',
          candidateState: 'PROPOSED',
          candidateSource: 'BACKFILL_AGENT',
          noteReference: 'Derived via BackfillAgent math calculation (Revenue - Cost of Sales)',
          sourceSnippet: `Derived from Revenue (${revVal}) minus Cost of Sales (${cosVal})`,
          pageNumber: revFact.pageNumber || 1,
          confidence: 0.94,
          reasoning: 'Derived mathematical candidate created during automated BackfillAgent candidate conversion pass.',
          createdAt: new Date().toISOString()
        });
      }
    }

    return candidates;
  }

  // 3.3 Second-Pass extraction over all narrative/note Source Blocks
  public executeSecondPassNoteExtraction(sourceBlocks: any[], workspaceId: string, documentId: string): ExtractedFact[] {
    const secondPassFacts: ExtractedFact[] = [];

    sourceBlocks.forEach((block, idx) => {
      const text = (block.text_content || block.content || block.rawText || '').trim();
      const lowerText = text.toLowerCase();

      // Detect Leases & Commitments disclosures
      if (lowerText.includes('lease') || lowerText.includes('commitment') || lowerText.includes('contractual obligation')) {
        const matchNumber = text.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/);
        const hasNum = !!matchNumber;
        const val = hasNum ? parseFloat(matchNumber[0].replace(/,/g, '')) : 0;

        secondPassFacts.push({
          id: `sp-lease-${Date.now()}-${idx}`,
          workspaceId,
          documentId,
          factType: hasNum ? 'disclosure' : 'QUALITATIVE_DISCLOSURE',
          labelOriginal: text.substring(0, 60) + '...',
          labelNormalized: 'Operating Lease & Contractual Commitment',
          valueOriginal: hasNum ? `${val}` : (null as any),
          currencyOriginal: hasNum ? 'EUR' : (null as any),
          valueFunctional: hasNum ? `${val}` : (null as any),
          functionalCurrency: hasNum ? 'EUR' : (null as any),
          unitScale: hasNum ? 'Units' : (null as any),
          scale: hasNum ? 'Units' : (null as any),
          pageNumber: block.page_number || 1,
          sourceText: text,
          confidence: 0.91,
          status: 'PROPOSED',
          extractionMethod: 'Second-Pass Narrative Parser',
          candidateState: 'PROPOSED',
          isCandidate: true,
          candidateSource: 'SECOND_PASS_NOTE',
          isNoteDisclosure: true,
          noteReference: `Note ${idx + 1}: Leases & Commitments`,
          disclosureCategory: 'Leases & Commitments',
          verificationStage: 'UNVERIFIED',
          canonicalMetric: 'lease_obligations'
        });
      }

      // Detect Tax disclosures & Effective Tax Rate
      if (lowerText.includes('tax rate') || lowerText.includes('tax reconciliation') || lowerText.includes('impuestos') || lowerText.includes('podatek')) {
        const matchPct = text.match(/(\d+(?:\.\d+)?)\s*%/);
        const hasPct = !!matchPct;
        const valPct = hasPct ? matchPct[1] : '0';

        secondPassFacts.push({
          id: `sp-tax-${Date.now()}-${idx}`,
          workspaceId,
          documentId,
          factType: hasPct ? 'disclosure' : 'QUALITATIVE_DISCLOSURE',
          labelOriginal: text.substring(0, 60) + '...',
          labelNormalized: 'Effective Corporate Tax Rate & Tax Note',
          valueOriginal: hasPct ? `${valPct}%` : (null as any),
          currencyOriginal: hasPct ? '%' : (null as any),
          valueFunctional: hasPct ? valPct : (null as any),
          functionalCurrency: hasPct ? '%' : (null as any),
          unitScale: hasPct ? 'Units' : (null as any),
          scale: hasPct ? 'Units' : (null as any),
          pageNumber: block.page_number || 1,
          sourceText: text,
          confidence: 0.93,
          status: 'PROPOSED',
          extractionMethod: 'Second-Pass Narrative Parser',
          candidateState: 'PROPOSED',
          isCandidate: true,
          candidateSource: 'SECOND_PASS_NOTE',
          isNoteDisclosure: true,
          noteReference: `Note ${idx + 1}: Tax Disclosures`,
          disclosureCategory: 'Tax Disclosures',
          verificationStage: 'UNVERIFIED',
          canonicalMetric: 'effective_tax_rate'
        });
      }

      // Detect Segment Reporting
      if (lowerText.includes('segment') || lowerText.includes('geographical area') || lowerText.includes('divisional revenue')) {
        secondPassFacts.push({
          id: `sp-seg-${Date.now()}-${idx}`,
          workspaceId,
          documentId,
          factType: 'QUALITATIVE_DISCLOSURE',
          labelOriginal: text.substring(0, 60) + '...',
          labelNormalized: 'Segment Financial Disclosure',
          valueOriginal: (null as any),
          currencyOriginal: (null as any),
          valueFunctional: (null as any),
          functionalCurrency: (null as any),
          unitScale: (null as any),
          scale: (null as any),
          pageNumber: block.page_number || 1,
          sourceText: text,
          confidence: 0.89,
          status: 'PROPOSED',
          extractionMethod: 'Second-Pass Narrative Parser',
          candidateState: 'PROPOSED',
          isCandidate: true,
          candidateSource: 'SECOND_PASS_NOTE',
          isNoteDisclosure: true,
          noteReference: `Note ${idx + 1}: Segment Disclosures`,
          disclosureCategory: 'Segment Reporting',
          verificationStage: 'UNVERIFIED',
          canonicalMetric: 'segment_disclosure'
        });
      }
    });

    return secondPassFacts;
  }

  // 3.4 Multi-Stage Verification Pipeline & Accounting Reconciliation
  /**
   * Requirement #21: Strict Dimension-Matching Logic across 7 dimensions
   */
  public static areFactsDimensionallyMatched(f1: ExtractedFact, f2: ExtractedFact): boolean {
    if (!f1 || !f2) return false;
    const samePeriod = (f1.periodStart === f2.periodStart && f1.periodEnd === f2.periodEnd) ||
                       (f1.periodOriginal === f2.periodOriginal) ||
                       (f1.reportingPeriod === f2.reportingPeriod);
    const sameCurrency = (f1.functionalCurrency || f1.currencyOriginal) === (f2.functionalCurrency || f2.currencyOriginal);
    const sameScale = (f1.unitScale || f1.scale) === (f2.unitScale || f2.scale);
    const sameStatement = (f1.statementType || 'general') === (f2.statementType || 'general');
    const sameEntity = (f1.entityId || f1.workspaceId) === (f2.entityId || f2.workspaceId);
    const sameScope = (f1.consolidationScope || 'Consolidated') === (f2.consolidationScope || 'Consolidated');
    const sameRestatement = (f1.isRestated || false) === (f2.isRestated || false);

    return samePeriod && sameCurrency && sameScale && sameStatement && sameEntity && sameScope && sameRestatement;
  }

  public runAccountingReconciliation(allFacts: ExtractedFact[]): AccountingReconciliationRule[] {
    const rules: AccountingReconciliationRule[] = [];

    // Helper to find metric total
    const getMetricValue = (metric: string): { val: number; fact?: ExtractedFact } => {
      const match = allFacts.find(f =>
        f.canonicalMetric === metric ||
        f.labelNormalized?.toLowerCase().includes(metric.replace('_', ' ')) ||
        f.labelOriginal?.toLowerCase().includes(metric.replace('_', ' '))
      );
      if (!match) return { val: 0 };
      return { val: parseFloat(match.valueFunctional || '0'), fact: match };
    };

    // Helper to calculate scale-aware dynamic tolerance (0.01% of base or min threshold)
    const getScaleAwareTolerance = (baseVal: number, minTolerance = 100): number => {
      const absBase = Math.abs(baseVal);
      if (absBase === 0) return minTolerance;
      return Math.max(minTolerance, Math.round(absBase * 0.0001)); // 0.01% tolerance
    };

    // Rule 1: Balance Sheet Equation (Assets = Liabilities + Equity) (Req #23 & #24)
    const totalAssetsObj = getMetricValue('total_assets');
    const totalLiabilitiesObj = getMetricValue('total_liabilities');
    const totalEquityObj = getMetricValue('total_equity');

    const totalAssets = totalAssetsObj.val;
    const totalLiabilities = totalLiabilitiesObj.val;
    const totalEquity = totalEquityObj.val;

    const bsTolerance = getScaleAwareTolerance(totalAssets, 100);
    const bsDiff = Math.abs(totalAssets - (totalLiabilities + totalEquity));

    // Check for potential missing component line items in complex corporate structures
    const nonControllingInterest = getMetricValue('non_controlling_interest').val;
    const treasuryStock = getMetricValue('treasury_shares').val;

    type RuleStatus = 'BALANCED' | 'VARIANCE_DETECTED' | 'MISSING_DATA' | 'INCOMPLETE_BRIDGE' | 'INSUFFICIENT_DIMENSIONALLY_MATCHED_DATA';
    let bsExplanation = '';
    let bsStatus: RuleStatus = 'BALANCED';

    if (totalAssets === 0 && totalLiabilities === 0 && totalEquity === 0) {
      bsStatus = 'MISSING_DATA';
      bsExplanation = 'Incomplete balance sheet extraction in current dataset. Total Assets, Liabilities, and Equity missing.';
    } else if (
      (totalAssetsObj.fact && totalLiabilitiesObj.fact && !UnboundedRegistryEngine.areFactsDimensionallyMatched(totalAssetsObj.fact, totalLiabilitiesObj.fact)) ||
      (totalAssetsObj.fact && totalEquityObj.fact && !UnboundedRegistryEngine.areFactsDimensionallyMatched(totalAssetsObj.fact, totalEquityObj.fact))
    ) {
      bsStatus = 'INSUFFICIENT_DIMENSIONALLY_MATCHED_DATA';
      bsExplanation = 'Incompatible fact dimensions detected across entity, period, currency, or scope. Balance sheet reconciliation halted.';
    } else if (bsDiff <= bsTolerance) {
      bsStatus = 'BALANCED';
      bsExplanation = `Balance sheet accounting equation holds within dynamic scale-aware tolerance (${bsTolerance.toLocaleString()} EUR threshold).`;
    } else {
      bsStatus = 'VARIANCE_DETECTED';
      let extraNote = '';
      if (nonControllingInterest === 0) extraNote += ' (Note: Non-Controlling Interest line item not detected).';
      if (treasuryStock === 0) extraNote += ' (Note: Treasury Stock adjustment not detected).';
      bsExplanation = `Discrepancy of ${bsDiff.toLocaleString()} EUR detected between Total Assets (${totalAssets.toLocaleString()}) and Total Liabilities + Equity (${(totalLiabilities + totalEquity).toLocaleString()}).${extraNote}`;
    }

    rules.push({
      id: 'rule-bs-balance',
      ruleCode: 'REC-001',
      ruleName: 'Balance Sheet Fundamental Accounting Equation (Assets = Liabilities + Equity)',
      statementA: 'Balance Sheet',
      metricA: 'Total Assets',
      statementB: 'Balance Sheet',
      metricB: 'Total Liabilities + Total Equity',
      tolerance: bsTolerance,
      status: bsStatus,
      expectedEquation: 'Total Assets = Total Liabilities + Total Equity',
      calculatedValueA: totalAssets,
      calculatedValueB: totalLiabilities + totalEquity,
      variance: bsDiff,
      explanation: bsExplanation
    });

    // Rule 2: Gross Profit Equation (Revenue - Cost of Sales = Gross Profit) (Req #24)
    const revenueObj = getMetricValue('revenue');
    const costOfSalesObj = getMetricValue('cost_of_sales');
    const grossProfitObj = getMetricValue('gross_profit');

    const revenue = revenueObj.val;
    const costOfSales = costOfSalesObj.val;
    const grossProfit = grossProfitObj.val;

    const gpTolerance = getScaleAwareTolerance(revenue, 50);
    const calcGrossProfit = revenue - costOfSales;
    const gpDiff = Math.abs(grossProfit - calcGrossProfit);

    let gpStatus: RuleStatus = 'BALANCED';
    let gpExplanation = '';

    if (grossProfit === 0 && revenue === 0) {
      gpStatus = 'MISSING_DATA';
      gpExplanation = 'Gross profit or revenue metrics not yet extracted in dataset.';
    } else if (gpDiff <= gpTolerance) {
      gpStatus = 'BALANCED';
      gpExplanation = `Income statement gross margin mathematically verified within dynamic tolerance (${gpTolerance.toLocaleString()} EUR).`;
    } else {
      gpStatus = 'VARIANCE_DETECTED';
      gpExplanation = `Discrepancy of ${gpDiff.toLocaleString()} EUR detected between Reported Gross Profit (${grossProfit.toLocaleString()}) and Derived (Revenue - COGS = ${calcGrossProfit.toLocaleString()}).`;
    }

    rules.push({
      id: 'rule-gp-reconcile',
      ruleCode: 'REC-002',
      ruleName: 'Income Statement Gross Margin Mathematical Check',
      statementA: 'Income Statement',
      metricA: 'Reported Gross Profit',
      statementB: 'Income Statement',
      metricB: 'Calculated (Revenue - Cost of Sales)',
      tolerance: gpTolerance,
      status: gpStatus,
      expectedEquation: 'Gross Profit = Revenue - Cost of Sales',
      calculatedValueA: grossProfit,
      calculatedValueB: calcGrossProfit,
      variance: gpDiff,
      explanation: gpExplanation
    });

    // Rule 3: Comprehensive Net Income Reconciliation Bridge (Req #22)
    // NEVER assume naive Net Income = Operating Profit - Tax Expense!
    const netIncomeObj = getMetricValue('net_income');
    const operatingProfitObj = getMetricValue('operating_profit');
    const taxExpenseObj = getMetricValue('tax_expense');

    // Non-operating line items
    const financeIncome = getMetricValue('finance_income').val;
    const financeCosts = getMetricValue('finance_cost').val;
    const equityMethodIncome = getMetricValue('equity_method_income').val;
    const discontinuedOps = getMetricValue('discontinued_operations').val;

    const netIncome = netIncomeObj.val;
    const operatingProfit = operatingProfitObj.val;
    const taxExpense = taxExpenseObj.val;

    const niTolerance = getScaleAwareTolerance(netIncome > 0 ? netIncome : operatingProfit, 100);

    // Calculate full bridge if items present
    const nonOpNet = (financeIncome - financeCosts) + equityMethodIncome + discontinuedOps;
    const bridgeCalculatedNetIncome = operatingProfit + nonOpNet - taxExpense;
    const niDiff = Math.abs(netIncome - bridgeCalculatedNetIncome);

    const hasNonOpItemsInFactBase = financeIncome !== 0 || financeCosts !== 0 || equityMethodIncome !== 0 || discontinuedOps !== 0;

    let niStatus: RuleStatus = 'BALANCED';
    let niExplanation = '';

    if (netIncome === 0 && operatingProfit === 0) {
      niStatus = 'MISSING_DATA';
      niExplanation = 'Net Income and Operating Profit metrics missing from extracted facts.';
    } else if (niDiff <= niTolerance) {
      niStatus = 'BALANCED';
      niExplanation = `Net Income reconciles mathematically with operating earnings, finance bridge, and tax expense within dynamic scale-aware tolerance (${niTolerance.toLocaleString()} EUR).`;
    } else if (!hasNonOpItemsInFactBase) {
      // Missing bridge items! Mark as INCOMPLETE_BRIDGE or NOT_RECONCILED rather than assuming zero
      niStatus = 'INCOMPLETE_BRIDGE';
      niExplanation = `Unreconciled Net Income variance of ${niDiff.toLocaleString()} EUR. Non-operating income/costs (finance costs, investment income, equity method results) are not yet explicitly extracted to complete the Net Income bridge.`;
    } else {
      niStatus = 'VARIANCE_DETECTED';
      niExplanation = `Net Income bridge discrepancy of ${niDiff.toLocaleString()} EUR detected between reported Net Income (${netIncome.toLocaleString()}) and Net Income Bridge calculation (${bridgeCalculatedNetIncome.toLocaleString()}).`;
    }

    rules.push({
      id: 'rule-ni-reconcile',
      ruleCode: 'REC-003',
      ruleName: 'Comprehensive Net Income & Non-Operating Earnings Reconciliation Bridge',
      statementA: 'Income Statement',
      metricA: 'Reported Net Income',
      statementB: 'Operating & Non-Operating Bridge',
      metricB: 'Operating Profit + Non-Operating Items - Tax Expense',
      tolerance: niTolerance,
      status: niStatus,
      expectedEquation: 'Net Income = Operating Profit + Net Financial/Non-Op Items - Income Tax Expense',
      calculatedValueA: netIncome,
      calculatedValueB: bridgeCalculatedNetIncome,
      variance: niDiff,
      explanation: niExplanation
    });

    return rules;
  }
}

export const unboundedRegistryEngine = new UnboundedRegistryEngine();
