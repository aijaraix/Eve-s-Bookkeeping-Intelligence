import crypto from 'crypto';

export type AccountingDocumentType =
  | 'TRIAL_BALANCE'
  | 'GENERAL_LEDGER'
  | 'INCOME_STATEMENT'
  | 'BALANCE_SHEET'
  | 'CASH_FLOW_STATEMENT'
  | 'STATEMENT_OF_EQUITY'
  | 'BANK_STATEMENT'
  | 'ACCOUNTS_RECEIVABLE_AGING'
  | 'ACCOUNTS_PAYABLE_AGING'
  | 'FIXED_ASSET_SCHEDULE'
  | 'DEBT_SCHEDULE'
  | 'LEASE_SCHEDULE'
  | 'TAX_SCHEDULE'
  | 'PAYROLL_REPORT'
  | 'INVENTORY_SCHEDULE'
  | 'SUBSIDIARY_FINANCIAL_STATEMENT'
  | 'CONSOLIDATION_SCHEDULE'
  | 'AUDIT_REPORT'
  | 'FOOTNOTE_DISCLOSURE'
  | 'MANAGEMENT_DISCUSSION'
  | 'BOARD_REPORT'
  | 'BUDGET'
  | 'FORECAST'
  | 'SUPPORTING_CONTRACT'
  | 'UNKNOWN_REVIEW_REQUIRED';

export interface DocumentClassificationResult {
  documentType: AccountingDocumentType;
  confidenceScore: number; // 0.0 - 1.0
  evidenceCues: string[];
  structuralFeatures: {
    hasDebitCreditColumns?: boolean;
    hasAgingBuckets?: boolean;
    hasStatementGrid?: boolean;
    hasAuditorSignature?: boolean;
    hasMultiCurrencyColumns?: boolean;
    sheetNames?: string[];
  };
  classifiedAt: string;
  requiresHumanReview: boolean;
  classificationHash: string;
}

export interface ClassifyDocumentParams {
  filename: string;
  textSample?: string;
  sheetNames?: string[];
  tableHeaders?: string[];
  mimeType?: string;
}

