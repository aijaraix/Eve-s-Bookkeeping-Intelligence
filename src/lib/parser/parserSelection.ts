import { FileInspectionResult } from './types.js';

export type EveParserPath = 'SPREADSHEET' | 'OCR' | 'DOCUMENT';

export function selectParserPath(inspection: Partial<FileInspectionResult> | any): EveParserPath {
  const required = String(inspection?.requiresParser || '').toLowerCase();
  const detected = String(inspection?.detectedType || '').toLowerCase();
  const mime = String(inspection?.mimeType || '').toLowerCase();

  if (
    required === 'spreadsheetparser' ||
    ['xlsx', 'xls', 'csv', 'tsv'].includes(detected) ||
    mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')
  ) return 'SPREADSHEET';

  if (
    inspection?.needsOCR === true ||
    inspection?.isMultimodalImage === true ||
    required === 'ocrparser' ||
    ['png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif', 'bmp'].includes(detected) ||
    mime.startsWith('image/')
  ) return 'OCR';

  return 'DOCUMENT';
}
