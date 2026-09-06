import { CanonicalDocumentModel, FileInspectionResult } from "./types.js";

export class AnyDocParser {
  public async parse(
    fileInput: {
      filename?: string | null;
      originalName?: string | null;
      mimeType?: string | null;
      size?: number | null;
      buffer?: Buffer | null;
      [key: string]: any;
    },
    inspection?: FileInspectionResult | any
  ): Promise<CanonicalDocumentModel> {
    const rawFilename = fileInput?.filename ?? fileInput?.originalName ?? "document.txt";
    const safeFilename = typeof rawFilename === "string" ? rawFilename : "document.txt";
    const safeOriginalName = typeof fileInput?.originalName === "string" ? fileInput.originalName : safeFilename;
    const buffer = Buffer.isBuffer(fileInput?.buffer) ? fileInput.buffer : Buffer.alloc(0);
    const mime = typeof fileInput?.mimeType === "string" ? fileInput.mimeType : "text/plain";

    let text = "";
    let detectedFormat = inspection?.detectedType || "txt";

    if (buffer.length > 0) {
      if (mime.includes("pdf") || safeFilename.toLowerCase().endsWith(".pdf")) {
        detectedFormat = "pdf";
        try {
          // Dynamic import or safe fallback for pdf-parse if available
          const pdfModule: any = await import("pdf-parse");
          const pdfParse = pdfModule.default || pdfModule;
          const pdfData = await pdfParse(buffer);
          text = pdfData.text || "";
        } catch {
          text = buffer.toString("utf-8");
        }
      } else if (mime.includes("word") || safeFilename.toLowerCase().endsWith(".docx")) {
        detectedFormat = "docx";
        try {
          const mammoth = (await import("mammoth")).default;
          const docxData = await mammoth.extractRawText({ buffer });
          text = docxData.value || "";
        } catch {
          text = buffer.toString("utf-8");
        }
      } else {
        text = buffer.toString("utf-8");
      }
    }

    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const docId = `doc-${Date.now()}`;
    const pages = [
      {
        page_number: 1,
        text,
        tables: []
      }
    ];

    return {
      document_id: docId,
      source: {
        filename: safeFilename,
        originalName: safeOriginalName,
        format: detectedFormat,
        access_timestamp: new Date().toISOString()
      },
      metadata: {
        entityName: safeFilename ? safeFilename.replace(/\.[^/.]+$/, "") : "Unknown Entity",
        language: "en",
        page_count: 1,
        pages: 1,
        detectedType: detectedFormat
      },
      raw_text: text,
      markdown: text,
      pages,
      page_count: 1,
      pageManifests: [
        {
          page_number: 1,
          native_text_available: text.length > 0
        }
      ],
      tables: [],
      sections: lines.length > 0 ? [{ title: "Main Content", text, page: 1 }] : []
    };
  }
}
