import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SpreadsheetParser } from '../../src/lib/parser/spreadsheetParser.js';
import { interpretTrialBalance, type TrialBalanceReview } from './trialBalanceInterpretationEngine.js';

export type TrialBalanceRuntimeQualification =
  | 'QUALIFIED_TRIAL_BALANCE'
  | 'SPREADSHEET_NOT_TRIAL_BALANCE'
  | 'NOT_APPLICABLE_NON_SPREADSHEET';

export interface TrialBalanceRuntimeEvidence {
  qualification: TrialBalanceRuntimeQualification;
  sourceSha256?: string;
  sourceFilePath?: string;
  filename?: string;
  mimeType?: string;
  review?: TrialBalanceReview;
}

const spreadsheetExtensions = new Set(['.xlsx','.xls','.csv','.tsv']);

export function isSpreadsheetRuntimeSource(input: { filename?: string; sourceFilePath?: string; mimeType?: string }): boolean {
  const ext = path.extname(String(input.filename || input.sourceFilePath || '')).toLowerCase();
  const mime = String(input.mimeType || '').toLowerCase();
  return spreadsheetExtensions.has(ext) || mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv') || mime.includes('tab-separated');
}

export function qualifyParsedTrialBalanceDocument(params: { doc: any; currency?: string; expectedSourceSha256?: string; sourceFilePath?: string; filename?: string; mimeType?: string }): TrialBalanceRuntimeEvidence {
  const actualSha = String(params.doc?.source?.hash || '');
  if (params.expectedSourceSha256 && actualSha !== params.expectedSourceSha256) throw new Error('TRIAL_BALANCE_SOURCE_HASH_MISMATCH');
  const review = interpretTrialBalance({ doc: params.doc, currency: params.currency });
  if (review.accountLineCount <= 0 || review.sheetName === 'NOT_RECORDED') {
    return { qualification:'SPREADSHEET_NOT_TRIAL_BALANCE', sourceSha256:actualSha, sourceFilePath:params.sourceFilePath, filename:params.filename, mimeType:params.mimeType };
  }
  return { qualification:'QUALIFIED_TRIAL_BALANCE', sourceSha256:actualSha, sourceFilePath:params.sourceFilePath, filename:params.filename, mimeType:params.mimeType, review };
}

export async function deriveTrialBalanceRuntimeEvidenceFromPhysicalSource(params: { sourceFilePath?: string; expectedSourceSha256?: string; filename?: string; mimeType?: string; currency?: string }): Promise<TrialBalanceRuntimeEvidence> {
  if (!isSpreadsheetRuntimeSource(params)) return { qualification:'NOT_APPLICABLE_NON_SPREADSHEET', sourceFilePath:params.sourceFilePath, filename:params.filename, mimeType:params.mimeType };
  if (!params.expectedSourceSha256) throw new Error('TRIAL_BALANCE_EXPECTED_SOURCE_HASH_MISSING');
  if (!params.sourceFilePath || !fs.existsSync(params.sourceFilePath)) throw new Error('TRIAL_BALANCE_SPREADSHEET_SOURCE_UNAVAILABLE');
  const bytes=fs.readFileSync(params.sourceFilePath);
  const actualSha=crypto.createHash('sha256').update(bytes).digest('hex');
  if (actualSha !== params.expectedSourceSha256) throw new Error('TRIAL_BALANCE_SOURCE_HASH_MISMATCH');
  const filename=params.filename || path.basename(params.sourceFilePath);
  const parser=new SpreadsheetParser();
  const fileInput={filename,originalName:filename,mimeType:params.mimeType,size:bytes.length,buffer:bytes};
  const inspection=await parser.inspect(fileInput);
  const doc=await parser.parse(fileInput,inspection);
  return qualifyParsedTrialBalanceDocument({doc,currency:params.currency,expectedSourceSha256:actualSha,sourceFilePath:params.sourceFilePath,filename,mimeType:params.mimeType});
}
