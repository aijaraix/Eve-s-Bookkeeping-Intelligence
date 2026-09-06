import { CanonicalDocumentModel, FileInspectionResult } from "./types.js";

export class OCRParser {
  public async parse(
    fileInput: {
      filename?: string;
      originalName?: string;
      mimeType?: string;
      size?: number;
      buffer?: Buffer;
      [key: string]: any;
    },
    inspection?: FileInspectionResult | any
  ): Promise<CanonicalDocumentModel> {
    const filename = fileInput.filename || fileInput.originalName || "image.png";
    const originalName = fileInput.originalName || filename;
    const docId = `doc-ocr-${Date.now()}`;
    const text = `[OCR Text Content for ${filename}]`;

    return {
      document_id: docId,
      source: {
        filename,
        originalName,
        format: inspection?.detectedType || "image",
        access_timestamp: new Date().toISOString()
      },
      metadata: {
        entityName: filename.replace(/\.[^/.]+$/, ""),
        page_count: 1,
        pages: 1,
        detectedType: "ocr_image"
      },
      raw_text: text,
      markdown: text,
      pages: [
        {
          page_number: 1,
          text,
          tables: []
        }
      ],
      page_count: 1,
      pageManifests: [
        {
          page_number: 1,
          native_text_available: true
        }
      ],
      tables: [],
      sections: []
    };
  }
}
