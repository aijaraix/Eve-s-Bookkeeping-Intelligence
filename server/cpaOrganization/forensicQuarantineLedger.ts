/**
 * EVE AUTONOMOUS CPA OPERATING SYSTEM — FORENSIC QUARANTINE LEDGER
 * 
 * Implements H.9.36.2 Sections 1, 4, 6, 9 & H.9.36.2A Sections 1-4, 9, 15, 17, 18, 22:
 * - Forensic Preservation of contaminated historical records (DO NOT delete)
 * - Complete Quarantine of synthetic fixtures, canary deliverables, fake hashes, and ungrounded facts
 * - Strict Ineligibility Gate: Quarantined records are blocked from customer UI, reports, Copilot, calculations, and canonical resolution
 * - Durable migration ledger and audit trails
 */

import fs from 'fs';
import path from 'path';

export type AuthoritativeDataClassification =
  | 'AUTHORITATIVE_CUSTOMER_SOURCE'
  | 'AUTHORITATIVE_CUSTOMER_DERIVED'
  | 'AUTHORITATIVE_PUBLIC_SOURCE'
  | 'ACADEMY_SOURCE'
  | 'ACADEMY_DERIVED'
  | 'SYNTHETIC_CUSTOMER_ACADEMY'
  | 'CANARY'
  | 'REGRESSION'
  | 'TEST_FIXTURE'
  | 'DEMO'
  | 'SUPERSEDED_HISTORICAL'
  | 'INVALID_SOURCE_LINEAGE'
  | 'BROKEN_SOURCE_REFERENCE'
  | 'UNGROUNDED_SYNTHETIC'
  | 'LEGACY_UNKNOWN'
  | 'QUARANTINED'
  | 'SYNTHETIC_FIXTURE'
  | 'CANARY_CONTAMINATION';

export interface QuarantinedForensicRecord {
  quarantineId: string;
  originalId: string;
  originalStore: string;
  originalValue: any;
  metricOrLabel: string;
  projectId: string;
  engagementId: string;
  entityName: string;
  originalClassification: string;
  quarantinedClassification: AuthoritativeDataClassification;
  originalTimestamp: string;
  quarantinedAt: string;
  originalCreator: string;
  originalClaimedLineage: string;
  reasonInvalidated: string;
  forensicIncidentId: string;
  supersedingRecordId?: string;
  supersedingAuthoritativeValue?: any;
  quarantineStatus: 'QUARANTINED_NON_AUTHORITATIVE' | 'PENDING_FORENSIC_RECONCILIATION';
  ineligibilityFlags: {
    customerUiBlocked: boolean;
    canonicalTruthBlocked: boolean;
    customerReportsBlocked: boolean;
    financialCalculationsBlocked: boolean;
    copilotAuthoritativeBlocked: boolean;
    chartsAndRatiosBlocked: boolean;
    minervaTruthBlocked: boolean;
  };
}

export interface QuarantineMigrationSummary {
  migrationId: string;
  executedAt: string;
  operator: string;
  beforeActiveObjectCounts: number;
  quarantinedObjectCounts: number;
  rebuiltActiveCounts: number;
  legacyUnknownCount: number;
  brokenLineageCount: number;
  syntheticActiveCount: number;
  canaryActiveCount: number;
  testFixtureActiveCount: number;
  authoritativeActiveCount: number;
  activeReportCount: number;
  activeCanonicalFactCount: number;
  activeDataPointCount: number;
  activeRelationshipCount: number;
  sourceArtifactsUsed: string[];
  sourceArtifactsHashes: Record<string, string>;
  purityChecks: {
    activeStorePurity: 'PASS' | 'FAIL';
    legacyQuarantine: 'PASS' | 'FAIL';
    syntheticFirewall: 'PASS' | 'FAIL';
    canaryFirewall: 'PASS' | 'FAIL';
    academyFirewall: 'PASS' | 'FAIL';
    sourceArtifactIntegrity: 'PASS' | 'FAIL';
    canonicalTruth: 'PASS' | 'FAIL';
    uiPurity: 'PASS' | 'FAIL';
    copilotPurity: 'PASS' | 'FAIL';
    reportPurity: 'PASS' | 'FAIL';
  };
}

