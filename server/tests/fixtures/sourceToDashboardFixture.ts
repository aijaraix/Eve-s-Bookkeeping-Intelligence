import fs from 'node:fs';
import path from 'node:path';
import { buildReceiptFact, RECEIPT_SHA256 } from './receiptFiveDimensionFixture.js';

export const SOURCE_DASHBOARD_WORKSPACE_ID='ws-academy-source-dashboard';
export const SOURCE_DASHBOARD_ENGAGEMENT_ID='eng-academy-source-dashboard';
export const SOURCE_DASHBOARD_SPREADSHEET_FACT_ID='fact-dashboard-spreadsheet-revenue';
export const SOURCE_DASHBOARD_RECEIPT_FACT_ID='fact-dashboard-receipt-expense';
export const SOURCE_DASHBOARD_TAMPERED_FACT_ID='fact-dashboard-tampered-net-income';
export const SOURCE_DASHBOARD_VALUE=53.23;
export function sourceDashboardDir(){return process.env.SOURCE_DASHBOARD_ACCEPTANCE_DIR||'/tmp/eve-source-to-dashboard';}
export function loadSourceDashboardManifest(){return JSON.parse(fs.readFileSync(path.join(sourceDashboardDir(),'fixture-manifest.json'),'utf8'));}

export function buildDashboardSpreadsheetFact(manifest=loadSourceDashboardManifest()):any {
  const c=manifest.spreadsheet.coordinate;
  return {id:SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,workspaceId:SOURCE_DASHBOARD_WORKSPACE_ID,documentId:'doc-dashboard-revenue-xlsx',canonicalMetric:'revenue',labelOriginal:'Revenue',labelNormalized:'Total Revenue',valueOriginal:'53.23',valueFunctional:SOURCE_DASHBOARD_VALUE,normalizedValue:SOURCE_DASHBOARD_VALUE,currencyOriginal:'USD',functionalCurrency:'USD',reportingPeriod:'FY 2026',periodOriginal:'FY 2026',status:'APPROVED',verificationStatus:'VERIFIED',evidenceStatus:'CONFIRMED',sourceDocument:'revenue-register.xlsx',documentTitle:'revenue-register.xlsx',sourceText:'Revenue | 53.23 | USD',sourceSha256:manifest.spreadsheet.sha256,sourceArtifactId:c.sourceArtifactId,sourceProvenanceId:manifest.spreadsheet.provenanceId,sourceProvenanceIds:[manifest.spreadsheet.provenanceId],sourceCoordinate:c,sourceCoordinates:[c],provenanceCoordinates:[c],sourceExtractionMethod:c.extractionMethod||'spreadsheet-native',sourceExtractionVersion:c.extractionVersion||'1',scale:'Source units'};
}
export function buildDashboardReceiptFact():any {
  const r:any=buildReceiptFact(); return {...r,id:SOURCE_DASHBOARD_RECEIPT_FACT_ID,workspaceId:SOURCE_DASHBOARD_WORKSPACE_ID,documentId:'doc-dashboard-receipt',canonicalMetric:'operating_expenses'};
}
export function buildTamperedDashboardFact(manifest=loadSourceDashboardManifest()):any {
  const f=buildDashboardSpreadsheetFact(manifest); return {...f,id:SOURCE_DASHBOARD_TAMPERED_FACT_ID,canonicalMetric:'net_income',labelNormalized:'Net Income',sourceSha256:RECEIPT_SHA256};
}
export function buildSourceDashboardEngagement(includeTampered=true):any {
  const m=loadSourceDashboardManifest(); const spreadsheet=buildDashboardSpreadsheetFact(m); const receipt=buildDashboardReceiptFact(); const facts=[spreadsheet,receipt,...(includeTampered?[buildTamperedDashboardFact(m)]:[])];
  return {engagementId:SOURCE_DASHBOARD_ENGAGEMENT_ID,workspaceId:SOURCE_DASHBOARD_WORKSPACE_ID,classification:'ACADEMY',isCustomer:false,clientName:'Eve Academy Source Dashboard Fixture',entityName:'Eve Academy Source Dashboard Fixture',title:'Source-to-Dashboard Product Truth',period:'FY 2026',framework:'US_GAAP',functionalCurrency:'USD',currentStage:'EVIDENCE_REVIEW',openReviewNotesCount:0,facts,canonicalFacts:facts,documents:[{id:'doc-dashboard-revenue-xlsx',filename:'revenue-register.xlsx',sha256:m.spreadsheet.sha256,workspaceId:SOURCE_DASHBOARD_WORKSPACE_ID},{id:'doc-dashboard-receipt',filename:'receipt.png',sha256:RECEIPT_SHA256,workspaceId:SOURCE_DASHBOARD_WORKSPACE_ID}],reports:[],findings:[],periods:['FY 2026'],continuation:null};
}
