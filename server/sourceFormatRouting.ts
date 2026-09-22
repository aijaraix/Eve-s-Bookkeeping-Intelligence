import path from 'node:path';

export type SupportedSourceFormat = 'PDF' | 'SPREADSHEET' | 'IMAGE' | 'DOCUMENT';

const spreadsheetExtensions = new Set(['.xlsx', '.xls', '.xlsm', '.xlsb', '.csv', '.tsv', '.ods']);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.bmp']);
const documentExtensions = new Set(['.docx', '.doc', '.html', '.htm', '.xhtml', '.txt', '.md', '.json', '.log']);

export function routeSupportedSource(filename = '', mimeType = ''): SupportedSourceFormat {
  const extension = path.extname(filename).toLowerCase();
  const mime = mimeType.toLowerCase().split(';', 1)[0].trim();

  if (extension === '.pdf' || mime === 'application/pdf') return 'PDF';
  if (spreadsheetExtensions.has(extension) || /(?:spreadsheet|excel|csv|tab-separated)/.test(mime)) return 'SPREADSHEET';
  if (imageExtensions.has(extension) || mime.startsWith('image/')) return 'IMAGE';
  if (
    documentExtensions.has(extension) ||
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    /(?:wordprocessingml|msword|xhtml)/.test(mime)
  ) return 'DOCUMENT';

  throw new Error(`UNSUPPORTED_SOURCE_FORMAT:${mime || 'unknown'}:${extension || 'no-extension'}`);
}

export function mimeTypeForSource(format: SupportedSourceFormat, filename: string, suppliedMimeType = ''): string {
  if (suppliedMimeType && suppliedMimeType !== 'application/octet-stream') return suppliedMimeType;
  const extension = path.extname(filename).toLowerCase();
  if (format === 'PDF') return 'application/pdf';
  if (format === 'IMAGE') return extension === '.png' ? 'image/png' : 'image/jpeg';
  if (format === 'SPREADSHEET') return extension === '.csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (['.html', '.htm', '.xhtml'].includes(extension)) return 'text/html';
  if (extension === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'text/plain';
}
