import crypto from 'crypto';
import { FileInput, FileInspectionResult } from './types';

// Supported AnyDoc formats
const ANYDOC_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'docm', 'ppt', 'pptx', 'pptm',
  'xls', 'xlsx', 'xlsm', 'xlsb', 'csv', 'odt', 'ods', 'odp', 'rtf', 'epub'
]);

const SPREADSHEET_EXTENSIONS = new Set([
  'xls', 'xlsx', 'xlsm', 'xlsb', 'csv', 'ods'
]);

const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'tiff', 'bmp', 'gif'
]);

export class FileRouter {
  private knownHashes: Set<string> = new Set();

  public async inspectFile(file: FileInput): Promise<FileInspectionResult> {
    const buffer = file.buffer || Buffer.from('');
    const ext = file.filename.split('.').pop()?.toLowerCase() || '';
    
    // 1. Calculate SHA-256 Hash
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const isDuplicate = this.knownHashes.has(hash);
    this.knownHashes.add(hash);

    // 2. Detect actual file signature / magic bytes (Do NOT trust extension alone)
    const magicSignature = buffer.slice(0, 8).toString('hex').toUpperCase();
    let detectedType = ext;
    let isCorrupted = false;

    if (magicSignature.startsWith('25504446')) { // %PDF
      detectedType = 'pdf';
    } else if (magicSignature.startsWith('504B0304')) { // PK.. (zip container for xlsx, docx, pptx)
      if (ext.includes('doc')) detectedType = 'docx';
      else if (ext.includes('ppt')) detectedType = 'pptx';
      else detectedType = 'xlsx';
    } else if (magicSignature.startsWith('D0CF11E0')) { // OLE container for legacy doc, xls, ppt
      if (ext.includes('doc')) detectedType = 'doc';
      else if (ext.includes('ppt')) detectedType = 'ppt';
      else detectedType = 'xls';
    } else if (magicSignature.startsWith('FFD8FF')) { // JPEG
      detectedType = 'jpeg';
    } else if (magicSignature.startsWith('89504E47')) { // PNG
      detectedType = 'png';
    } else if (buffer.length > 0 && buffer.length < 10 && ext !== 'csv' && ext !== 'txt') {
      isCorrupted = true;
    }

    // 3. Encryption check
    const isEncrypted = buffer.toString('utf-8', 0, Math.min(buffer.length, 2000)).includes('/Encrypt');

    // 4. Native text vs Scanned check
    const sampleText = buffer.toString('utf-8', 0, Math.min(buffer.length, 5000));
    const cleanAscii = sampleText.replace(/[^\x20-\x7E]/g, ' ').trim();
    const hasNativeText = cleanAscii.length > 80 && !IMAGE_EXTENSIONS.has(detectedType);

    // 5. Determine flags
    const requiresSpreadsheetPath = SPREADSHEET_EXTENSIONS.has(detectedType) || SPREADSHEET_EXTENSIONS.has(ext);
    const isMultimodalImage = IMAGE_EXTENSIONS.has(detectedType) || IMAGE_EXTENSIONS.has(ext);
    const needsOCR = isMultimodalImage || (detectedType === 'pdf' && !hasNativeText);

    // 6. Support determination
    const isSupported = ANYDOC_EXTENSIONS.has(detectedType) || ANYDOC_EXTENSIONS.has(ext) || isMultimodalImage;
    let unsupportedReason: string | undefined;

    if (!isSupported) {
      unsupportedReason = `Unsupported file format (.${ext || 'unknown'}). Please upload a PDF, Excel workbook, Word document, PowerPoint presentation, or financial statement scan.`;
    } else if (isCorrupted) {
      unsupportedReason = `The file appears to be corrupted or empty (${file.size} bytes). Please re-export or re-upload.`;
    } else if (isEncrypted) {
      unsupportedReason = `The document is password encrypted. Please remove password protection before uploading.`;
    }

    return {
      mimeType: file.mimeType || 'application/octet-stream',
      detectedType,
      signature: magicSignature.substring(0, 8),
      size: file.size,
      hash,
      isDuplicate,
      isEncrypted,
      isCorrupted,
      hasNativeText,
      needsOCR,
      requiresSpreadsheetPath,
      isMultimodalImage,
      isSupported: isSupported && !isCorrupted && !isEncrypted,
      unsupportedReason
    };
  }
}
