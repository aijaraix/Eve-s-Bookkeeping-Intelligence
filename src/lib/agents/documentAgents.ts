import { CanonicalDocumentModel } from '../parser/types';
import { ProvenanceRecord } from '../factRegistry';
import { BankTransaction, BankAccountSummary, HermesFinding } from '../../types';

export interface DocumentClassificationResult {
  category: string;
  classificationConfidence: number;
  entityName: string;
  reportingPeriod: string;
  reportingCurrency: string;
  unitScale: 'Units' | 'Thousands' | 'Millions' | 'Billions';
  auditor?: string;
  extractedFacts: ProvenanceRecord[];
  bankSummary?: BankAccountSummary;
  bankTransactions?: BankTransaction[];
  findings: HermesFinding[];
}

export class DocumentIntelligenceAgent {
  public classifyAndExtract(doc: CanonicalDocumentModel): DocumentClassificationResult {
    const rawText = doc.markdown + ' ' + doc.sections.map(s => s.text).join(' ');
    const textLower = rawText.toLowerCase();
    const filename = doc.source.filename.toLowerCase();

    // 1. Content-Based Classification & Document Fingerprinting (Stage 1)
    let category = 'Unknown Financial Document';
    if (textLower.includes('bank statement') || textLower.includes('account statement') || textLower.includes('checking account') || textLower.includes('beginning balance') || textLower.includes('ending balance')) {
      category = 'Bank Statement';
    } else if (textLower.includes('credit card statement') || textLower.includes('card statement')) {
      category = 'Credit Card Statement';
    } else if (textLower.includes('brokerage statement') || textLower.includes('investment statement')) {
      category = 'Brokerage Statement';
    } else if (textLower.includes('balance sheet') || textLower.includes('statement of financial position')) {
      category = 'Balance Sheet';
    } else if (textLower.includes('income statement') || textLower.includes('profit and loss') || textLower.includes('statement of operations')) {
      category = 'Income Statement';
    } else if (textLower.includes('statement of cash flows') || textLower.includes('cash flow statement')) {
      category = 'Cash Flow Statement';
    } else if (textLower.includes('general ledger') || textLower.includes('gl detail')) {
      category = 'General Ledger';
    } else if (textLower.includes('trial balance') || (textLower.includes('debit') && textLower.includes('credit') && textLower.includes('account number'))) {
      category = 'Trial Balance';
    } else if (textLower.includes('accounts payable') || textLower.includes('ap aging')) {
      category = 'Accounts Payable Report';
    } else if (textLower.includes('accounts receivable') || textLower.includes('ar aging')) {
      category = 'Accounts Receivable Report';
    } else if (textLower.includes('form 10-k') || textLower.includes('annual report under section 13')) {
      category = '10-K';
    } else if (textLower.includes('form 10-q')) {
      category = '10-Q';
    } else if (textLower.includes('form 20-f')) {
      category = '20-F';
    } else if (textLower.includes('ifrs') && (textLower.includes('financial report') || textLower.includes('financial statements'))) {
      category = 'IFRS Financial Report';
    } else if (textLower.includes('tax return') || textLower.includes('form 1120') || textLower.includes('form 1040') || textLower.includes('k-1')) {
      category = 'Tax Return';
    } else if (textLower.includes('invoice') || textLower.includes('bill to') || textLower.includes('remit to')) {
      category = 'Invoice';
    } else if (textLower.includes('payroll') || textLower.includes('paystub') || textLower.includes('w-2')) {
      category = 'Payroll Report';
    } else if (textLower.includes('cap table') || textLower.includes('capitalization table')) {
      category = 'Cap Table';
    } else if (textLower.includes('valuation report') || textLower.includes('409a')) {
      category = 'Valuation Report';
    } else if (textLower.includes('annual report') || textLower.includes('consolidated financial statements') || textLower.includes('financial report')) {
      category = 'Annual Report';
    }

    // 2. Entity Identification (Extracted directly from document text, avoiding SEC/generic boilerplate)
    let entityName = '';
    
    // Look for company patterns in text
    const entityMatch = rawText.match(/(?:account name|account holder|company name|registrant name|prepared for|company):?\s*([A-Z0-9\s,\.&]{3,50})/i)
      || rawText.match(/([A-Z0-9\s,\.&]{3,40}\s+(?:INC\.|LLC|CORP\.|S\.A\.|GMBH|LTD\.|PHARMACEUTICALS|GROUP|PLC))/i);

    if (entityMatch && entityMatch[1]) {
      let candidate = entityMatch[1].trim().replace(/\n/g, ' ');
      const lowerCand = candidate.toLowerCase();
      if (
        !lowerCand.includes('emerging growth') &&
        !lowerCand.includes('see the definition') &&
        !lowerCand.includes('readme') &&
        !lowerCand.includes('instruction') &&
        !lowerCand.includes('table of contents') &&
        candidate.length >= 3
      ) {
        entityName = candidate;
      }
    }

    if (!entityName) {
      if (doc.metadata?.entityName && !doc.metadata.entityName.toLowerCase().includes('entity') && !doc.metadata.entityName.toLowerCase().includes('emerging growth')) {
        entityName = doc.metadata.entityName;
      } else {
        const cleanFile = doc.source.originalName.replace(/\.[^/.]+$/, '').replace(/[_.-]+/g, ' ').trim();
        entityName = cleanFile.length >= 3 ? cleanFile : 'Enterprise Entity';
      }
    }

    // 3. CURRENCY RESOLUTION HIERARCHY (Stage 1)
    // Level 1: Explicit accounting declaration
    let currency = '';
    if (/presented in (euros?|eur)/i.test(rawText) || /expressed in (euros?|eur)/i.test(rawText) || /reporting currency is (euros?|eur)/i.test(rawText) || /figures in euros/i.test(rawText)) {
      currency = 'EUR';
    } else if (/presented in (us dollars?|usd)/i.test(rawText) || /expressed in (us dollars?|usd)/i.test(rawText) || /reporting currency is usd/i.test(rawText) || /figures in us dollars/i.test(rawText)) {
      currency = 'USD';
    } else if (/presented in (pounds?|gbp|sterling)/i.test(rawText) || /expressed in (pounds?|gbp)/i.test(rawText) || /reporting currency is gbp/i.test(rawText) || /figures in pounds/i.test(rawText)) {
      currency = 'GBP';
    } else if (/presented in (swiss francs?|chf)/i.test(rawText) || /expressed in (chf|francs?)/i.test(rawText)) {
      currency = 'CHF';
    } else if (/presented in (yen|jpy|japanese yen)/i.test(rawText) || /expressed in (yen|jpy)/i.test(rawText) || /reporting currency is jpy/i.test(rawText) || /in millions of yen/i.test(rawText)) {
      currency = 'JPY';
    }

    // Level 2: Statement/table declaration
    if (!currency) {
      if (/€\s*(million|billion|thousand|m|b|k)/i.test(rawText) || /in millions of euros/i.test(rawText) || /€m\b/i.test(rawText)) currency = 'EUR';
      else if (/\$\s*(million|billion|thousand|m|b|k)/i.test(rawText) || /in millions of us dollars/i.test(rawText) || /\$m\b/i.test(rawText)) currency = 'USD';
      else if (/£\s*(million|billion|thousand|m|b|k)/i.test(rawText) || /in millions of pounds/i.test(rawText) || /£m\b/i.test(rawText)) currency = 'GBP';
      else if (/chf\s*(million|billion|thousand|m|b|k)/i.test(rawText)) currency = 'CHF';
      else if (/¥\s*(million|billion|thousand|m|b|k)/i.test(rawText) || /in millions of yen/i.test(rawText) || /yen in millions/i.test(rawText)) currency = 'JPY';
    }

    // Level 5 & 6: Symbol/Code frequency as fallback
    if (!currency) {
      const usdCount = (rawText.match(/\$|\bUSD\b|\bUS Dollar\b/g) || []).length;
      const eurCount = (rawText.match(/€|\bEUR\b|\bEuro\b/g) || []).length;
      const gbpCount = (rawText.match(/£|\bGBP\b/g) || []).length;
      const chfCount = (rawText.match(/\bCHF\b/g) || []).length;
      const jpyCount = (rawText.match(/¥|\bJPY\b|\bYen\b/g) || []).length;

      if (jpyCount > Math.max(usdCount, eurCount, gbpCount, chfCount)) currency = 'JPY';
      else if (chfCount > Math.max(usdCount, eurCount, gbpCount)) currency = 'CHF';
      else if (eurCount > Math.max(usdCount, gbpCount)) currency = 'EUR';
      else if (gbpCount > usdCount) currency = 'GBP';
      else currency = 'USD';
    }

    // 4. Period Extraction
    let period: string | undefined = undefined;
    const dateRangeMatch = rawText.match(/(?:for the|three|six|nine|twelve)?\s*(?:months?|period)?\s*ended\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/i)
      || rawText.match(/(?:quarter|q[1-4]|period)\s*(?:ended)?\s*([A-Za-z0-9\s,]{4,25}\d{4})/i)
      || rawText.match(/([A-Z][a-z]+\s+\d{1,2},\s+\d{4}\s+(?:through|to|-)\s+[A-Z][a-z]+\s+\d{1,2},\s+\d{4})/i)
      || rawText.match(/\b(FY\s*20\d{2}|FY\s*19\d{2})\b/i);

    if (dateRangeMatch && dateRangeMatch[1]) {
      const captured = dateRangeMatch[1].trim();
      if (captured.length >= 4 && !/^(ended|period|from|for)$/i.test(captured)) {
        period = captured;
      }
    }

    // 5. Unit Scale
    let unitScale: 'Units' | 'Thousands' | 'Millions' | 'Billions' = 'Units';
    if (textLower.includes('in millions') || textLower.includes('(millions)')) unitScale = 'Millions';
    else if (textLower.includes('in thousands') || textLower.includes('(thousands)') || textLower.includes('000s')) unitScale = 'Thousands';
    else if (textLower.includes('in billions')) unitScale = 'Billions';

    const extractedFacts: ProvenanceRecord[] = [];
    let bankSummary: BankAccountSummary | undefined;
    let bankTransactions: BankTransaction[] | undefined;

    let bankSummary: BankAccountSummary | undefined;
    let bankTransactions: BankTransaction[] | undefined;

    // 6. SPECIALIZED EXTRACTOR: BANK STATEMENT (fail closed — no fixtures)
    if (category === 'Bank Statement') {
      const parseAmount = (regex: RegExp): number | null => {
        const m = rawText.match(regex);
        if (!m || !m[1]) return null;
        const clean = m[1].replace(/,/g, '').trim();
        const val = parseFloat(clean);
        return isNaN(val) ? null : val;
      };

      const begBal = parseAmount(/(?:beginning balance|starting balance|previous balance|opening balance)[\s:$]*(-?\$?[\d,]+\.\d{2})/i);
      const deposits = parseAmount(/(?:total deposits|deposits and credits|additions)[\s:$]*(\$?[\d,]+\.\d{2})/i);
      const withdrawals = parseAmount(/(?:total withdrawals|withdrawals and debits|subtractions)[\s:$]*(-?\$?[\d,]+\.\d{2})/i);
      const fees = parseAmount(/(?:service fees|total fees|fees)[\s:$]*(-?\$?[\d,]+\.\d{2})/i);
      const endBal = parseAmount(/(?:ending balance|new balance|closing balance)[\s:$]*(\$?[\d,]+\.\d{2})/i);

      const txnDateRe = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
      const amtRe = /-?\$?\d{1,3}(?:,\d{3})*\.\d{2}/;
      const parsedTxns: BankTransaction[] = [];
      rawText.split('\n').forEach((line, idx) => {
        const dm = line.match(txnDateRe);
        const am = line.match(amtRe);
        if (!dm || !am) return;
        const amount = parseFloat(am[0].replace(/[$,]/g, ''));
        if (isNaN(amount)) return;
        if (!line.includes(am[0])) return;
        parsedTxns.push({
          id: `TXN-${doc.document_id}-${parsedTxns.length + 1}`,
          workspaceId: doc.project_id,
          documentId: doc.document_id,
          date: dm[1],
          postingDate: dm[1],
          description: line.replace(txnDateRe, '').replace(amtRe, '').replace(/\s+/g, ' ').trim() || 'Transaction',
          rawDescription: line.trim(),
          amount,
          transactionType: amount >= 0 ? 'deposit' : 'withdrawal',
          category: 'Extracted Bank Transaction',
          sourcePage: 1,
          confidence: 0,
          reconciled: false
        });
      });

      if (parsedTxns.length === 0 && begBal == null && endBal == null) {
        return {
          category,
          classificationConfidence: 0,
          entityName,
          reportingPeriod: period,
          reportingCurrency: currency,
          unitScale,
          extractedFacts: [],
          findings: [{
            id: `FND-${doc.document_id}-bank-miss`,
            workspaceId: doc.project_id,
            companyName: entityName,
            title: 'Bank statement parse missed',
            category: 'Bank Statement',
            risk: 'High',
            finAgentStatus: 'Disagree',
            auditAgentStatus: 'Disagree',
            riskAgentStatus: 'Disagree',
            consensusScore: 0,
            confidenceScore: 0,
            materiality: 0,
            status: 'Open',
            nextAction: 'Upload a statement with dated transactions or beginning/ending balances. Fixture values are not used.',
            period,
            createdDate: new Date().toISOString().split('T')[0],
            finAgentOpinion: 'No dated transactions or balances found in source text.',
            finAgentConfidence: 0,
            auditAgentOpinion: 'Refuse to invent Bank of America / Stripe / AWS transactions.',
            auditAgentConfidence: 0,
            riskAgentOpinion: 'Unextracted bank file must not look reconciled.',
            riskAgentConfidence: 0,
            aiRecommendation: 'Re-upload native PDF/CSV/XLSX bank activity.',
            relatedDocsCount: 1,
            relatedJeCount: 0,
            relatedAccountsCount: 0,
            relatedTasksCount: 0,
            agentOpinions: []
          }]
        };
      }

      const bankNameMatch = rawText.match(/([A-Z][a-zA-Z\s]+Bank|[A-Z][a-zA-Z\s]+Credit Union)/);
      const calcEnd = begBal != null ? Math.round(((begBal + (deposits || 0) - (withdrawals || 0) - (fees || 0)) * 100)) / 100 : null;

      bankSummary = {
        bankName: bankNameMatch ? bankNameMatch[1].trim() : '',
        accountHolder: entityName,
        accountType: '',
        maskedAccountNumber: '',
        periodStart: period || '',
        periodEnd: period || '',
        currency,
        beginningBalance: begBal ?? 0,
        totalDeposits: deposits ?? parsedTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
        totalWithdrawals: withdrawals ?? parsedTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
        totalChecks: 0,
        totalFees: fees ?? 0,
        endingBalance: endBal ?? 0,
        averageBalance: 0,
        depositCount: parsedTxns.filter(t => t.amount > 0).length,
        withdrawalCount: parsedTxns.filter(t => t.amount < 0).length,
        transactionCount: parsedTxns.length,
        calculatedEndingBalance: calcEnd ?? 0,
        reconciliationPassed: begBal != null && endBal != null && calcEnd != null ? Math.abs(calcEnd - endBal) < 0.05 : false
      };
      bankTransactions = parsedTxns;

      const createBankFact = (label: string, normLabel: string, val: number, sourceText: string): ProvenanceRecord => ({
        fact_id: `FCT-BS-${doc.document_id}-${normLabel.replace(/\s+/g, '-')}`,
        document_id: doc.document_id,
        project_id: doc.project_id,
        source_filename: doc.source.filename,
        page: 1,
        section_title: 'Account Summary',
        source_text: sourceText,
        original_label: label,
        normalized_label: normLabel,
        original_value: String(val),
        normalized_value: val,
        currency,
        unit_scale: 'Units' as const,
        reporting_period: period,
        extraction_method: 'BANK_STATEMENT_NATIVE_PARSE',
        confidence: 0,
        validation_status: 'EXTRACTED',
        created_at: new Date().toISOString()
      });

      if (begBal != null) {
        const src = rawText.match(/(?:beginning balance|starting balance|previous balance|opening balance)[\s:$]*-?\$?[\d,]+\.\d{2}/i)?.[0] || '';
        extractedFacts.push(createBankFact('Beginning Balance', 'Beginning Cash Balance', begBal, src));
      }
      if (endBal != null) {
        const src = rawText.match(/(?:ending balance|new balance|closing balance)[\s:$]*-?\$?[\d,]+\.\d{2}/i)?.[0] || '';
        extractedFacts.push(createBankFact('Ending Balance', 'Ending Cash Balance', endBal, src));
      }
    } else {
      // General Extraction: Parse numbers directly from tables, sections, and markdown text
      const addedLabels = new Set<string>();

      const addFact = (originalLabel: string, normalizedLabel: string, rawValStr: string, numVal: number, page: number = 1, sourceText: string = '') => {
        const key = `${normalizedLabel}-${numVal}`;
        if (addedLabels.has(key)) return;
        addedLabels.add(key);

        let mult = 1;
        const lowerRaw = (rawValStr + ' ' + sourceText).toLowerCase();
        if (lowerRaw.includes('billion') || lowerRaw.includes('b')) mult = 1000000000;
        else if (lowerRaw.includes('million') || lowerRaw.includes('m')) mult = 1000000;
        else if (lowerRaw.includes('thousand') || lowerRaw.includes('k')) mult = 1000;
        else if (unitScale === 'Millions' && Math.abs(numVal) < 1000000) mult = 1000000;
        else if (unitScale === 'Thousands' && Math.abs(numVal) < 1000000) mult = 1000;
        else if (unitScale === 'Billions' && Math.abs(numVal) < 1000) mult = 1000000000;

        const normalizedVal = numVal * mult;

        extractedFacts.push({
          fact_id: `FCT-GEN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          document_id: doc.document_id,
          project_id: doc.project_id,
          source_filename: doc.source.filename,
          page,
          section_title: 'Financial Statements',
          source_text: sourceText || `${originalLabel}: ${rawValStr}`,
          original_label: originalLabel,
          normalized_label: normalizedLabel,
          original_value: rawValStr,
          normalized_value: normalizedVal,
          currency,
          unit_scale: unitScale,
          reporting_period: period,
          extraction_method: 'TABLE_CELL_PARSE',
          confidence: 0,
          validation_status: 'EXTRACTED',
          created_at: new Date().toISOString()
        });
      };

      // 1. Process Document Tables if available
      if (doc.tables && doc.tables.length > 0) {
        doc.tables.forEach(table => {
          table.rows.forEach(row => {
            if (!row || row.length < 2) return;
            const labelCell = (row[0] || '').trim();
            if (!labelCell || labelCell.length < 2) return;

            const labelLower = labelCell.toLowerCase();
            let normLabel = '';

            if (/group\s+revenue|total\s+revenue|operating\s+revenue|sales\s+revenue|turnover|net\s+sales|revenue/i.test(labelLower)) normLabel = 'Revenue';
            else if (/comparative\s+revenue|prior\s+year\s+revenue|2024\s+revenue|2025\s+revenue/i.test(labelLower)) normLabel = 'Comparative Revenue';
            else if (/net\s+income|net\s+profit|profit\s+for\s+the\s+period|profit\s+for\s+the\s+year|net\s+earnings/i.test(labelLower)) normLabel = 'Net Income';
            else if (/cost\s+of\s+sales|cost\s+of\s+goods|cogs|cost\s+of\s+revenue/i.test(labelLower)) normLabel = 'Cost of Sales';
            else if (/gross\s+profit|gross\s+margin/i.test(labelLower)) normLabel = 'Gross Profit';
            else if (/operating\s+income|operating\s+profit|ebit|profit\s+from\s+operations/i.test(labelLower)) normLabel = 'Operating Income';
            else if (/operating\s+expenses|sga|selling\s+general|administrative/i.test(labelLower)) normLabel = 'Operating Expenses';
            else if (/total\s+assets|assets\s+total/i.test(labelLower)) normLabel = 'Total Assets';
            else if (/total\s+liabilities|liabilities\s+total/i.test(labelLower)) normLabel = 'Total Liabilities';
            else if (/total\s+equity|shareholders['’]?\s+equity|stockholders['’]?\s+equity/i.test(labelLower)) normLabel = 'Total Equity';
            else if (/cash\s+and\s+cash\s+equivalents|ending\s+cash|cash\s+balance/i.test(labelLower)) normLabel = 'Cash';

            if (!normLabel && labelCell.length >= 2 && /[a-zA-Z]/.test(labelCell)) {
              const cleanLabel = labelCell.replace(/^[\s\d\.\-\#\*\>\|]+/, '').trim();
              if (cleanLabel.length >= 2) {
                normLabel = cleanLabel.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
              }
            }

            if (normLabel) {
              for (let i = 1; i < row.length; i++) {
                const cellVal = (row[i] || '').trim();
                const numMatch = cellVal.match(/(-?\(?\$?€?£?\s*[\d,]+(?:\.\d+)?\)?)/);
                if (numMatch) {
                  let rawNum = numMatch[1].replace(/[\$\s€£,]/g, '');
                  let isNegative = false;
                  if (rawNum.startsWith('(') && rawNum.endsWith(')')) {
                    isNegative = true;
                    rawNum = rawNum.slice(1, -1);
                  }
                  const parsedNum = parseFloat(rawNum);
                  if (!isNaN(parsedNum)) {
                    const finalNum = isNegative ? -parsedNum : parsedNum;
                    addFact(labelCell, normLabel, cellVal, finalNum, table.pageNumber || 1, `${labelCell} | ${row.slice(1).join(' | ')}`);
                    break;
                  }
                }
              }
            }
          });
        });
      }

      // 2. Line-by-Line Regex Search over markdown & text
      const textLines = (doc.markdown + '\n' + rawText).split('\n');
      textLines.forEach((line, idx) => {
        const lineTrim = line.trim();
        if (!lineTrim || lineTrim.length < 5) return;

        const patterns = [
          { regex: /(?:group\s+revenue|total\s+revenue|operating\s+revenue|sales\s+revenue|turnover|net\s+sales|revenue)[\s:|=-]*([$€£]?\s*-?\(?[\d,]+(?:\.\d+)?\)?\s*(?:m|million|b|billion|k)?)/i, norm: 'Revenue', orig: 'Group Revenue' },
          { regex: /(?:comparative\s+revenue|prior\s+year\s+revenue|2024\s+revenue|2025\s+revenue)[\s:|=-]*([$€£]?\s*-?\(?[\d,]+(?:\.\d+)?\)?\s*(?:m|million|b|billion|k)?)/i, norm: 'Comparative Revenue', orig: 'Comparative Revenue' },
          { regex: /(?:net\s+income|net\s+profit|profit\s+for\s+the\s+period|profit\s+for\s+the\s+year|net\s+earnings)[\s:|=-]*([$€£]?\s*-?\(?[\d,]+(?:\.\d+)?\)?\s*(?:m|million|b|billion|k)?)/i, norm: 'Net Income', orig: 'Net Income' },
          { regex: /(?:cost\s+of\s+sales|cost\s+of\s+goods|cogs|cost\s+of\s+revenue)[\s:|=-]*([$€£]?\s*-?\(?[\d,]+(?:\.\d+)?\)?\s*(?:m|million|b|billion|k)?)/i, norm: 'Cost of Sales', orig: 'Cost of Sales' },
          { regex: /(?:gross\s+profit|gross\s+margin)[\s:|=-]*([$€£]?\s*-?\(?[\d,]+(?:\.\d+)?\)?\s*(?:m|million|b|billion|k)?)/i, norm: 'Gross Profit', orig: 'Gross Profit' },
          { regex: /(?:operating\s+income|operating\s+profit|ebit)[\s:|=-]*([$€£]?\s*-?\(?[\d,]+(?:\.\d+)?\)?\s*(?:m|million|b|billion|k)?)/i, norm: 'Operating Income', orig: 'Operating Income' },
          { regex: /(?:total\s+assets|assets)[\s:|=-]*([$€£]?\s*-?\(?[\d,]+(?:\.\d+)?\)?\s*(?:m|million|b|billion|k)?)/i, norm: 'Total Assets', orig: 'Total Assets' },
          { regex: /(?:total\s+liabilities|liabilities)[\s:|=-]*([$€£]?\s*-?\(?[\d,]+(?:\.\d+)?\)?\s*(?:m|million|b|billion|k)?)/i, norm: 'Total Liabilities', orig: 'Total Liabilities' },
          { regex: /(?:total\s+equity|shareholders['’]?\s+equity|equity)[\s:|=-]*([$€£]?\s*-?\(?[\d,]+(?:\.\d+)?\)?\s*(?:m|million|b|billion|k)?)/i, norm: 'Total Equity', orig: 'Total Equity' },
          { regex: /(?:cash\s+and\s+cash\s+equivalents|ending\s+cash|cash\s+balance)[\s:|=-]*([$€£]?\s*-?\(?[\d,]+(?:\.\d+)?\)?\s*(?:m|million|b|billion|k)?)/i, norm: 'Cash', orig: 'Cash & Cash Equivalents' }
        ];

        let matched = false;
        for (const item of patterns) {
          const match = lineTrim.match(item.regex);
          if (match && match[1]) {
            const rawVal = match[1].trim();
            let clean = rawVal.replace(/[\$\s€£,]/g, '');
            let isNegative = false;
            if (clean.startsWith('(') && clean.endsWith(')')) {
              isNegative = true;
              clean = clean.slice(1, -1);
            }
            const num = parseFloat(clean);
            if (!isNaN(num) && num !== 0) {
              const val = isNegative ? -num : num;
              addFact(item.orig, item.norm, rawVal, val, 1, lineTrim);
              matched = true;
            }
          }
        }

        // Generic line pattern matching: Label : Value or Label | Value
        if (!matched && (lineTrim.includes(':') || lineTrim.includes('|') || lineTrim.includes('  '))) {
          const genericMatch = lineTrim.match(/^([a-zA-Z\s\&\-\,\'\(\)]+?)[\s:|=-]+([$€£]?\s*-?\(?[\d,]+(?:\.\d+)?\)?\s*(?:m|million|b|billion|k)?)$/i);
          if (genericMatch && genericMatch[1] && genericMatch[2]) {
            const labelStr = genericMatch[1].trim();
            const valStr = genericMatch[2].trim();
            if (labelStr.length >= 3 && /[a-zA-Z]/.test(labelStr)) {
              let clean = valStr.replace(/[\$\s€£,]/g, '');
              let isNeg = false;
              if (clean.startsWith('(') && clean.endsWith(')')) {
                isNeg = true;
                clean = clean.slice(1, -1);
              }
              const numVal = parseFloat(clean);
              if (!isNaN(numVal) && numVal !== 0) {
                const normTitle = labelStr.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                addFact(labelStr, normTitle, valStr, isNeg ? -numVal : numVal, 1, lineTrim);
              }
            }
          }
        }
      });
    }

    // 8. Findings from extraction only — no simulated 3/3 unanimous vote
    const findings: HermesFinding[] = [];
    const nowStr = new Date().toISOString().split('T')[0];

    if (category === 'Bank Statement' && (!bankTransactions || bankTransactions.length === 0) && extractedFacts.length === 0) {
      findings.push({
        id: `FND-${doc.document_id}-bank-miss`,
        workspaceId: doc.project_id,
        companyName: entityName,
        title: 'Bank statement parse missed',
        category: 'Bank Statement',
        risk: 'High',
        finAgentStatus: 'Disagree',
        auditAgentStatus: 'Disagree',
        riskAgentStatus: 'Disagree',
        consensusScore: 0,
        confidenceScore: 0,
        materiality: 0,
        status: 'Open',
        nextAction: 'No dated transactions extracted. Re-upload native statement.',
        period,
        createdDate: nowStr,
        finAgentOpinion: 'Parse missed.',
        finAgentConfidence: 0,
        auditAgentOpinion: 'No invented fixtures.',
        auditAgentConfidence: 0,
        riskAgentOpinion: 'Unextracted.',
        riskAgentConfidence: 0,
        aiRecommendation: 'Fail closed.',
        relatedDocsCount: 1,
        relatedJeCount: 0,
        relatedAccountsCount: 0,
        relatedTasksCount: 0,
        agentOpinions: []
      });
    }

    return {
      category,
      classificationConfidence: extractedFacts.length > 0 ? 0.8 : 0,
      entityName,
      reportingPeriod: period,
      reportingCurrency: currency,
      unitScale,
      extractedFacts,
      bankSummary,
      bankTransactions,
      findings
    };
  }
}