export class ForensicQuarantineLedger {
  private static instance: ForensicQuarantineLedger;
  private records: Map<string, QuarantinedForensicRecord> = new Map();
  private readonly quarantineDir = path.join(process.cwd(), 'storage/cpa_memory/quarantine');
  private readonly recordsFile = path.join(this.quarantineDir, 'quarantined_records.json');
  private readonly migrationFile = path.join(this.quarantineDir, 'migration_record.json');

  private constructor() {
    this.ensureDir();
    this.loadRecords();
    this.seedKnownContaminatedRecords();
  }

  public static getInstance(): ForensicQuarantineLedger {
    if (!ForensicQuarantineLedger.instance) {
      ForensicQuarantineLedger.instance = new ForensicQuarantineLedger();
    }
    return ForensicQuarantineLedger.instance;
  }

  private ensureDir() {
    if (!fs.existsSync(this.quarantineDir)) {
      fs.mkdirSync(this.quarantineDir, { recursive: true });
    }
  }

  private loadRecords() {
    if (fs.existsSync(this.recordsFile)) {
      try {
        const raw = fs.readFileSync(this.recordsFile, 'utf8');
        const list: QuarantinedForensicRecord[] = JSON.parse(raw);
        for (const item of list) {
          this.records.set(item.quarantineId, item);
        }
      } catch (err) {
        console.error('[ForensicQuarantineLedger] Failed to read quarantine file:', err);
      }
    }
  }

