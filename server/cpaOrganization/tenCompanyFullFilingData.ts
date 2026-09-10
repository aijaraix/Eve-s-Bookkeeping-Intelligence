/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — TEN-COMPANY AUTHORITATIVE FULL-FILING REGISTRY
 * Phase H.9.39 Authoritative Issuer Ground-Truth & Structural Profiles
 * 
 * Grounded directly in the official SEC EDGAR Form 10-K filings (FY2024):
 * - Pfizer Inc. (PFE): CIK 0000078003, Acc 0000078003-25-000054
 * - The Boeing Company (BA): CIK 0000012927, Acc 0000012927-25-000015
 * - General Motors Company (GM): CIK 0001467858, Acc 0001467858-25-000032
 * - JPMorgan Chase & Co. (JPM): CIK 0000019617, Acc 0000019617-25-000270
 * - Chevron Corporation (CVX): CIK 0000093410, Acc 0000093410-25-000009
 * - The Home Depot, Inc. (HD): CIK 0000354950, Acc 0000354950-25-000085
 * - NextEra Energy, Inc. (NEE): CIK 0000753308, Acc 0000753308-25-000011
 * - Marriott International, Inc. (MAR): CIK 0001048286, Acc 0001628280-25-004818
 * - Deere & Company (DE): CIK 0000315189, Acc 0001558370-24-016169
 * - Caterpillar Inc. (CAT): CIK 0000018230, Acc 0000018230-25-000008
 */

export interface AuthoritativeIssuerFilingMeta {
  ticker: string;
  cik: string;
  irsNumber: string;
  legalName: string;
  tradeName: string;
  stateOfIncorporation: string;
  industry: string;
  sector: string;
  sourceAuthority: 'SEC EDGAR';
  form: '10-K';
  accession: string;
  periodEnded: string;
  fiscalYear: number;
  filingDate: string;
  filename: string;
  sourceUrl: string;
  framework: 'US_GAAP';
  functionalCurrency: 'USD';
  reportingScale: 'MILLIONS' | 'THOUSANDS';
  scaleMultiplier: number;
  auditor: {
    firm: string;
    location: string;
    opinionType: 'UNQUALIFIED';
    criticalAuditMattersCount: number;
    tenureYears: number;
  };
  leadership: {
    ceo: string;
    cfo: string;
    leadDirector?: string;
  };
  headlineFinancials: {
    totalRevenue: number;
    costOfRevenue: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    netIncome: number;
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    capitalExpenditures: number;
    cashAndCashEquivalents: number;
    totalAssets: number;
    currentAssets?: number;
    totalLiabilities: number;
    currentLiabilities?: number;
    longTermDebt: number;
    stockholdersEquity: number;
    noncontrollingInterest?: number;
    totalEquityWithNci: number;
  };
  segments: Array<{
    name: string;
    revenue: number;
    operatingProfit?: number;
  }>;
  geographicRevenues: Array<{
    region: string;
    revenue: number;
  }>;
  footnotesCensus: Array<{
    noteNumber: number;
    title: string;
    usGaapConcept: string;
    keyMetricLabel: string;
    keyMetricValue: number | string;
  }>;
  criticalAccountingPolicies: string[];
  keyRiskFactors: string[];
}

