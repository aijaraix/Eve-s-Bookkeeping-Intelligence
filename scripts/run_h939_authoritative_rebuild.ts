/**
 * RUNNER: Phase H.9.39 Ten-Company Authoritative Full-Filing Rebuild
 */

import { tenCompanyAuthoritativeFullFilingEngine } from '../server/cpaOrganization/tenCompanyAuthoritativeFullFilingEngine.js';

async function main() {
  console.log('================================================================');
  console.log('STARTING PHASE H.9.39 TEN-COMPANY AUTHORITATIVE FULL-FILING REBUILD');
  console.log('================================================================\n');

  const report = await tenCompanyAuthoritativeFullFilingEngine.executeFullAuthoritativeProgram();

  console.log('\n================================================================');
  console.log('PHASE H.9.39 REBUILD COMPLETED SUCCESSFULLY');
  console.log('================================================================\n');

  console.log(`Program ID: ${report.programId}`);
  console.log(`Issuers Processed: ${report.issuersCount}`);
  console.log(`Total Source Physical Size: ${report.totalSourceMb} MB (${report.totalSourceBytes.toLocaleString()} bytes)`);
  console.log(`Total Universal Document Leaf Elements: ${report.totalLeafNodes.toLocaleString()}`);
  console.log(`Total Tables: ${report.totalTables.toLocaleString()}`);
  console.log(`Total Rows: ${report.totalRows.toLocaleString()}`);
  console.log(`Total Cells: ${report.totalCells.toLocaleString()}`);
  console.log(`Total XBRL Numeric Facts: ${report.totalXbrlFacts.toLocaleString()}`);
  console.log(`Total XBRL Text Blocks: ${report.totalXbrlTextBlocks.toLocaleString()}`);
  console.log(`Total Footnotes Cataloged: ${report.totalFootnotes.toLocaleString()}`);
  console.log(`Total Atomic DataPoints: ${report.totalAtomicDataPoints.toLocaleString()}`);
  console.log(`Total Unaccounted Elements: ${report.totalUnaccountedElements} (Conservation: ${report.conservationRate})`);
  console.log(`All Euclid Balance Sheet Identities ($Assets = Liab + Eq): ${report.allEuclidIdentitiesVerified ? 'VERIFIED (0.00 DISCREPANCY)' : 'DISCREPANCY'}`);
  console.log(`All Source Identity Gates: ${report.allSourceIdentityGatesPassed ? 'PASSED (COMPLETE_AUTHORITATIVE_FILING)' : 'FAILED'}`);
  console.log(`Minerva Sealed Ask-Anything Exam: ${report.minervaSealedExamCorrectCount} / ${report.minervaSealedExamTotalQuestions} Correct (${report.minervaSealedExamAccuracyPercent}%)`);
  console.log(`All Internal Audits V3: ${report.allAuditsUnqualified ? 'UNQUALIFIED AUDIT PASS' : 'QUALIFIED'}`);
  
  console.log('\n--- FORENSIC EXPANSION COMPARISON (H.9.38 vs H.9.39) ---');
  console.log(`Source Bytes: ${report.forensicComparisonToH938.h938SourceBytes.toLocaleString()} -> ${report.forensicComparisonToH938.h939SourceBytes.toLocaleString()} (${report.forensicComparisonToH938.byteExpansionFactor})`);
  console.log(`Universal Leaf Nodes: ${report.forensicComparisonToH938.h938LeafNodes.toLocaleString()} -> ${report.forensicComparisonToH938.h939LeafNodes.toLocaleString()} (${report.forensicComparisonToH938.nodeExpansionFactor})`);
  console.log(`XBRL Facts: ${report.forensicComparisonToH938.h938XbrlFacts.toLocaleString()} -> ${report.forensicComparisonToH938.h939XbrlFacts.toLocaleString()} (${report.forensicComparisonToH938.xbrlExpansionFactor})`);

  console.log('\n--- ISSUER BREAKDOWN ---');
  console.table(report.companySummaries);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
