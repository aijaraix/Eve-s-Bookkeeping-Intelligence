import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

interface CachedFileHandle {
  fileUri: string;
  mimeType: string;
  documentHash: string;
  createdAt: number;
  expiresAt: number;
}

export const MAX_NORMALIZED_HTML_CHARS = 3_000_000;

export function inferGeminiMimeType(filePath: string): string {
  const ext = path.extname(filePath || '').toLowerCase();
  if (ext === '.html' || ext === '.htm' || ext === '.xhtml') return 'text/html';
  if (ext === '.txt') return 'text/plain';
  if (ext === '.csv') return 'text/csv';
  if (ext === '.json') return 'application/json';
  return 'application/pdf';
}

function decodeHtmlEntities(input: string): string {
  const named: Record<string, string> = {
    nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>',
    ndash: '-', mdash: '-', lsquo: "'", rsquo: "'", ldquo: '"', rdquo: '"', hellip: '...'
  };
  return input
    .replace(/&#(\d+);/g, (_m, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCodePoint(code) : ' ';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : ' ';
    })
    .replace(/&([a-z]+);/gi, (m, name) => named[String(name).toLowerCase()] ?? m);
}

/**
 * Convert SEC/iXBRL HTML into bounded visible text before it reaches Gemini.
 * This preserves the filing's human-readable financial content while removing
 * markup/script/style/XBRL-hidden payload that can multiply token counts.
 */
export function normalizeHtmlForGemini(html: string): string {
  const withoutHidden = String(html || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<ix:hidden\b[^>]*>[\s\S]*?<\/ix:hidden>/gi, ' ')
    .replace(/<(?:br\s*\/?|\/p|\/div|\/tr|\/li|\/h[1-6]|\/table|\/section)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  const decoded = decodeHtmlEntities(withoutHidden)
    .replace(/\r/g, '\n')
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/ *\n+ */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!decoded) {
    const err: any = new Error('SEC HTML normalization produced no visible text.');
    err.errorType = 'INVALID_REQUEST';
    err.httpCode = 400;
    throw err;
  }
  if (decoded.length > MAX_NORMALIZED_HTML_CHARS) {
    const err: any = new Error(`Normalized SEC HTML remains too large for one Gemini request (${decoded.length} characters).`);
    err.errorType = 'INVALID_REQUEST';
    err.httpCode = 400;
    throw err;
  }
  return decoded;
}

export class GeminiFileService {
  private static instance: GeminiFileService;
  private fileCache: Map<string, CachedFileHandle> = new Map();
  private aiClient: GoogleGenAI | null = null;

  private constructor() {
    this.initClient();
  }

  public static getInstance(): GeminiFileService {
    if (!GeminiFileService.instance) {
      GeminiFileService.instance = new GeminiFileService();
    }
    return GeminiFileService.instance;
  }

  private initClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn('[GeminiFileService] Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  /**
   * Get or upload a document to Gemini while preserving source semantics.
   * SEC/iXBRL HTML is normalized to bounded visible text and sent inline as
   * text/plain so raw markup cannot exceed the model input-token ceiling.
   */
  public async getOrUploadPdfFile(filePath: string, documentHash: string): Promise<{ fileUri: string | null; inlineBase64?: string; mimeType: string }> {
    const sourceMimeType = inferGeminiMimeType(filePath);

    if (!fs.existsSync(filePath)) {
      console.error(`[GeminiFileService] File path does not exist: ${filePath}`);
      return { fileUri: null, mimeType: sourceMimeType };
    }

    const fileBuffer = fs.readFileSync(filePath);

    if (sourceMimeType === 'text/html') {
      const normalizedText = normalizeHtmlForGemini(fileBuffer.toString('utf8'));
      console.log(`[GeminiFileService] Normalized SEC HTML from ${fileBuffer.length} bytes to ${normalizedText.length} visible-text characters for Gemini.`);
      return {
        fileUri: null,
        inlineBase64: Buffer.from(normalizedText, 'utf8').toString('base64'),
        mimeType: 'text/plain'
      };
    }

    const existing = this.fileCache.get(documentHash);
    if (existing && Date.now() < existing.expiresAt) {
      console.log(`[GeminiFileService] Reusing active Gemini File URI for hash ${documentHash.substring(0, 8)}... (${existing.fileUri})`);
      return { fileUri: existing.fileUri, mimeType: existing.mimeType };
    }

    if (!this.aiClient) {
      this.initClient();
    }

    if (this.aiClient) {
      try {
        console.log(`[GeminiFileService] Uploading ${sourceMimeType} document (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB) to Gemini Files API...`);
        const uploadResult = await this.aiClient.files.upload({
          file: filePath,
          config: { mimeType: sourceMimeType }
        });

        if (uploadResult && uploadResult.uri) {
          const cachedHandle: CachedFileHandle = {
            fileUri: uploadResult.uri,
            mimeType: sourceMimeType,
            documentHash,
            createdAt: Date.now(),
            expiresAt: Date.now() + (48 * 60 * 60 * 1000)
          };
          this.fileCache.set(documentHash, cachedHandle);
          console.log(`[GeminiFileService] Successfully cached Gemini File URI: ${uploadResult.uri}`);
          return { fileUri: uploadResult.uri, mimeType: sourceMimeType };
        }
      } catch (uploadErr) {
        console.warn('[GeminiFileService] Files API upload encountered error, falling back to base64 inline payload:', uploadErr);
      }
    }

    return { fileUri: null, inlineBase64: fileBuffer.toString('base64'), mimeType: sourceMimeType };
  }

  public setCachedFileUri(documentHash: string, fileUri: string, ttlMs = 48 * 60 * 60 * 1000, mimeType = 'application/pdf'): void {
    this.fileCache.set(documentHash, {
      fileUri,
      mimeType,
      documentHash,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs
    });
  }

  public getCachedFileUri(documentHash: string): string | null {
    const cached = this.fileCache.get(documentHash);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.fileUri;
    }
    return null;
  }
}

export const geminiFileService = GeminiFileService.getInstance();