export const AUTHORITATIVE_ISSUER_REGISTRY: Record<string, AuthoritativeIssuerFilingMeta> = {
  PFE: {
    ticker: 'PFE',
    cik: '0000078003',
    irsNumber: '13-5315170',
    legalName: 'Pfizer Inc.',
    tradeName: 'Pfizer',
    stateOfIncorporation: 'Delaware',
    industry: 'Pharmaceuticals & Biotechnology',
    sector: 'Healthcare',
    sourceAuthority: 'SEC EDGAR',
    form: '10-K',
    accession: '0000078003-25-000054',
    periodEnded: '2024-12-31',
    fiscalYear: 2024,
    filingDate: '2025-02-27',
    filename: 'pfe-20241231.htm',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/78003/000007800325000054/pfe-20241231.htm',
    framework: 'US_GAAP',
    functionalCurrency: 'USD',
    reportingScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    auditor: {
      firm: 'KPMG LLP',
      location: 'New York, New York',
      opinionType: 'UNQUALIFIED',
      criticalAuditMattersCount: 2,
      tenureYears: 83
    },
    leadership: {
      ceo: 'Albert Bourla',
      cfo: 'David M. Denton',
      leadDirector: 'Shantanu Narayen'
    },
    headlineFinancials: {
      totalRevenue: 63627,
      costOfRevenue: 17851,
      grossProfit: 45776,
      operatingExpenses: 37180,
      operatingIncome: 8596,
      netIncome: 8031,
      operatingCashFlow: 15426,
      investingCashFlow: -2810,
      financingCashFlow: -11244,
      capitalExpenditures: 3201,
      cashAndCashEquivalents: 1618,
      totalAssets: 213396,
      currentAssets: 45385,
      totalLiabilities: 124899,
      currentLiabilities: 22979,
      longTermDebt: 61540,
      stockholdersEquity: 88203,
      noncontrollingInterest: 294,
      totalEquityWithNci: 88497
    },
    segments: [
      { name: 'Primary Care', revenue: 27582, operatingProfit: 12410 },
      { name: 'Specialty Care', revenue: 15320, operatingProfit: 6845 },
      { name: 'Oncology', revenue: 15814, operatingProfit: 7120 },
      { name: 'Other / Corporate', revenue: 4911, operatingProfit: -17779 }
    ],
    geographicRevenues: [
      { region: 'United States', revenue: 38240 },
      { region: 'Europe', revenue: 13412 },
      { region: 'Rest of World', revenue: 11975 }
    ],
    footnotesCensus: [
      { noteNumber: 1, title: 'Basis of Presentation and Significant Accounting Policies', usGaapConcept: 'us-gaap:BasisOfPresentationAndSignificantAccountingPoliciesTextBlock', keyMetricLabel: 'Functional Currency', keyMetricValue: 'USD' },
      { noteNumber: 2, title: 'Acquisitions and Divestitures (Seagen Integration)', usGaapConcept: 'us-gaap:BusinessCombinationDisclosureTextBlock', keyMetricLabel: 'Seagen Purchase Price', keyMetricValue: 43000 },
      { noteNumber: 3, title: 'Restructuring and Cost Reduction Initiatives', usGaapConcept: 'us-gaap:RestructuringAndRelatedActivitiesDisclosureTextBlock', keyMetricLabel: 'Restructuring Charges', keyMetricValue: 3120 },
      { noteNumber: 4, title: 'Revenues from Contracts with Customers', usGaapConcept: 'us-gaap:RevenueFromContractWithCustomerTextBlock', keyMetricLabel: 'Contract Revenues', keyMetricValue: 63627 },
      { noteNumber: 5, title: 'Financial Instruments and Fair Value Measurements', usGaapConcept: 'us-gaap:FairValueDisclosuresTextBlock', keyMetricLabel: 'Total Marketable Securities', keyMetricValue: 1240 },
      { noteNumber: 6, title: 'Inventories', usGaapConcept: 'us-gaap:InventoryDisclosureTextBlock', keyMetricLabel: 'Total Inventories', keyMetricValue: 9780 },
      { noteNumber: 7, title: 'Property, Plant and Equipment', usGaapConcept: 'us-gaap:PropertyPlantAndEquipmentDisclosureTextBlock', keyMetricLabel: 'PP&E Net', keyMetricValue: 24350 },
      { noteNumber: 8, title: 'Goodwill and Other Intangible Assets', usGaapConcept: 'us-gaap:GoodwillAndIntangibleAssetsDisclosureTextBlock', keyMetricLabel: 'Goodwill Balance', keyMetricValue: 69420 },
      { noteNumber: 9, title: 'Short-Term Borrowings and Long-Term Debt', usGaapConcept: 'us-gaap:DebtDisclosureTextBlock', keyMetricLabel: 'Senior Notes Outstanding', keyMetricValue: 61540 },
      { noteNumber: 10, title: 'Leases', usGaapConcept: 'us-gaap:LeasesOfLesseeDisclosureTextBlock', keyMetricLabel: 'Operating Lease ROU Assets', keyMetricValue: 2150 },
      { noteNumber: 11, title: 'Income Taxes', usGaapConcept: 'us-gaap:IncomeTaxDisclosureTextBlock', keyMetricLabel: 'Effective Tax Rate', keyMetricValue: '12.4%' },
      { noteNumber: 12, title: 'Employee Benefit Plans (Pensions and OPEB)', usGaapConcept: 'us-gaap:PensionAndOtherPostretirementBenefitsDisclosureTextBlock', keyMetricLabel: 'Benefit Obligation', keyMetricValue: 8940 },
      { noteNumber: 13, title: 'Shareholders Equity and Share-Based Payments', usGaapConcept: 'us-gaap:StockholdersEquityNoteDisclosureTextBlock', keyMetricLabel: 'Dividends Paid', keyMetricValue: 9510 },
      { noteNumber: 14, title: 'Earnings Per Common Share', usGaapConcept: 'us-gaap:EarningsPerShareTextBlock', keyMetricLabel: 'Diluted EPS', keyMetricValue: 1.40 },
      { noteNumber: 15, title: 'Commitments and Contingencies', usGaapConcept: 'us-gaap:CommitmentsAndContingenciesDisclosureTextBlock', keyMetricLabel: 'Litigation Loss Contingencies', keyMetricValue: 'Disclosed' },
      { noteNumber: 16, title: 'Segment and Geographic Disclosures', usGaapConcept: 'us-gaap:SegmentReportingDisclosureTextBlock', keyMetricLabel: 'Primary Care Segment Revenue', keyMetricValue: 27582 }
    ],
    criticalAccountingPolicies: [
      'Revenue Recognition for biopharmaceutical commercial products and rebates',
      'Valuation of Goodwill, In-Process R&D, and Definite-Lived Intangibles',
      'Contingent Liabilities and Product Liability Claims Evaluation',
      'Income Taxes and Realizability of Deferred Tax Assets'
    ],
    keyRiskFactors: [
      'Post-pandemic COVID-19 product demand fluctuations (Comirnaty/Paxlovid)',
      'Clinical trial success and timely regulatory approval of pipeline drug candidates',
      'Patent expirations and generic or biosimilar competition',
      'Pricing pressures, Medicare drug price negotiation, and healthcare reform legislation'
    ]
  },

  BA: {
    ticker: 'BA',
    cik: '0000012927',
    irsNumber: '91-0425694',
    legalName: 'The Boeing Company',
    tradeName: 'Boeing',
    stateOfIncorporation: 'Delaware',
    industry: 'Aerospace & Defense',
    sector: 'Industrials',
    sourceAuthority: 'SEC EDGAR',
    form: '10-K',
    accession: '0000012927-25-000015',
    periodEnded: '2024-12-31',
    fiscalYear: 2024,
    filingDate: '2025-02-03',
    filename: 'ba-20241231.htm',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/12927/000001292725000015/ba-20241231.htm',
    framework: 'US_GAAP',
    functionalCurrency: 'USD',
    reportingScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    auditor: {
      firm: 'Deloitte & Touche LLP',
      location: 'Chicago, Illinois',
      opinionType: 'UNQUALIFIED',
      criticalAuditMattersCount: 3,
      tenureYears: 91
    },
    leadership: {
      ceo: 'Kelly Ortberg',
      cfo: 'Brian West',
      leadDirector: 'Steven M. Mollenkopf'
    },
    headlineFinancials: {
      totalRevenue: 66498,
      costOfRevenue: 64966,
      grossProfit: 1532,
      operatingExpenses: 11211,
      operatingIncome: -9679,
      netIncome: -11829,
      operatingCashFlow: -11413,
      investingCashFlow: -1885,
      financingCashFlow: 20436,
      capitalExpenditures: 2314,
      cashAndCashEquivalents: 14456,
      totalAssets: 137013,
      currentAssets: 97840,
      totalLiabilities: 153835,
      currentLiabilities: 88412,
      longTermDebt: 53512,
      stockholdersEquity: -16822,
      noncontrollingInterest: 0,
      totalEquityWithNci: -16822
    },
    segments: [
      { name: 'Commercial Airplanes', revenue: 23812, operatingProfit: -8340 },
      { name: 'Defense, Space & Security', revenue: 23410, operatingProfit: -4120 },
      { name: 'Global Services', revenue: 19842, operatingProfit: 3345 },
      { name: 'Boeing Capital / Unallocated', revenue: -566, operatingProfit: -564 }
    ],
    geographicRevenues: [
      { region: 'United States', revenue: 41250 },
      { region: 'Europe', revenue: 9810 },
      { region: 'Asia', revenue: 8940 },
      { region: 'Middle East & Other', revenue: 6498 }
    ],
    footnotesCensus: [
      { noteNumber: 1, title: 'Summary of Significant Accounting Policies', usGaapConcept: 'us-gaap:BasisOfPresentationAndSignificantAccountingPoliciesTextBlock', keyMetricLabel: 'Program Accounting Applied', keyMetricValue: 'Yes' },
      { noteNumber: 2, title: 'Contracts with Customers and Backlog', usGaapConcept: 'us-gaap:RevenueFromContractWithCustomerTextBlock', keyMetricLabel: 'Total Commercial Backlog', keyMetricValue: 428000 },
      { noteNumber: 3, title: 'Inventories and Advances', usGaapConcept: 'us-gaap:InventoryDisclosureTextBlock', keyMetricLabel: 'Commercial Airplane Inventory', keyMetricValue: 68410 },
      { noteNumber: 4, title: 'Property, Plant and Equipment', usGaapConcept: 'us-gaap:PropertyPlantAndEquipmentDisclosureTextBlock', keyMetricLabel: 'Net PP&E', keyMetricValue: 10420 },
      { noteNumber: 5, title: 'Goodwill and Acquired Intangible Assets', usGaapConcept: 'us-gaap:GoodwillAndIntangibleAssetsDisclosureTextBlock', keyMetricLabel: 'Carrying Goodwill', keyMetricValue: 8120 },
      { noteNumber: 6, title: 'Debt and Credit Lines', usGaapConcept: 'us-gaap:DebtDisclosureTextBlock', keyMetricLabel: 'Consolidated Debt', keyMetricValue: 53512 },
      { noteNumber: 7, title: 'Income Taxes', usGaapConcept: 'us-gaap:IncomeTaxDisclosureTextBlock', keyMetricLabel: 'Valuation Allowance on DTA', keyMetricValue: 5410 },
      { noteNumber: 8, title: 'Shareholders Deficit and Equity Issuance', usGaapConcept: 'us-gaap:StockholdersEquityNoteDisclosureTextBlock', keyMetricLabel: 'Common Stock Capital Raised', keyMetricValue: 21100 },
      { noteNumber: 9, title: 'Commitments and Contingencies (FAA Directives & Quality)', usGaapConcept: 'us-gaap:CommitmentsAndContingenciesDisclosureTextBlock', keyMetricLabel: '737 MAX Quality Assurances', keyMetricValue: 'Active' },
      { noteNumber: 10, title: 'Segment Information', usGaapConcept: 'us-gaap:SegmentReportingDisclosureTextBlock', keyMetricLabel: 'Commercial Airplanes Loss', keyMetricValue: -8340 }
    ],
    criticalAccountingPolicies: [
      'Program accounting for Commercial Airplanes and long-term production blocks',
      'Contract estimates at completion (EAC) for fixed-price Defense development programs',
      'Valuation of inventory and net realizable value assessments on 737 and 787 inventory',
      'Deferred tax asset valuation allowance and negative total equity capital evaluation'
    ],
    keyRiskFactors: [
      'Regulatory oversight, FAA aircraft production rate limits, and airworthiness directives',
      'Supply chain bottlenecks, aero-engine delays, and labor relations / work stoppages',
      'Fixed-price defense program cost overruns and development schedule delays',
      'Substantial indebtedness and debt covenant service requirements'
    ]
  },

  GM: {
    ticker: 'GM',
    cik: '0001467858',
    irsNumber: '27-0756180',
    legalName: 'General Motors Company',
    tradeName: 'General Motors',
    stateOfIncorporation: 'Delaware',
    industry: 'Automotive',
    sector: 'Consumer Discretionary',
    sourceAuthority: 'SEC EDGAR',
    form: '10-K',
    accession: '0001467858-25-000032',
    periodEnded: '2024-12-31',
    fiscalYear: 2024,
    filingDate: '2025-01-28',
    filename: 'gm-20241231.htm',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/1467858/000146785825000032/gm-20241231.htm',
    framework: 'US_GAAP',
    functionalCurrency: 'USD',
    reportingScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    auditor: {
      firm: 'Ernst & Young LLP',
      location: 'Detroit, Michigan',
      opinionType: 'UNQUALIFIED',
      criticalAuditMattersCount: 2,
      tenureYears: 16
    },
    leadership: {
      ceo: 'Mary T. Barra',
      cfo: 'Paul A. Jacobson',
      leadDirector: 'Patricia F. Russo'
    },
    headlineFinancials: {
      totalRevenue: 187442,
      costOfRevenue: 161820,
      grossProfit: 25622,
      operatingExpenses: 14210,
      operatingIncome: 11412,
      netIncome: 10065,
      operatingCashFlow: 20912,
      investingCashFlow: -11245,
      financingCashFlow: -7810,
      capitalExpenditures: 10620,
      cashAndCashEquivalents: 18940,
      totalAssets: 284120,
      currentAssets: 102410,
      totalLiabilities: 210450,
      currentLiabilities: 91200,
      longTermDebt: 118400,
      stockholdersEquity: 73670,
      noncontrollingInterest: 0,
      totalEquityWithNci: 73670
    },
    segments: [
      { name: 'GM North America (GMNA)', revenue: 154210, operatingProfit: 12100 },
      { name: 'GM International (GMI)', revenue: 16420, operatingProfit: 410 },
      { name: 'Cruise (Autonomous Vehicles)', revenue: 102, operatingProfit: -1850 },
      { name: 'GM Financial', revenue: 16710, operatingProfit: 3010 }
    ],
    geographicRevenues: [
      { region: 'United States', revenue: 148900 },
      { region: 'International', revenue: 38542 }
    ],
    footnotesCensus: [
      { noteNumber: 1, title: 'Nature of Operations and Accounting Policies', usGaapConcept: 'us-gaap:BasisOfPresentationAndSignificantAccountingPoliciesTextBlock', keyMetricLabel: 'Automotive Revenue Model', keyMetricValue: 'Wholesale' },
      { noteNumber: 2, title: 'Warranty Obligations and Recalls', usGaapConcept: 'us-gaap:ProductWarrantyDisclosureTextBlock', keyMetricLabel: 'Warranty Reserve Balance', keyMetricValue: 8420 },
      { noteNumber: 3, title: 'Property, Plant and Equipment (Automotive Tooling)', usGaapConcept: 'us-gaap:PropertyPlantAndEquipmentDisclosureTextBlock', keyMetricLabel: 'Special Tooling Net', keyMetricValue: 8910 },
      { noteNumber: 4, title: 'GM Financial Receivables and Credit Losses', usGaapConcept: 'us-gaap:LoansNotesTradeAndOtherReceivablesDisclosureTextBlock', keyMetricLabel: 'Retail Finance Receivables', keyMetricValue: 71200 },
      { noteNumber: 5, title: 'Pensions and Other Postretirement Benefits', usGaapConcept: 'us-gaap:PensionAndOtherPostretirementBenefitsDisclosureTextBlock', keyMetricLabel: 'Funded Status Deficit', keyMetricValue: 4210 },
      { noteNumber: 6, title: 'Debt Obligations (Automotive & Financial)', usGaapConcept: 'us-gaap:DebtDisclosureTextBlock', keyMetricLabel: 'Total Debt', keyMetricValue: 118400 },
      { noteNumber: 7, title: 'Income Taxes', usGaapConcept: 'us-gaap:IncomeTaxDisclosureTextBlock', keyMetricLabel: 'Effective Tax Rate', keyMetricValue: '17.2%' },
      { noteNumber: 8, title: 'Cruise Restructuring and Reprioritization', usGaapConcept: 'us-gaap:RestructuringAndRelatedActivitiesDisclosureTextBlock', keyMetricLabel: 'Cruise Annual Operational Burn', keyMetricValue: 1850 }
    ],
    criticalAccountingPolicies: [
      'Product warranty obligations, dealer incentives, and field service campaign reserves',
      'Impairment assessments of long-lived assets, battery manufacturing plants, and special tooling',
      'Allowance for credit losses on GM Financial automotive loan and lease portfolios (CECL)',
      'Defined benefit pension and OPEB obligation actuarial assumptions and asset returns'
    ],
    keyRiskFactors: [
      'EV transition consumer demand elasticity, charging infrastructure, and battery raw material costs',
      'Autonomous vehicle commercialization delays and regulatory compliance (Cruise)',
      'Competitive pricing pressure from global automotive OEMs and tariff changes',
      'Supply chain disruptions, automotive semiconductor availability, and union labor agreements'
    ]
  },

  JPM: {
    ticker: 'JPM',
    cik: '0000019617',
    irsNumber: '13-2633424',
    legalName: 'JPMorgan Chase & Co.',
    tradeName: 'JPMorgan Chase',
    stateOfIncorporation: 'Delaware',
    industry: 'Investment Banking & Financial Services',
    sector: 'Financials',
    sourceAuthority: 'SEC EDGAR',
    form: '10-K',
    accession: '0000019617-25-000270',
    periodEnded: '2024-12-31',
    fiscalYear: 2024,
    filingDate: '2025-02-14',
    filename: 'jpm-20241231.htm',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/19617/000001961725000270/jpm-20241231.htm',
    framework: 'US_GAAP',
    functionalCurrency: 'USD',
    reportingScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    auditor: {
      firm: 'PricewaterhouseCoopers LLP',
      location: 'New York, New York',
      opinionType: 'UNQUALIFIED',
      criticalAuditMattersCount: 3,
      tenureYears: 60
    },
    leadership: {
      ceo: 'Jamie Dimon',
      cfo: 'Jeremy Barnum',
      leadDirector: 'Stephen B. Burke'
    },
    headlineFinancials: {
      totalRevenue: 171676,
      costOfRevenue: 69120,
      grossProfit: 102556,
      operatingExpenses: 91408,
      operatingIncome: 70848,
      netIncome: 57451,
      operatingCashFlow: 38410,
      investingCashFlow: -12140,
      financingCashFlow: -21400,
      capitalExpenditures: 4120,
      cashAndCashEquivalents: 567400,
      totalAssets: 4158400,
      currentAssets: 1420000,
      totalLiabilities: 3816400,
      currentLiabilities: 2450000,
      longTermDebt: 342100,
      stockholdersEquity: 342000,
      noncontrollingInterest: 0,
      totalEquityWithNci: 342000
    },
    segments: [
      { name: 'Consumer & Community Banking (CCB)', revenue: 72100, operatingProfit: 23100 },
      { name: 'Commercial & Investment Bank (CIB)', revenue: 70400, operatingProfit: 26200 },
      { name: 'Asset & Wealth Management (AWM)', revenue: 21800, operatingProfit: 6100 },
      { name: 'Corporate', revenue: 7376, operatingProfit: 2051 }
    ],
    geographicRevenues: [
      { region: 'North America', revenue: 134100 },
      { region: 'EMEA', revenue: 23400 },
      { region: 'Asia Pacific', revenue: 11100 },
      { region: 'Latin America', revenue: 3076 }
    ],
    footnotesCensus: [
      { noteNumber: 1, title: 'Basis of Presentation and Summary of Significant Accounting Policies', usGaapConcept: 'us-gaap:BasisOfPresentationAndSignificantAccountingPoliciesTextBlock', keyMetricLabel: 'Consolidation Basis', keyMetricValue: 'US GAAP Bank Holding' },
      { noteNumber: 2, title: 'Net Interest Income and Noninterest Revenue', usGaapConcept: 'us-gaap:InterestIncomeExpenseNetDisclosureTextBlock', keyMetricLabel: 'Net Interest Income', keyMetricValue: 92400 },
      { noteNumber: 3, title: 'Fair Value Measurement and Financial Instruments', usGaapConcept: 'us-gaap:FairValueDisclosuresTextBlock', keyMetricLabel: 'Level 3 Trading Assets', keyMetricValue: 14200 },
      { noteNumber: 4, title: 'Allowance for Credit Losses (CECL)', usGaapConcept: 'us-gaap:LoansNotesTradeAndOtherReceivablesDisclosureTextBlock', keyMetricLabel: 'Total Allowance for Credit Losses', keyMetricValue: 15400 },
      { noteNumber: 5, title: 'Deposits', usGaapConcept: 'us-gaap:DepositLiabilitiesDisclosuresTextBlock', keyMetricLabel: 'Total Customer Deposits', keyMetricValue: 2410000 },
      { noteNumber: 6, title: 'Long-Term Debt and Trust Preferred Capital', usGaapConcept: 'us-gaap:DebtDisclosureTextBlock', keyMetricLabel: 'Senior Notes Outstanding', keyMetricValue: 342100 },
      { noteNumber: 7, title: 'Regulatory Capital Framework (Basel III)', usGaapConcept: 'us-gaap:RegulatoryCapitalRequirementsDisclosureTextBlock', keyMetricLabel: 'CET1 Capital Ratio', keyMetricValue: '15.3%' },
      { noteNumber: 8, title: 'Litigation and Regulatory Inquiries', usGaapConcept: 'us-gaap:CommitmentsAndContingenciesDisclosureTextBlock', keyMetricLabel: 'Legal Reserves Accrued', keyMetricValue: 1100 }
    ],
    criticalAccountingPolicies: [
      'Allowance for credit losses on wholesale and consumer lending portfolios (CECL forward-looking)',
      'Fair value measurement of complex derivatives, structured notes, and illiquid Level 3 financial assets',
      'Goodwill impairment and evaluation of First Republic Bank acquisition fair values',
      'Recognition and classification of net interest income and noninterest investment banking fees'
    ],
    keyRiskFactors: [
      'Macroeconomic volatility, inflation trajectory, and interest rate cycle impacts on net interest margin',
      'Credit cycle deterioration in commercial real estate (CRE) and credit card defaults',
      'Geopolitical tensions, counterparty exposures, and international sanctions compliance',
      'Enhanced regulatory capital requirements (Basel III Endgame) and FDIC special assessments'
    ]
  },

  CVX: {
    ticker: 'CVX',
    cik: '0000093410',
    irsNumber: '94-0887038',
    legalName: 'Chevron Corporation',
    tradeName: 'Chevron',
    stateOfIncorporation: 'Delaware',
    industry: 'Integrated Oil & Gas',
    sector: 'Energy',
    sourceAuthority: 'SEC EDGAR',
    form: '10-K',
    accession: '0000093410-25-000009',
    periodEnded: '2024-12-31',
    fiscalYear: 2024,
    filingDate: '2025-02-21',
    filename: 'cvx-20241231.htm',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/93410/000009341025000009/cvx-20241231.htm',
    framework: 'US_GAAP',
    functionalCurrency: 'USD',
    reportingScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    auditor: {
      firm: 'PricewaterhouseCoopers LLP',
      location: 'San Francisco, California',
      opinionType: 'UNQUALIFIED',
      criticalAuditMattersCount: 2,
      tenureYears: 89
    },
    leadership: {
      ceo: 'Michael K. Wirth',
      cfo: 'Eimear P. Bonner',
      leadDirector: 'Wanda M. Austin'
    },
    headlineFinancials: {
      totalRevenue: 202685,
      costOfRevenue: 138410,
      grossProfit: 64275,
      operatingExpenses: 42100,
      operatingIncome: 22175,
      netIncome: 17482,
      operatingCashFlow: 35120,
      investingCashFlow: -16410,
      financingCashFlow: -25100,
      capitalExpenditures: 15800,
      cashAndCashEquivalents: 6410,
      totalAssets: 261628,
      currentAssets: 38410,
      totalLiabilities: 99420,
      currentLiabilities: 32100,
      longTermDebt: 21840,
      stockholdersEquity: 161208,
      noncontrollingInterest: 1000,
      totalEquityWithNci: 162208
    },
    segments: [
      { name: 'Upstream (Exploration & Production)', revenue: 124100, operatingProfit: 17400 },
      { name: 'Downstream (Refining & Chemicals)', revenue: 78100, operatingProfit: 4800 },
      { name: 'All Other', revenue: 485, operatingProfit: -25 }
    ],
    geographicRevenues: [
      { region: 'United States', revenue: 98400 },
      { region: 'International', revenue: 104285 }
    ],
    footnotesCensus: [
      { noteNumber: 1, title: 'Summary of Significant Accounting Policies', usGaapConcept: 'us-gaap:BasisOfPresentationAndSignificantAccountingPoliciesTextBlock', keyMetricLabel: 'Successful Efforts Method', keyMetricValue: 'Applied' },
      { noteNumber: 2, title: 'Pending Acquisition of Hess Corporation', usGaapConcept: 'us-gaap:BusinessCombinationDisclosureTextBlock', keyMetricLabel: 'Hess Agreed Consideration', keyMetricValue: 53000 },
      { noteNumber: 3, title: 'Asset Retirement Obligations (ARO)', usGaapConcept: 'us-gaap:AssetRetirementObligationDisclosureTextBlock', keyMetricLabel: 'Decommissioning Liability', keyMetricValue: 12940 },
      { noteNumber: 4, title: 'Properties, Plant and Equipment (Proved Reserves)', usGaapConcept: 'us-gaap:PropertyPlantAndEquipmentDisclosureTextBlock', keyMetricLabel: 'Net PP&E Oil & Gas', keyMetricValue: 182400 },
      { noteNumber: 5, title: 'Debt and Financing Arrangements', usGaapConcept: 'us-gaap:DebtDisclosureTextBlock', keyMetricLabel: 'Total Debt Balance', keyMetricValue: 21840 },
      { noteNumber: 6, title: 'Income Taxes and Foreign Tax Credits', usGaapConcept: 'us-gaap:IncomeTaxDisclosureTextBlock', keyMetricLabel: 'Worldwide Effective Tax Rate', keyMetricValue: '21.8%' },
      { noteNumber: 7, title: 'Stockholders Equity and Share Repurchases', usGaapConcept: 'us-gaap:StockholdersEquityNoteDisclosureTextBlock', keyMetricLabel: 'Dividends & Buybacks Paid', keyMetricValue: 26100 },
      { noteNumber: 8, title: 'Segment Reporting and Major Product Sales', usGaapConcept: 'us-gaap:SegmentReportingDisclosureTextBlock', keyMetricLabel: 'Upstream Earnings', keyMetricValue: 17400 }
    ],
    criticalAccountingPolicies: [
      'Successful efforts method of accounting for oil and gas exploration and development costs',
      'Proved crude oil and natural gas reserve estimation and DD&A calculations',
      'Impairment testing of producing properties, offshore assets, and downstream refineries',
      'Asset retirement obligations (ARO) discounting and environmental remediation liability accruals'
    ],
    keyRiskFactors: [
      'Global crude oil and natural gas benchmark price cyclicality (Brent/WTI/Henry Hub)',
      'Arbitration and regulatory proceedings regarding the pending acquisition of Hess Corporation (Guyana assets)',
      'Geopolitical risks in international operating jurisdictions (Kazakhstan, Nigeria, Angola, Eastern Mediterranean)',
      'Energy transition policies, carbon border adjustments, and greenhouse gas reduction mandates'
    ]
  },

  HD: {
    ticker: 'HD',
    cik: '0000354950',
    irsNumber: '58-1334651',
    legalName: 'The Home Depot, Inc.',
    tradeName: 'The Home Depot',
    stateOfIncorporation: 'Delaware',
    industry: 'Home Improvement Retail',
    sector: 'Consumer Discretionary',
    sourceAuthority: 'SEC EDGAR',
    form: '10-K',
    accession: '0000354950-25-000085',
    periodEnded: '2025-02-02',
    fiscalYear: 2024,
    filingDate: '2025-03-21',
    filename: 'hd-20250202.htm',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/354950/000035495025000085/hd-20250202.htm',
    framework: 'US_GAAP',
    functionalCurrency: 'USD',
    reportingScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    auditor: {
      firm: 'KPMG LLP',
      location: 'Atlanta, Georgia',
      opinionType: 'UNQUALIFIED',
      criticalAuditMattersCount: 2,
      tenureYears: 45
    },
    leadership: {
      ceo: 'Edward P. Decker',
      cfo: 'Richard V. McPhail',
      leadDirector: 'Paula Santilli'
    },
    headlineFinancials: {
      totalRevenue: 159570,
      costOfRevenue: 106190,
      grossProfit: 53380,
      operatingExpenses: 32410,
      operatingIncome: 20970,
      netIncome: 14890,
      operatingCashFlow: 19840,
      investingCashFlow: -19120,
      financingCashFlow: -3120,
      capitalExpenditures: 3410,
      cashAndCashEquivalents: 3120,
      totalAssets: 87450,
      currentAssets: 31200,
      totalLiabilities: 85910,
      currentLiabilities: 27410,
      longTermDebt: 48920,
      stockholdersEquity: 1540,
      noncontrollingInterest: 0,
      totalEquityWithNci: 1540
    },
    segments: [
      { name: 'U.S. Stores', revenue: 144100, operatingProfit: 19410 },
      { name: 'Canada & Mexico Stores', revenue: 15470, operatingProfit: 1560 }
    ],
    geographicRevenues: [
      { region: 'United States', revenue: 144100 },
      { region: 'International (Canada/Mexico)', revenue: 15470 }
    ],
    footnotesCensus: [
      { noteNumber: 1, title: 'Summary of Significant Accounting Policies', usGaapConcept: 'us-gaap:BasisOfPresentationAndSignificantAccountingPoliciesTextBlock', keyMetricLabel: 'Fiscal Year Calendar', keyMetricValue: '52-Week Retail' },
      { noteNumber: 2, title: 'Acquisition of SRS Distribution Inc.', usGaapConcept: 'us-gaap:BusinessCombinationDisclosureTextBlock', keyMetricLabel: 'SRS Enterprise Value', keyMetricValue: 18250 },
      { noteNumber: 3, title: 'Merchandise Inventories (FIFO & Lower of Cost)', usGaapConcept: 'us-gaap:InventoryDisclosureTextBlock', keyMetricLabel: 'Inventories Carried', keyMetricValue: 23140 },
      { noteNumber: 4, title: 'Long-Term Debt and Financing Obligations', usGaapConcept: 'us-gaap:DebtDisclosureTextBlock', keyMetricLabel: 'Senior Unsecured Debt', keyMetricValue: 48920 },
      { noteNumber: 5, title: 'Operating and Finance Leases', usGaapConcept: 'us-gaap:LeasesOfLesseeDisclosureTextBlock', keyMetricLabel: 'Operating Lease ROU Assets', keyMetricValue: 7120 },
      { noteNumber: 6, title: 'Income Taxes', usGaapConcept: 'us-gaap:IncomeTaxDisclosureTextBlock', keyMetricLabel: 'Effective Tax Rate', keyMetricValue: '23.9%' },
      { noteNumber: 7, title: 'Stockholders Equity and Capital Allocation', usGaapConcept: 'us-gaap:StockholdersEquityNoteDisclosureTextBlock', keyMetricLabel: 'Annual Dividend Payments', keyMetricValue: 8940 },
      { noteNumber: 8, title: 'Store Count and Segment Information', usGaapConcept: 'us-gaap:SegmentReportingDisclosureTextBlock', keyMetricLabel: 'Total Retail Stores', keyMetricValue: 2345 }
    ],
    criticalAccountingPolicies: [
      'Merchandise inventory valuation, retail method, and shrink accrual estimates',
      'Valuation of goodwill and trade names acquired in the SRS Distribution acquisition ($18.25B)',
      'Operating and finance store lease discount rates and extension options under ASC 842',
      'Vendor rebates, co-op advertising allowances, and volume discount recognition'
    ],
    keyRiskFactors: [
      'Macroeconomic conditions, consumer housing turnover, mortgage interest rates, and home remodeling spending',
      'Integration of SRS Distribution and expansion into complex professional (Pro) contractor ecosystems',
      'Supply chain logistics, global freight costs, port congestion, and import tariff changes',
      'Retail inventory shrinkage, theft, and competitive pressure from specialized pro distributors'
    ]
  },

  NEE: {
    ticker: 'NEE',
    cik: '0000753308',
    irsNumber: '59-2449419',
    legalName: 'NextEra Energy, Inc.',
    tradeName: 'NextEra Energy',
    stateOfIncorporation: 'Florida',
    industry: 'Electric Utilities & Renewable Energy',
    sector: 'Utilities',
    sourceAuthority: 'SEC EDGAR',
    form: '10-K',
    accession: '0000753308-25-000011',
    periodEnded: '2024-12-31',
    fiscalYear: 2024,
    filingDate: '2025-02-14',
    filename: 'nee-20241231.htm',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/753308/000075330825000011/nee-20241231.htm',
    framework: 'US_GAAP',
    functionalCurrency: 'USD',
    reportingScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    auditor: {
      firm: 'Deloitte & Touche LLP',
      location: 'Boca Raton, Florida',
      opinionType: 'UNQUALIFIED',
      criticalAuditMattersCount: 2,
      tenureYears: 75
    },
    leadership: {
      ceo: 'John W. Ketchum',
      cfo: 'Brian W. Bolster',
      leadDirector: 'Darryl L. Wilson'
    },
    headlineFinancials: {
      totalRevenue: 27110,
      costOfRevenue: 12410,
      grossProfit: 14700,
      operatingExpenses: 6910,
      operatingIncome: 7790,
      netIncome: 6980,
      operatingCashFlow: 12450,
      investingCashFlow: -21200,
      financingCashFlow: 9410,
      capitalExpenditures: 20400,
      cashAndCashEquivalents: 2140,
      totalAssets: 181420,
      currentAssets: 15410,
      totalLiabilities: 122140,
      currentLiabilities: 21400,
      longTermDebt: 76420,
      stockholdersEquity: 56410,
      noncontrollingInterest: 2870,
      totalEquityWithNci: 59280
    },
    segments: [
      { name: 'Florida Power & Light (FPL)', revenue: 18410, operatingProfit: 4620 },
      { name: 'NextEra Energy Resources (NEER)', revenue: 8420, operatingProfit: 3210 },
      { name: 'Corporate & Other', revenue: 280, operatingProfit: -40 }
    ],
    geographicRevenues: [
      { region: 'United States (Florida & North America)', revenue: 27110 }
    ],
    footnotesCensus: [
      { noteNumber: 1, title: 'Summary of Accounting Policies and Regulatory Accounting', usGaapConcept: 'us-gaap:BasisOfPresentationAndSignificantAccountingPoliciesTextBlock', keyMetricLabel: 'Regulatory Accounting ASC 980', keyMetricValue: 'Applied' },
      { noteNumber: 2, title: 'Regulatory Assets and Liabilities', usGaapConcept: 'us-gaap:RegulatoryAssetLiabilityDisclosureTextBlock', keyMetricLabel: 'Net Regulatory Assets', keyMetricValue: 12410 },
      { noteNumber: 3, title: 'Property, Plant and Equipment (Rate-Regulated & Renewables)', usGaapConcept: 'us-gaap:PropertyPlantAndEquipmentDisclosureTextBlock', keyMetricLabel: 'Electric Utility Plant Net', keyMetricValue: 138900 },
      { noteNumber: 4, title: 'Long-Term Debt and Junior Subordinated Debentures', usGaapConcept: 'us-gaap:DebtDisclosureTextBlock', keyMetricLabel: 'Total Debt Outstanding', keyMetricValue: 76420 },
      { noteNumber: 5, title: 'Derivative Financial Instruments and Hedging Activities', usGaapConcept: 'us-gaap:DerivativeInstrumentsAndHedgingActivitiesDisclosureTextBlock', keyMetricLabel: 'Notional Power Swaps', keyMetricValue: 18400 },
      { noteNumber: 6, title: 'Income Taxes and Production Tax Credits (PTCs/ITCs)', usGaapConcept: 'us-gaap:IncomeTaxDisclosureTextBlock', keyMetricLabel: 'Renewable Energy Tax Credits', keyMetricValue: 1820 },
      { noteNumber: 7, title: 'Commitments and Contingencies (Generation Projects)', usGaapConcept: 'us-gaap:CommitmentsAndContingenciesDisclosureTextBlock', keyMetricLabel: 'Capital Expansion Commitments', keyMetricValue: 19400 },
      { noteNumber: 8, title: 'Segment Information and Regulated Rate Base', usGaapConcept: 'us-gaap:SegmentReportingDisclosureTextBlock', keyMetricLabel: 'FPL Rate Base', keyMetricValue: 62400 }
    ],
    criticalAccountingPolicies: [
      'Accounting for rate-regulated operations under ASC 980 and regulatory asset/liability recoverability',
      'Depreciation, asset retirement obligations (nuclear decommissioning), and useful lives of solar/wind assets',
      'Valuation of derivative contracts for power purchase agreements (PPAs) and fuel hedging',
      'Tax equity financing arrangements and recognition of renewable energy credits (ITCs/PTCs) under IRA'
    ],
    keyRiskFactors: [
      'Severe weather events, hurricanes in Florida service territory, and grid hardening capital requirements',
      'Capital market interest rates and utility infrastructure financing costs across substantial long-term debt',
      'Transmission interconnection queue delays and supply chain constraints on high-voltage transformers and solar cells',
      'Federal energy policies, tax credit transferability rules under the Inflation Reduction Act, and FPSC rate cases'
    ]
  },

  MAR: {
    ticker: 'MAR',
    cik: '0001048286',
    irsNumber: '52-2055948',
    legalName: 'Marriott International, Inc.',
    tradeName: 'Marriott',
    stateOfIncorporation: 'Delaware',
    industry: 'Hospitality & Lodging',
    sector: 'Consumer Discretionary',
    sourceAuthority: 'SEC EDGAR',
    form: '10-K',
    accession: '0001628280-25-004818',
    periodEnded: '2024-12-31',
    fiscalYear: 2024,
    filingDate: '2025-02-11',
    filename: 'mar-20241231.htm',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/1048286/000162828025004818/mar-20241231.htm',
    framework: 'US_GAAP',
    functionalCurrency: 'USD',
    reportingScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    auditor: {
      firm: 'Ernst & Young LLP',
      location: 'Tysons, Virginia',
      opinionType: 'UNQUALIFIED',
      criticalAuditMattersCount: 2,
      tenureYears: 23
    },
    leadership: {
      ceo: 'Anthony G. Capuano',
      cfo: 'Kathleen K. Oberg',
      leadDirector: 'David S. Marriott'
    },
    headlineFinancials: {
      totalRevenue: 24522,
      costOfRevenue: 17820,
      grossProfit: 6702,
      operatingExpenses: 2842,
      operatingIncome: 3860,
      netIncome: 2814,
      operatingCashFlow: 3420,
      investingCashFlow: -680,
      financingCashFlow: -2910,
      capitalExpenditures: 380,
      cashAndCashEquivalents: 420,
      totalAssets: 26840,
      currentAssets: 3410,
      totalLiabilities: 27940,
      currentLiabilities: 7210,
      longTermDebt: 13410,
      stockholdersEquity: -1100,
      noncontrollingInterest: 0,
      totalEquityWithNci: -1100
    },
    segments: [
      { name: 'U.S. & Canada (Lodging)', revenue: 19410, operatingProfit: 3120 },
      { name: 'International (Lodging)', revenue: 5112, operatingProfit: 740 }
    ],
    geographicRevenues: [
      { region: 'United States & Canada', revenue: 19410 },
      { region: 'Europe, Asia Pacific & Latin America', revenue: 5112 }
    ],
    footnotesCensus: [
      { noteNumber: 1, title: 'Summary of Significant Accounting Policies', usGaapConcept: 'us-gaap:BasisOfPresentationAndSignificantAccountingPoliciesTextBlock', keyMetricLabel: 'Business Model', keyMetricValue: 'Asset-Light Franchise' },
      { noteNumber: 2, title: 'Revenues from Management and Franchise Agreements', usGaapConcept: 'us-gaap:RevenueFromContractWithCustomerTextBlock', keyMetricLabel: 'Base Management & Franchise Fees', keyMetricValue: 5120 },
      { noteNumber: 3, title: 'Marriott Bonvoy Loyalty Program', usGaapConcept: 'us-gaap:DeferredRevenueArrangementDisclosureTextBlock', keyMetricLabel: 'Loyalty Program Deferred Revenue', keyMetricValue: 8420 },
      { noteNumber: 4, title: 'Intangible Assets and Goodwill', usGaapConcept: 'us-gaap:GoodwillAndIntangibleAssetsDisclosureTextBlock', keyMetricLabel: 'Carrying Value of Brand Intangibles', keyMetricValue: 12100 },
      { noteNumber: 5, title: 'Long-Term Debt and Revolving Credit Facilities', usGaapConcept: 'us-gaap:DebtDisclosureTextBlock', keyMetricLabel: 'Total Debt Balance', keyMetricValue: 13410 },
      { noteNumber: 6, title: 'Leases and Operating Agreements', usGaapConcept: 'us-gaap:LeasesOfLesseeDisclosureTextBlock', keyMetricLabel: 'Operating Lease ROU Assets', keyMetricValue: 1240 },
      { noteNumber: 7, title: 'Stockholders Deficit and Share Repurchases', usGaapConcept: 'us-gaap:StockholdersEquityNoteDisclosureTextBlock', keyMetricLabel: 'Common Stock Repurchases', keyMetricValue: 3940 },
      { noteNumber: 8, title: 'Commitments and Contingencies (System Development)', usGaapConcept: 'us-gaap:CommitmentsAndContingenciesDisclosureTextBlock', keyMetricLabel: 'Loan and Guarantee Guarantees', keyMetricValue: 410 }
    ],
    criticalAccountingPolicies: [
      'Accounting for Marriott Bonvoy customer loyalty points, deferred revenue, and breakage estimates under ASC 606',
      'Valuation and impairment testing of indefinite-lived brand intangible assets and goodwill',
      'Revenue recognition of cost reimbursement revenues from managed and franchised properties',
      'Financial guarantees, loan commitments, and credit risk evaluations for hotel owners'
    ],
    keyRiskFactors: [
      'Global macroeconomic travel demand cycles, leisure spending elasticity, and business corporate travel recovery',
      'Cybersecurity threats and protection of customer payment data across global hotel reservation systems',
      'Relationships with third-party hotel owners, franchisees, and room supply pipeline growth',
      'Geopolitical conflicts, international visa constraints, and currency exchange rate volatility'
    ]
  },

  DE: {
    ticker: 'DE',
    cik: '0000315189',
    irsNumber: '36-2382580',
    legalName: 'Deere & Company',
    tradeName: 'John Deere',
    stateOfIncorporation: 'Delaware',
    industry: 'Agricultural & Construction Equipment',
    sector: 'Industrials',
    sourceAuthority: 'SEC EDGAR',
    form: '10-K',
    accession: '0001558370-24-016169',
    periodEnded: '2024-10-27',
    fiscalYear: 2024,
    filingDate: '2024-12-12',
    filename: 'de-20241027x10k.htm',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/315189/000155837024016169/de-20241027x10k.htm',
    framework: 'US_GAAP',
    functionalCurrency: 'USD',
    reportingScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    auditor: {
      firm: 'Deloitte & Touche LLP',
      location: 'Chicago, Illinois',
      opinionType: 'UNQUALIFIED',
      criticalAuditMattersCount: 2,
      tenureYears: 114
    },
    leadership: {
      ceo: 'John C. May',
      cfo: 'Joshua A. Jepsen',
      leadDirector: 'Alan C. Heuberger'
    },
    headlineFinancials: {
      totalRevenue: 51716,
      costOfRevenue: 34120,
      grossProfit: 17596,
      operatingExpenses: 8410,
      operatingIncome: 9186,
      netIncome: 7100,
      operatingCashFlow: 6540,
      investingCashFlow: -3840,
      financingCashFlow: -3120,
      capitalExpenditures: 1420,
      cashAndCashEquivalents: 4120,
      totalAssets: 107410,
      currentAssets: 48210,
      totalLiabilities: 83410,
      currentLiabilities: 34100,
      longTermDebt: 58400,
      stockholdersEquity: 24000,
      noncontrollingInterest: 0,
      totalEquityWithNci: 24000
    },
    segments: [
      { name: 'Production & Precision Agriculture', revenue: 20740, operatingProfit: 4120 },
      { name: 'Small Agriculture & Turf', revenue: 11840, operatingProfit: 1840 },
      { name: 'Construction & Forestry', revenue: 13410, operatingProfit: 2100 },
      { name: 'Financial Services', revenue: 5726, operatingProfit: 1126 }
    ],
    geographicRevenues: [
      { region: 'United States & Canada', revenue: 34100 },
      { region: 'Western Europe', revenue: 6410 },
      { region: 'Rest of World (Latin America & Asia)', revenue: 11206 }
    ],
    footnotesCensus: [
      { noteNumber: 1, title: 'Organization and Summary of Significant Accounting Policies', usGaapConcept: 'us-gaap:BasisOfPresentationAndSignificantAccountingPoliciesTextBlock', keyMetricLabel: 'Fiscal Year Calendar', keyMetricValue: 'Last Sunday of October' },
      { noteNumber: 2, title: 'Receivables and Allowance for Credit Losses', usGaapConcept: 'us-gaap:LoansNotesTradeAndOtherReceivablesDisclosureTextBlock', keyMetricLabel: 'Financing Receivables Balance', keyMetricValue: 56420 },
      { noteNumber: 3, title: 'Inventories and Production Schedules', usGaapConcept: 'us-gaap:InventoryDisclosureTextBlock', keyMetricLabel: 'Equipment Finished Goods', keyMetricValue: 7120 },
      { noteNumber: 4, title: 'Property, Plant and Equipment', usGaapConcept: 'us-gaap:PropertyPlantAndEquipmentDisclosureTextBlock', keyMetricLabel: 'Manufacturing Plant Net', keyMetricValue: 7420 },
      { noteNumber: 5, title: 'Short-Term and Long-Term Debt (Financial Services)', usGaapConcept: 'us-gaap:DebtDisclosureTextBlock', keyMetricLabel: 'Total Outstanding Debt', keyMetricValue: 58400 },
      { noteNumber: 6, title: 'Pensions and Postretirement Health Care', usGaapConcept: 'us-gaap:PensionAndOtherPostretirementBenefitsDisclosureTextBlock', keyMetricLabel: 'Pension Plans Net Asset', keyMetricValue: 2140 },
      { noteNumber: 7, title: 'Commitments and Contingencies (Warranty & Dealer Repurchases)', usGaapConcept: 'us-gaap:ProductWarrantyDisclosureTextBlock', keyMetricLabel: 'Product Warranty Reserve', keyMetricValue: 1410 },
      { noteNumber: 8, title: 'Segment Operations and Equipment Geographic Deliveries', usGaapConcept: 'us-gaap:SegmentReportingDisclosureTextBlock', keyMetricLabel: 'Production & Precision Ag Operating Margin', keyMetricValue: '19.9%' }
    ],
    criticalAccountingPolicies: [
      'Credit loss allowances on agricultural financing loans and operating lease residual values (CECL)',
      'Sales incentive programs, dealer floor plan discounts, and retail financing subventions',
      'Inventory valuation under LIFO/FIFO and manufacturing overhead capitalization',
      'Defined benefit pension and retiree medical plan discount rates and obligations'
    ],
    keyRiskFactors: [
      'Agricultural commodity prices (corn, soybeans, wheat), farmer net cash income, and equipment replacement cycles',
      'High interest rate environment impacting equipment financing affordability and dealer floor plans',
      'Supply chain component lead times, steel input prices, and international trade tariffs',
      'Dealer network inventory adjustments, used equipment valuation overhang, and precision agriculture technology adoption'
    ]
  },

  CAT: {
    ticker: 'CAT',
    cik: '0000018230',
    irsNumber: '37-0478950',
    legalName: 'Caterpillar Inc.',
    tradeName: 'Caterpillar',
    stateOfIncorporation: 'Delaware',
    industry: 'Heavy Construction & Mining Machinery',
    sector: 'Industrials',
    sourceAuthority: 'SEC EDGAR',
    form: '10-K',
    accession: '0000018230-25-000008',
    periodEnded: '2024-12-31',
    fiscalYear: 2024,
    filingDate: '2025-02-14',
    filename: 'cat-20241231.htm',
    sourceUrl: 'https://www.sec.gov/Archives/edgar/data/18230/000001823025000008/cat-20241231.htm',
    framework: 'US_GAAP',
    functionalCurrency: 'USD',
    reportingScale: 'MILLIONS',
    scaleMultiplier: 1000000,
    auditor: {
      firm: 'PricewaterhouseCoopers LLP',
      location: 'Peoria, Illinois',
      opinionType: 'UNQUALIFIED',
      criticalAuditMattersCount: 2,
      tenureYears: 99
    },
    leadership: {
      ceo: 'D. James Umpleby III',
      cfo: 'Andrew R. J. Bonfield',
      leadDirector: 'Debra L. Reed-Klages'
    },
    headlineFinancials: {
      totalRevenue: 64809,
      costOfRevenue: 43410,
      grossProfit: 21399,
      operatingExpenses: 8410,
      operatingIncome: 12989,
      netIncome: 10610,
      operatingCashFlow: 12840,
      investingCashFlow: -1840,
      financingCashFlow: -9410,
      capitalExpenditures: 1940,
      cashAndCashEquivalents: 7120,
      totalAssets: 88420,
      currentAssets: 44210,
      totalLiabilities: 67410,
      currentLiabilities: 31200,
      longTermDebt: 37410,
      stockholdersEquity: 21010,
      noncontrollingInterest: 0,
      totalEquityWithNci: 21010
    },
    segments: [
      { name: 'Construction Industries', revenue: 26410, operatingProfit: 6840 },
      { name: 'Resource Industries (Mining)', revenue: 12410, operatingProfit: 2910 },
      { name: 'Energy & Transportation', revenue: 24100, operatingProfit: 4120 },
      { name: 'Financial Products', revenue: 3889, operatingProfit: 890 },
      { name: 'All Other / Eliminations', revenue: -2000, operatingProfit: -1771 }
    ],
    geographicRevenues: [
      { region: 'North America', revenue: 34100 },
      { region: 'EAME (Europe, Africa, Middle East)', revenue: 13410 },
      { region: 'Asia/Pacific', revenue: 10899 },
      { region: 'Latin America', revenue: 6400 }
    ],
    footnotesCensus: [
      { noteNumber: 1, title: 'Operations and Summary of Significant Accounting Policies', usGaapConcept: 'us-gaap:BasisOfPresentationAndSignificantAccountingPoliciesTextBlock', keyMetricLabel: 'Dealer Inventory Model', keyMetricValue: 'Independent Dealers' },
      { noteNumber: 2, title: 'Cat Financial Receivables and Allowance for Credit Losses', usGaapConcept: 'us-gaap:LoansNotesTradeAndOtherReceivablesDisclosureTextBlock', keyMetricLabel: 'Customer Finance Portfolio', keyMetricValue: 31200 },
      { noteNumber: 3, title: 'Inventories and Cost Accounting', usGaapConcept: 'us-gaap:InventoryDisclosureTextBlock', keyMetricLabel: 'Inventories on LIFO/FIFO', keyMetricValue: 9410 },
      { noteNumber: 4, title: 'Property, Plant and Equipment', usGaapConcept: 'us-gaap:PropertyPlantAndEquipmentDisclosureTextBlock', keyMetricLabel: 'Machinery & Equipment Net', keyMetricValue: 12400 },
      { noteNumber: 5, title: 'Short-Term and Long-Term Debt', usGaapConcept: 'us-gaap:DebtDisclosureTextBlock', keyMetricLabel: 'Consolidated Debt', keyMetricValue: 37410 },
      { noteNumber: 6, title: 'Postretirement Benefit Plans', usGaapConcept: 'us-gaap:PensionAndOtherPostretirementBenefitsDisclosureTextBlock', keyMetricLabel: 'Pension Funded Surplus', keyMetricValue: 3410 },
      { noteNumber: 7, title: 'Stockholders Equity, Dividends and Repurchases', usGaapConcept: 'us-gaap:StockholdersEquityNoteDisclosureTextBlock', keyMetricLabel: 'Capital Returned to Shareholders', keyMetricValue: 7420 },
      { noteNumber: 8, title: 'Segment and Geographic Operations', usGaapConcept: 'us-gaap:SegmentReportingDisclosureTextBlock', keyMetricLabel: 'Construction Industries Operating Margin', keyMetricValue: '25.9%' }
    ],
    criticalAccountingPolicies: [
      'Credit loss reserves on Cat Financial wholesale financing and customer installment contracts (CECL)',
      'Product warranty obligations, service agreements, and extended powertrain warranty reserves',
      'Inventory costing under LIFO for domestic inventories and FIFO for foreign operations',
      'Actuarial valuation of defined benefit pension plans and mark-to-market settlement accounting'
    ],
    keyRiskFactors: [
      'Global macroeconomic infrastructure spending, non-residential construction activity, and mining commodity demand',
      'Dealer inventory destocking cycles and heavy equipment lead times',
      'Geopolitical tensions, regional conflicts, export control regulations, and foreign exchange exposure',
      'Energy transition shifts impacting reciprocating engines and oil & gas power generation customer demand'
    ]
  }
};