  private persist() {
    try {
      this.ensureDir();
      const list = Array.from(this.records.values());
      fs.writeFileSync(this.recordsFile, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.error('[ForensicQuarantineLedger] Failed to write quarantine file:', err);
    }
  }

  /**
   * Seed the specific historical contaminated records identified in H.9.36.1
   */
  private seedKnownContaminatedRecords() {
    const defaultFlags = {
      customerUiBlocked: true,
      canonicalTruthBlocked: true,
      customerReportsBlocked: true,
      financialCalculationsBlocked: true,
      copilotAuthoritativeBlocked: true,
      chartsAndRatiosBlocked: true,
      minervaTruthBlocked: true
    };

    // 1. Synthetic Revenue Fixture: $3,425,000,000
    if (!this.records.has('Q-PLTR-REV-3425M')) {
      this.records.set('Q-PLTR-REV-3425M', {
        quarantineId: 'Q-PLTR-REV-3425M',
        originalId: 'cf-pltr-is-rev-synthetic',
        originalStore: 'universalDataGraph / palantirTruthReconciliation',
        originalValue: 3425000000,
        metricOrLabel: 'Consolidated Total Revenues (FY 2025)',
        projectId: 'proj-pltr-sec',
        engagementId: 'eng-cj-325562',
        entityName: 'Palantir Technologies Inc.',
        originalClassification: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        quarantinedClassification: 'SYNTHETIC_FIXTURE',
        originalTimestamp: '2026-09-07T12:00:00.000Z',
        quarantinedAt: '2026-09-08T15:00:00.000Z',
        originalCreator: 'UniversalDataGraphSeeder',
        originalClaimedLineage: 'Part II Item 8 Table 14 Row 3 (Claimed $3,425,000k)',
        reasonInvalidated: 'Synthetic prototype fixture ungrounded in physical SEC Form 10-K. Actual SEC 10-K reported Revenue is $4,475,446,000 USD.',
        forensicIncidentId: 'INC-PLTR-SYNTHETIC-LEAK-01',
        supersedingRecordId: 'FACT-PLTR-2025-REVENUE-AUTH',
        supersedingAuthoritativeValue: 4475446000,
        quarantineStatus: 'QUARANTINED_NON_AUTHORITATIVE',
        ineligibilityFlags: { ...defaultFlags }
      });
    }

    // 2. Synthetic Net Income Fixture: $415,000,000 / $525,000,000
    if (!this.records.has('Q-PLTR-NETINC-415M')) {
      this.records.set('Q-PLTR-NETINC-415M', {
        quarantineId: 'Q-PLTR-NETINC-415M',
        originalId: 'cf-pltr-is-netinc-synthetic',
        originalStore: 'universalDataGraph / palantirTruthReconciliation',
        originalValue: 415000000,
        metricOrLabel: 'Net Income (FY 2025)',
        projectId: 'proj-pltr-sec',
        engagementId: 'eng-cj-325562',
        entityName: 'Palantir Technologies Inc.',
        originalClassification: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        quarantinedClassification: 'SYNTHETIC_FIXTURE',
        originalTimestamp: '2026-09-07T12:00:00.000Z',
        quarantinedAt: '2026-09-08T15:00:00.000Z',
        originalCreator: 'UniversalDataGraphSeeder',
        originalClaimedLineage: 'Part II Item 8 Table 14 Row 22 (Claimed $415,000k / $525,000k)',
        reasonInvalidated: 'Synthetic fixture. Actual SEC 10-K reported Net Income is $1,625,033,000 USD ($1,634,644,000 including noncontrolling interest).',
        forensicIncidentId: 'INC-PLTR-SYNTHETIC-LEAK-01',
        supersedingRecordId: 'FACT-PLTR-2025-NETINC-AUTH',
        supersedingAuthoritativeValue: 1625033000,
        quarantineStatus: 'QUARANTINED_NON_AUTHORITATIVE',
        ineligibilityFlags: { ...defaultFlags }
      });
    }

    // 3. Synthetic Total Assets Fixture: $5,520,000,000
    if (!this.records.has('Q-PLTR-ASSETS-5520M')) {
      this.records.set('Q-PLTR-ASSETS-5520M', {
        quarantineId: 'Q-PLTR-ASSETS-5520M',
        originalId: 'cf-pltr-bs-assets-synthetic',
        originalStore: 'universalDataGraph / palantirTruthReconciliation',
        originalValue: 5520000000,
        metricOrLabel: 'Total Assets (as of Dec 31, 2025)',
        projectId: 'proj-pltr-sec',
        engagementId: 'eng-cj-325562',
        entityName: 'Palantir Technologies Inc.',
        originalClassification: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        quarantinedClassification: 'SYNTHETIC_FIXTURE',
        originalTimestamp: '2026-09-07T12:00:00.000Z',
        quarantinedAt: '2026-09-08T15:00:00.000Z',
        originalCreator: 'UniversalDataGraphSeeder',
        originalClaimedLineage: 'Part II Item 8 Table 15 Row 18 (Claimed $5,520,000k)',
        reasonInvalidated: 'Synthetic fixture. Actual SEC 10-K reported Total Assets is $8,900,392,000 USD.',
        forensicIncidentId: 'INC-PLTR-SYNTHETIC-LEAK-01',
        supersedingRecordId: 'FACT-PLTR-2025-ASSETS-AUTH',
        supersedingAuthoritativeValue: 8900392000,
        quarantineStatus: 'QUARANTINED_NON_AUTHORITATIVE',
        ineligibilityFlags: { ...defaultFlags }
      });
    }

    // 4. Synthetic Total Liabilities Fixture: $1,140,000,000
    if (!this.records.has('Q-PLTR-LIAB-1140M')) {
      this.records.set('Q-PLTR-LIAB-1140M', {
        quarantineId: 'Q-PLTR-LIAB-1140M',
        originalId: 'cf-pltr-bs-liab-synthetic',
        originalStore: 'universalDataGraph / palantirTruthReconciliation',
        originalValue: 1140000000,
        metricOrLabel: 'Total Liabilities (as of Dec 31, 2025)',
        projectId: 'proj-pltr-sec',
        engagementId: 'eng-cj-325562',
        entityName: 'Palantir Technologies Inc.',
        originalClassification: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        quarantinedClassification: 'SYNTHETIC_FIXTURE',
        originalTimestamp: '2026-09-07T12:00:00.000Z',
        quarantinedAt: '2026-09-08T15:00:00.000Z',
        originalCreator: 'UniversalDataGraphSeeder',
        originalClaimedLineage: 'Part II Item 8 Table 15 Row 32 (Claimed $1,140,000k)',
        reasonInvalidated: 'Synthetic fixture. Actual SEC 10-K reported Total Liabilities is $1,412,381,000 USD.',
        forensicIncidentId: 'INC-PLTR-SYNTHETIC-LEAK-01',
        supersedingRecordId: 'FACT-PLTR-2025-LIAB-AUTH',
        supersedingAuthoritativeValue: 1412381000,
        quarantineStatus: 'QUARANTINED_NON_AUTHORITATIVE',
        ineligibilityFlags: { ...defaultFlags }
      });
    }

    // 5. Synthetic Stockholders Equity Fixture: $4,380,000,000
    if (!this.records.has('Q-PLTR-EQUITY-4380M')) {
      this.records.set('Q-PLTR-EQUITY-4380M', {
        quarantineId: 'Q-PLTR-EQUITY-4380M',
        originalId: 'cf-pltr-bs-equity-synthetic',
        originalStore: 'universalDataGraph / palantirTruthReconciliation',
        originalValue: 4380000000,
        metricOrLabel: 'Total Stockholders Equity (as of Dec 31, 2025)',
        projectId: 'proj-pltr-sec',
        engagementId: 'eng-cj-325562',
        entityName: 'Palantir Technologies Inc.',
        originalClassification: 'AUTHORITATIVE_PRODUCTION_TRUTH',
        quarantinedClassification: 'SYNTHETIC_FIXTURE',
        originalTimestamp: '2026-09-07T12:00:00.000Z',
        quarantinedAt: '2026-09-08T15:00:00.000Z',
        originalCreator: 'UniversalDataGraphSeeder',
        originalClaimedLineage: 'Part II Item 8 Table 15 Row 45 (Claimed $4,380,000k)',
        reasonInvalidated: 'Synthetic fixture. Actual SEC 10-K reported Stockholders Equity is $7,488,011,000 USD ($7,387,268k common + $100,743k noncontrolling).',
        forensicIncidentId: 'INC-PLTR-SYNTHETIC-LEAK-01',
        supersedingRecordId: 'FACT-PLTR-2025-EQUITY-AUTH',
        supersedingAuthoritativeValue: 7488011000,
        quarantineStatus: 'QUARANTINED_NON_AUTHORITATIVE',
        ineligibilityFlags: { ...defaultFlags }
      });
    }

    // 6. Placeholder Empty SHA-256 Hash
    if (!this.records.has('Q-PLTR-HASH-EMPTY-SHA')) {
      this.records.set('Q-PLTR-HASH-EMPTY-SHA', {
        quarantineId: 'Q-PLTR-HASH-EMPTY-SHA',
        originalId: 'hash-pltr-sec-empty-sha',
        originalStore: 'schemaVersioning / informationCustody / palantirTruth',
        originalValue: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        metricOrLabel: 'Source Document Cryptographic Hash',
        projectId: 'proj-pltr-sec',
        engagementId: 'eng-cj-325562',
        entityName: 'Palantir Technologies Inc.',
        originalClassification: 'SOURCE_HASH_RECORD',
        quarantinedClassification: 'INVALID_SOURCE_LINEAGE',
        originalTimestamp: '2026-09-07T12:00:00.000Z',
        quarantinedAt: '2026-09-08T15:00:00.000Z',
        originalCreator: 'SeedFixtures',
        originalClaimedLineage: 'Claimed hash of pltr-20251231.htm',
        reasonInvalidated: 'Hash is the SHA-256 of an empty string (0 bytes), whereas physical filing has 2,192,014 bytes with actual SHA-256 a4fef9542c4d1a99a9265df88948e5a115223940db01a0bd01f1d8b6c00acd46.',
        forensicIncidentId: 'INC-PLTR-EMPTY-HASH-01',
        supersedingRecordId: 'HASH-PLTR-2025-AUTH',
        supersedingAuthoritativeValue: 'a4fef9542c4d1a99a9265df88948e5a115223940db01a0bd01f1d8b6c00acd46',
        quarantineStatus: 'QUARANTINED_NON_AUTHORITATIVE',
        ineligibilityFlags: { ...defaultFlags }
      });
    }

    // 7. Canary Package Cross-Contaminated Deliverable
    if (!this.records.has('Q-REP-1788813325563-CANARY')) {
      this.records.set('Q-REP-1788813325563-CANARY', {
        quarantineId: 'Q-REP-1788813325563-CANARY',
        originalId: 'REP-1788813325563',
        originalStore: 'storage/reports/audit_package_REP-1788813325563_v1.0.json',
        originalValue: {
          revenue: 14200000000,
          operatingProfit: 2850000000,
          totalAssets: 36000000000,
          totalLiabilities: 18500000000,
          totalEquity: 17500000000
        },
        metricOrLabel: 'Palantir Deliverable Package (Contaminated by ACADEMY-CANARY-01)',
        projectId: 'proj-pltr-sec',
        engagementId: 'eng-cj-325562',
        entityName: 'Palantir Technologies Inc.',
        originalClassification: 'CANARY_REPORT',
        quarantinedClassification: 'CANARY_CONTAMINATION',
        originalTimestamp: '2026-09-08T12:00:00.000Z',
        quarantinedAt: '2026-09-08T15:00:00.000Z',
        originalCreator: 'RunFullCanaryVerification',
        originalClaimedLineage: 'ACADEMY-CANARY-01_Audited_Financial_Statements.xlsx',
        reasonInvalidated: 'Canary pipeline reused Palantir customer engagementId eng-cj-325562, attaching $14.2B Canary numbers to Palantir deliverable package.',
        forensicIncidentId: 'INC-PLTR-CANARY-CROSS-CONTAM-01',
        supersedingRecordId: 'REP-PLTR-2025-AUTH-v2.0',
        quarantineStatus: 'QUARANTINED_NON_AUTHORITATIVE',
        ineligibilityFlags: { ...defaultFlags }
      });
    }

    this.persist();
  }

  public quarantineRecord(record: QuarantinedForensicRecord): void {
    this.records.set(record.quarantineId, record);
    this.persist();
  }

  public getQuarantinedRecords(): QuarantinedForensicRecord[] {
    return Array.from(this.records.values());
  }

  public isQuarantined(idOrHashOrVal: any): boolean {
    const s = String(idOrHashOrVal);
    for (const r of this.records.values()) {
      if (r.originalId === s || r.quarantineId === s) return true;
      if (typeof r.originalValue === 'number' && r.originalValue === Number(idOrHashOrVal)) return true;
      if (typeof r.originalValue === 'string' && r.originalValue === s) return true;
    }
    return false;
  }

  public createMigrationRecord(summary: QuarantineMigrationSummary): void {
    try {
      this.ensureDir();
      fs.writeFileSync(this.migrationFile, JSON.stringify(summary, null, 2), 'utf8');
    } catch (err) {
      console.error('[ForensicQuarantineLedger] Failed to save migration record:', err);
    }
  }

  public getMigrationRecord(): QuarantineMigrationSummary | null {
    if (fs.existsSync(this.migrationFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.migrationFile, 'utf8'));
      } catch (err) {
        return null;
      }
    }
    return null;
  }
}

export const forensicQuarantineLedger = ForensicQuarantineLedger.getInstance();