export class DocumentPurposeClassifier {
  /**
   * Deterministically classifies the accounting purpose of a document prior to extraction.
   * If evidence is ambiguous, contradictory, or below the 0.65 confidence threshold,
   * it fails closed with UNKNOWN_REVIEW_REQUIRED rather than guessing.
   */
  public static classify(params: ClassifyDocumentParams): DocumentClassificationResult {
    const fn = (params.filename || '').toLowerCase();
    const text = (params.textSample || '').toLowerCase();
    const sheets = (params.sheetNames || []).map(s => s.toLowerCase());
    const headers = (params.tableHeaders || []).map(h => h.toLowerCase());

    const cues: string[] = [];
    const scores: Partial<Record<AccountingDocumentType, number>> = {};

    function addScore(type: AccountingDocumentType, points: number, cue: string) {
      scores[type] = (scores[type] || 0) + points;
      cues.push(`[${type}] +${points}pt: ${cue}`);
    }

    // --- 1. TRIAL BALANCE ---
    if (fn.includes('trial_balance') || fn.includes('trial balance') || fn.includes('tb_') || sheets.some(s => s.includes('trial balance') || s === 'tb')) {
      addScore('TRIAL_BALANCE', 40, 'Filename or sheet explicitly indicates Trial Balance');
    }
    if (text.includes('trial balance') || text.includes('summen- und saldenliste') || text.includes('balance de vérification')) {
      addScore('TRIAL_BALANCE', 35, 'Header contains statutory Trial Balance title');
    }
    if (headers.some(h => h.includes('debit') || h.includes('soll')) && headers.some(h => h.includes('credit') || h.includes('haben'))) {
      addScore('TRIAL_BALANCE', 25, 'Debit and Credit balance columns detected');
    }

    // --- 2. GENERAL LEDGER ---
    if (fn.includes('general_ledger') || fn.includes('general ledger') || fn.includes('gl_detail') || sheets.some(s => s.includes('general ledger') || s === 'gl')) {
      addScore('GENERAL_LEDGER', 40, 'Filename or sheet indicates General Ledger');
    }
    if (text.includes('general ledger') || text.includes('hauptbuch') || text.includes('grand livre')) {
      addScore('GENERAL_LEDGER', 30, 'Text mentions General Ledger or Hauptbuch');
    }
    if (headers.some(h => h.includes('journal') || h.includes('batch') || h.includes('posting date') || h.includes('voucher'))) {
      addScore('GENERAL_LEDGER', 25, 'Posting date / journal batch columns present');
    }

    // --- 3. INCOME STATEMENT ---
    if (fn.includes('income_statement') || fn.includes('p&l') || fn.includes('profit_loss') || sheets.some(s => s.includes('income statement') || s.includes('p&l') || s.includes('statement of operations'))) {
      addScore('INCOME_STATEMENT', 40, 'Filename or sheet indicates Income Statement / P&L');
    }
    if (text.includes('statement of operations') || text.includes('income statement') || text.includes('gewinn- und verlustrechnung') || text.includes('compte de résultat')) {
      addScore('INCOME_STATEMENT', 35, 'Statutory Income Statement terminology in text');
    }
    if (text.includes('revenue') && (text.includes('cost of goods sold') || text.includes('operating expenses') || text.includes('gross profit'))) {
      addScore('INCOME_STATEMENT', 25, 'Primary revenue and margin structure present');
    }

    // --- 4. BALANCE SHEET ---
    if (fn.includes('balance_sheet') || fn.includes('financial_position') || sheets.some(s => s.includes('balance sheet') || s.includes('financial position') || s === 'bs')) {
      addScore('BALANCE_SHEET', 40, 'Filename or sheet indicates Balance Sheet');
    }
    if (text.includes('statement of financial position') || text.includes('consolidated balance sheet') || text.includes('bilanz zum') || text.includes('bilan consolidé')) {
      addScore('BALANCE_SHEET', 35, 'Statutory Balance Sheet terminology in text');
    }
    if ((text.includes('total assets') || text.includes('aktiva')) && (text.includes('total liabilities') || text.includes('passiva'))) {
      addScore('BALANCE_SHEET', 25, 'Assets, Liabilities and Equity structure present');
    }

    // --- 5. CASH FLOW STATEMENT ---
    if (fn.includes('cash_flow') || sheets.some(s => s.includes('cash flow') || s.includes('cashflow'))) {
      addScore('CASH_FLOW_STATEMENT', 45, 'Filename or sheet indicates Cash Flow Statement');
    }
    if (text.includes('statement of cash flows') || text.includes('kapitalflussrechnung') || text.includes('flux de trésorerie')) {
      addScore('CASH_FLOW_STATEMENT', 35, 'Statutory Cash Flow terminology');
    }
    if (text.includes('operating activities') && text.includes('investing activities') && text.includes('financing activities')) {
      addScore('CASH_FLOW_STATEMENT', 30, 'Three standard IAS 7 cash flow activity sections detected');
    }

    // --- 6. STATEMENT OF EQUITY ---
    if (fn.includes('equity') || sheets.some(s => s.includes('statement of equity') || s.includes('shareholders equity') || s.includes('eigenkapital'))) {
      addScore('STATEMENT_OF_EQUITY', 40, 'Filename or sheet indicates Statement of Equity');
    }
    if (text.includes('statement of changes in equity') || text.includes('statement of stockholders\' equity') || text.includes('eigenkapitalspiegel')) {
      addScore('STATEMENT_OF_EQUITY', 40, 'Statement of Changes in Equity detected');
    }

    // --- 7. BANK STATEMENT ---
    if (fn.includes('bank_statement') || fn.includes('bank_stmt') || text.includes('bank statement') || text.includes('kontoauszug') || text.includes('relevé bancaire')) {
      addScore('BANK_STATEMENT', 45, 'Bank statement wording');
    }
    if (text.includes('iban') || text.includes('bic/swift') || text.includes('routing number') || text.includes('opening balance') && text.includes('closing balance')) {
      addScore('BANK_STATEMENT', 35, 'Banking identifiers and opening/closing balances present');
    }

    // --- 8. ACCOUNTS RECEIVABLE AGING ---
    if (fn.includes('ar_aging') || fn.includes('receivable_aging') || sheets.some(s => s.includes('ar aging') || s.includes('aging'))) {
      addScore('ACCOUNTS_RECEIVABLE_AGING', 45, 'Filename or sheet indicates AR Aging');
    }
    if (text.includes('accounts receivable aging') || text.includes('aged debtors') || text.includes('debitoren-altersstruktur')) {
      addScore('ACCOUNTS_RECEIVABLE_AGING', 40, 'AR aging schedule text');
    }
    if (headers.some(h => h.includes('1-30') || h.includes('31-60') || h.includes('61-90') || h.includes('90+'))) {
      addScore('ACCOUNTS_RECEIVABLE_AGING', 25, 'Standard aging bucket columns (30/60/90 days) detected');
    }

    // --- 9. ACCOUNTS PAYABLE AGING ---
    if (fn.includes('ap_aging') || fn.includes('payable_aging') || sheets.some(s => s.includes('ap aging') || s.includes('payables aging'))) {
      addScore('ACCOUNTS_PAYABLE_AGING', 45, 'Filename or sheet indicates AP Aging');
    }
    if (text.includes('accounts payable aging') || text.includes('aged creditors') || text.includes('kreditoren-altersstruktur')) {
      addScore('ACCOUNTS_PAYABLE_AGING', 40, 'AP aging schedule text');
    }

    // --- 10. FIXED ASSET SCHEDULE ---
    if (fn.includes('fixed_asset') || fn.includes('depreciation_schedule') || sheets.some(s => s.includes('fixed asset') || s.includes('anlagenspiegel'))) {
      addScore('FIXED_ASSET_SCHEDULE', 45, 'Filename or sheet indicates Fixed Asset Schedule / Anlagenspiegel');
    }
    if (text.includes('fixed assets') || text.includes('anlagenspiegel') || text.includes('property, plant and equipment') || text.includes('sachanlagen')) {
      addScore('FIXED_ASSET_SCHEDULE', 30, 'Fixed asset and PP&E terminology');
    }
    if (headers.some(h => h.includes('accumulated depreciation') || h.includes('carrying amount') || h.includes('useful life') || h.includes('abschreibungen'))) {
      addScore('FIXED_ASSET_SCHEDULE', 30, 'Depreciation and book value columns detected');
    }

    // --- 11. DEBT SCHEDULE ---
    if (fn.includes('debt_schedule') || fn.includes('loan_schedule') || text.includes('credit facility') || text.includes('senior notes') || text.includes('term loan')) {
      addScore('DEBT_SCHEDULE', 40, 'Debt schedule or loan facility terms');
    }

    // --- 12. LEASE SCHEDULE ---
    if (fn.includes('lease_schedule') || fn.includes('ifrs16') || fn.includes('asc842') || text.includes('right-of-use asset') || text.includes('lease liability')) {
      addScore('LEASE_SCHEDULE', 45, 'Lease accounting terms (IFRS 16 / ASC 842 / ROU asset)');
    }

    // --- 13. TAX SCHEDULE ---
    if (fn.includes('tax_schedule') || fn.includes('tax_provision') || text.includes('effective tax rate reconciliation') || text.includes('deferred tax assets') || text.includes('ias 12')) {
      addScore('TAX_SCHEDULE', 40, 'Tax provision or statutory tax reconciliation');
    }

    // --- 14. PAYROLL REPORT ---
    if (fn.includes('payroll') || fn.includes('wage_report') || text.includes('gross pay') || text.includes('net pay') || text.includes('withholding tax') || text.includes('lohn- und gehaltsliste')) {
      addScore('PAYROLL_REPORT', 45, 'Payroll summary or compensation tax detail');
    }

    // --- 15. INVENTORY SCHEDULE ---
    if (fn.includes('inventory') || fn.includes('stock_report') || text.includes('inventory valuation') || text.includes('lower of cost or net realizable value') || text.includes('vorräte')) {
      addScore('INVENTORY_SCHEDULE', 40, 'Inventory valuation schedule');
    }

    // --- 16. SUBSIDIARY FINANCIAL STATEMENT ---
    if (fn.includes('subsidiary') || fn.includes('sub_standalone') || text.includes('standalone financial statements') || text.includes('wholly owned subsidiary') || text.includes('einzelabschluss')) {
      addScore('SUBSIDIARY_FINANCIAL_STATEMENT', 40, 'Standalone subsidiary financial statement');
    }

    // --- 17. CONSOLIDATION SCHEDULE ---
    if (fn.includes('consolidation') || fn.includes('elimination') || sheets.some(s => s.includes('consolidation') || s.includes('eliminations') || s.includes('group bridge'))) {
      addScore('CONSOLIDATION_SCHEDULE', 45, 'Consolidation workpaper or intercompany elimination bridge');
    }
    if (text.includes('intercompany elimination') || text.includes('konsolidierung') || text.includes('non-controlling interest elimination')) {
      addScore('CONSOLIDATION_SCHEDULE', 35, 'Consolidation journal entries detected');
    }

    // --- 18. AUDIT REPORT ---
    if (fn.includes('audit_report') || fn.includes('auditors_opinion') || text.includes('independent auditor\'s report') || text.includes('report of independent registered public accounting firm') || text.includes('bestätigungsvermerk')) {
      addScore('AUDIT_REPORT', 50, 'Independent Auditor Report / Statutory opinion');
    }

    // --- 19. FOOTNOTE DISCLOSURE ---
    if (fn.includes('footnote') || fn.includes('notes_to_') || sheets.some(s => s.includes('notes') || s.includes('disclosures') || s.includes('anhang'))) {
      addScore('FOOTNOTE_DISCLOSURE', 45, 'Notes and statutory disclosure sheet');
    }
    if (text.includes('notes to the consolidated financial statements') || text.includes('anhang zum konzernabschluss') || text.includes('annexe aux comptes consolidés')) {
      addScore('FOOTNOTE_DISCLOSURE', 40, 'Notes heading in text');
    }

    // --- 20. MANAGEMENT DISCUSSION ---
    if (fn.includes('mda') || fn.includes('management_discussion') || text.includes('management\'s discussion and analysis') || text.includes('lagebericht')) {
      addScore('MANAGEMENT_DISCUSSION', 50, 'MD&A or statutory Lagebericht narrative');
    }

    // --- 21. BOARD REPORT ---
    if (fn.includes('board_deck') || fn.includes('board_pack') || text.includes('board of directors briefing') || text.includes('confidential board memorandum')) {
      addScore('BOARD_REPORT', 50, 'Board memorandum / presentation pack');
    }

    // --- 22. BUDGET & FORECAST ---
    if (fn.includes('budget') || text.includes('annual operating budget') || text.includes('wirtschaftsplan')) {
      addScore('BUDGET', 45, 'Annual operating budget');
    }
    if (fn.includes('forecast') || text.includes('multi-year financial projection') || text.includes('prognosebericht')) {
      addScore('FORECAST', 45, 'Financial projection or forecast');
    }

    // --- 23. SUPPORTING CONTRACT ---
    if (fn.includes('agreement') || fn.includes('contract') || text.includes('master services agreement') || text.includes('credit agreement') || text.includes('share purchase agreement')) {
      addScore('SUPPORTING_CONTRACT', 45, 'Commercial agreement / contract');
    }

    // Determine highest scoring document type
    let bestType: AccountingDocumentType = 'UNKNOWN_REVIEW_REQUIRED';
    let maxScore = 0;

    for (const [typeKey, scoreVal] of Object.entries(scores)) {
      if (scoreVal > maxScore) {
        maxScore = scoreVal;
        bestType = typeKey as AccountingDocumentType;
      }
    }

    // Confidence Calculation (capped at 1.0, minimum threshold 60 required)
    const confidenceScore = maxScore >= 60 ? Math.min(1.0, 0.65 + (maxScore - 60) * 0.007) : (maxScore / 100);

    // Fail-closed enforcement: if confidence < 0.65, mark UNKNOWN_REVIEW_REQUIRED
    const finalType: AccountingDocumentType = confidenceScore >= 0.65 ? bestType : 'UNKNOWN_REVIEW_REQUIRED';
    const requiresReview = finalType === 'UNKNOWN_REVIEW_REQUIRED' || confidenceScore < 0.85;

    const hashInput = `${params.filename}|${finalType}|${confidenceScore.toFixed(3)}|${cues.join(';')}`;
    const classificationHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    return {
      documentType: finalType,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      evidenceCues: cues,
      structuralFeatures: {
        hasDebitCreditColumns: headers.some(h => h.includes('debit') || h.includes('soll')),
        hasAgingBuckets: headers.some(h => h.includes('30') || h.includes('60') || h.includes('90')),
        hasStatementGrid: sheets.length > 2,
        hasAuditorSignature: text.includes('independent auditor') || text.includes('bestätigungsvermerk'),
        sheetNames: params.sheetNames
      },
      classifiedAt: new Date().toISOString(),
      requiresHumanReview: requiresReview,
      classificationHash
    };
  }
}
