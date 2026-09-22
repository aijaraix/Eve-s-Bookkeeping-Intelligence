import { buildDashboardReceiptFact, buildDashboardSpreadsheetFact, SOURCE_DASHBOARD_RECEIPT_FACT_ID, SOURCE_DASHBOARD_SPREADSHEET_FACT_ID, SOURCE_DASHBOARD_VALUE, sourceDashboardDir } from './sourceToDashboardFixture.js';
export const FINAL_LINEAGE_ENGAGEMENT_ID='eng-academy-final-deliverable-lineage';
export const FINAL_LINEAGE_WORKSPACE_ID='ws-academy-final-deliverable-lineage';
export const FINAL_LINEAGE_DERIVED_FACT_ID='fact-final-derived-net-zero';
export const FINAL_LINEAGE_DERIVATION_ID='DER-FINAL-REVENUE-MINUS-EXPENSE';
export function finalLineageDir(){return process.env.FINAL_LINEAGE_ACCEPTANCE_DIR||sourceDashboardDir();}
export function buildFinalLineageFacts():any[]{
 const revenue:any={...buildDashboardSpreadsheetFact(),workspaceId:FINAL_LINEAGE_WORKSPACE_ID};
 const expense:any={...buildDashboardReceiptFact(),workspaceId:FINAL_LINEAGE_WORKSPACE_ID};
 const derived:any={id:FINAL_LINEAGE_DERIVED_FACT_ID,workspaceId:FINAL_LINEAGE_WORKSPACE_ID,canonicalMetric:'net_income',labelOriginal:'Derived Net Result',labelNormalized:'Derived Net Result',valueOriginal:'0.00',valueFunctional:0,normalizedValue:0,functionalCurrency:'USD',currencyOriginal:'USD',reportingPeriod:'FY 2026',periodOriginal:'FY 2026',statement:'DERIVED_RESULT',status:'CALCULATED',verificationStatus:'CALCULATED',evidenceStatus:'DERIVED_FROM_CONFIRMED_PARENTS',sourceDocument:'DERIVED_FROM_SOURCE_FACTS',documentTitle:'DERIVED_FROM_SOURCE_FACTS',sourceText:'53.23 - 53.23 = 0.00',derivationId:FINAL_LINEAGE_DERIVATION_ID,derivationFormula:'revenue - operating_expenses',derivationOperation:'SUBTRACT',operandFactIds:[SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,SOURCE_DASHBOARD_RECEIPT_FACT_ID],operandValues:{[SOURCE_DASHBOARD_SPREADSHEET_FACT_ID]:SOURCE_DASHBOARD_VALUE,[SOURCE_DASHBOARD_RECEIPT_FACT_ID]:SOURCE_DASHBOARD_VALUE}};
 return [revenue,expense,derived];
}
export function buildTamperedFinalLineageFacts():any[]{const facts=buildFinalLineageFacts();facts[0]={...facts[0],sourceSha256:facts[1].sourceSha256};return facts;}
export function buildMissingOperandFinalLineageFacts():any[]{const facts=buildFinalLineageFacts();facts[2]={...facts[2],operandFactIds:[SOURCE_DASHBOARD_SPREADSHEET_FACT_ID,'fact-does-not-exist']};return facts;}
