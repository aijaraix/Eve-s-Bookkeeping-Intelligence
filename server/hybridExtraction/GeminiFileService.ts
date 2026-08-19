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
        console.warn("[GeminiFileService] Failed to initialize GoogleGenAI client:", err);
      }
    }
  }

  /**
   * Get or Upload PDF file to Gemini Files API.
   * Reuses existing upload if still active within cache window.
   */
  public async getOrUploadPdfFile(filePath: string, documentHash: string): Promise<{ fileUri: string | null; inlineBase64?: string; mimeType: string }> {
    const mimeType = "application/pdf";

    // 1. Check active cache
    const existing = this.fileCache.get(documentHash);
    if (existing && Date.now() < existing.expiresAt) {
      console.log(`[GeminiFileService] Reusing active Gemini File URI for hash ${documentHash.substring(0, 8)}... (${existing.fileUri})`);
      return { fileUri: existing.fileUri, mimeType };
    }

    // 2. Read file buffer
    if (!fs.existsSync(filePath)) {
      console.error(`[GeminiFileService] File path does not exist: ${filePath}`);
      return { fileUri: null, mimeType };
    }

    const fileBuffer = fs.readFileSync(filePath);

    // 3. Attempt Gemini Files API upload via @google/genai
    if (!this.aiClient) {
      this.initClient();
    }

    if (this.aiClient) {
      try {
        console.log(`[GeminiFileService] Uploading PDF (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB) to Gemini Files API...`);
        const uploadResult = await this.aiClient.files.upload({
          file: filePath,
          config: {
            mimeType: "application/pdf"
          }
        });

        if (uploadResult && uploadResult.uri) {
          const cachedHandle: CachedFileHandle = {
            fileUri: uploadResult.uri,
            mimeType: "application/pdf",
            documentHash,
            createdAt: Date.now(),
            expiresAt: Date.now() + (48 * 60 * 60 * 1000) // 48 hours validity
          };
          this.fileCache.set(documentHash, cachedHandle);
          console.log(`[GeminiFileService] Successfully cached Gemini File URI: ${uploadResult.uri}`);
          return { fileUri: uploadResult.uri, mimeType };
        }
      } catch (uploadErr) {
        console.warn("[GeminiFileService] Files API upload encountered error, falling back to base64 inline payload:", uploadErr);
      }
    }

    // Fallback: Inline Base64 payload for files under size limits
    const inlineBase64 = fileBuffer.toString('base64');
    return { fileUri: null, inlineBase64, mimeType };
  }

  public setCachedFileUri(documentHash: string, fileUri: string, ttlMs = 48 * 60 * 60 * 1000): void {
    this.fileCache.set(documentHash, {
      fileUri,
      mimeType: "application/pdf",
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
