import { CanonicalDocumentModel, FileInspectionResult } from "./types.js";
import crypto from "node:crypto";

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
    const lowerFilename = safeFilename.toLowerCase();
    const isHtml = mime.includes("html") || lowerFilename.endsWith(".htm") || lowerFilename.endsWith(".html") || lowerFilename.endsWith(".xhtml");
    const isPdf = !isHtml && (mime.includes("pdf") || lowerFilename.endsWith(".pdf"));
    const isWord = !isHtml && (mime.includes("word") || lowerFilename.endsWith(".docx"));

    let text = "";
    let detectedFormat = inspection?.detectedType || "txt";
    const extractedTables: any[] = [];
    let pdfPages: Array<{ page_number: number; text: string; tables: any[] }> | undefined;

    if (buffer.length > 0) {
      // File extension is an authoritative format signal for SEC .htm/.html
      // filings. Some upstream callers historically supplied application/pdf
      // for all non-spreadsheet documents; do not let that misclassify iXBRL.
      if (isHtml) {
        detectedFormat = "html";
        const raw = buffer.toString("utf-8");
        const visibleRaw = raw
          .replace(/<!--[\s\S]*?-->/g, " ")
          .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
          .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
          .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
          .replace(/<ix:hidden\b[^>]*>[\s\S]*?<\/ix:hidden>/gi, " ");

        const tableMatches = visibleRaw.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi);
        for (const tm of tableMatches) {
          const tContent = tm[1];
          const rows: string[][] = [];
          const rowMatches = tContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
          for (const rm of rowMatches) {
            const cells: string[] = [];
            const cellMatches = rm[1].matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi);
            for (const cm of cellMatches) {
              const cellText = cm[1]
                .replace(/<[^>]+>/g, " ")
                .replace(/&nbsp;|&#160;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/\s+/g, " ")
                .trim();
              if (cellText) cells.push(cellText);
            }
            if (cells.length > 0) rows.push(cells);
          }
          if (rows.length > 0) {
            extractedTables.push({
              name: `Table-${extractedTables.length + 1}`,
              sheetName: `Table-${extractedTables.length + 1}`,
              rows,
              headers: rows[0] || [],
              pageNumber: 1
            });
          }
        }

        text = visibleRaw
          .replace(/<(?:br|p|div|tr|li|h[1-6])[^>]*>/gi, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;|&#160;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/[ \t]+/g, " ")
          .replace(/ *\n+ */g, "\n")
          .trim();
      } else if (isPdf) {
        detectedFormat = "pdf";
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buffer });
        try {
          const result = await parser.getText();
          pdfPages = result.pages.map(page => ({ page_number: page.num, text: page.text, tables: [] }));
          if (!pdfPages.length) throw new Error('PDF_PAGE_INVENTORY_MISSING');
          text = pdfPages.map(page => page.text).join('\n');
        } finally {
          await parser.destroy();
        }
        // Parser failures propagate. Binary PDF bytes are never native-text evidence.
      } else if (isWord) {
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
    const pages = pdfPages || [{ page_number: 1, text, tables: extractedTables }];
    const sourceSha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const sourceKind = detectedFormat === "pdf" ? "PDF" : detectedFormat === "html" ? "HTML" : "TEXT";
    const sourceArtifactId = `artifact-${sourceKind.toLowerCase()}-${sourceSha256.slice(0, 24)}`;
    const coordinateFor = (suffix: string, locator: Record<string, any>) => ({
      coordinateId: `coord-${sourceSha256.slice(0, 16)}-${suffix}`,
      sourceArtifactId,
      sourceSha256,
      sourceType: sourceKind,
      rawLiteral: locator.rawLiteral,
      normalizedLiteral: locator.normalizedLiteral,
      extractionMethod: sourceKind === "PDF" ? "PDF_NATIVE_TEXT" : `${sourceKind}_NATIVE_TEXT`,
      extractionVersion: "anydoc-2.1",
      confidence: 0.98,
      ...locator
    });

    let htmlCursor = 0;
    const sourceBlocks = detectedFormat === "html"
      ? lines.map((line, idx) => {
          const locatedStart = text.indexOf(line, htmlCursor);
          const textStart = locatedStart >= 0 ? locatedStart : htmlCursor;
          htmlCursor = textStart + line.length;
          const sourceCoordinate = coordinateFor(`line-${idx + 1}`, {
            textStart: Math.max(0, textStart),
            textEnd: Math.max(0, textStart) + line.length,
            rawLiteral: line,
            normalizedLiteral: line
          });
          const sourceProvenanceId = `prov-${sourceSha256.slice(0, 16)}-line-${idx + 1}`;
          return ({
          source_block_id: `SB-${docId}-DOC-${idx + 1}`,
          document_id: docId,
          page_number: 1,
          section: "Main Content",
          raw_text: line,
          text_content: line,
          evidence_scope: "DOCUMENT",
          source_format: "html",
          source_sha256: sourceSha256,
          source_artifact_id: sourceArtifactId,
          source_provenance_id: sourceProvenanceId,
          source_coordinate: sourceCoordinate,
          extraction_method: sourceCoordinate.extractionMethod,
          extraction_version: sourceCoordinate.extractionVersion
        });
        })
      : pages.filter(page => page.text.trim().length > 0).map(page => {
          const sourceCoordinate = coordinateFor(`p${page.page_number}-native`, sourceKind === "PDF" ? {
            pageNumber: page.page_number,
            textStart: 0,
            textEnd: page.text.length,
            rawLiteral: page.text,
            normalizedLiteral: page.text
          } : {
            lineStart: 1,
            lineEnd: Math.max(1, page.text.split("\n").length),
            rawLiteral: page.text,
            normalizedLiteral: page.text
          });
          const sourceProvenanceId = `prov-${sourceSha256.slice(0, 16)}-p${page.page_number}-native`;
          return ({
          source_block_id: `SB-${docId}-P${page.page_number}`,
          document_id: docId,
          page_number: page.page_number,
          section: "Main Content",
          raw_text: page.text,
          text_content: page.text,
          evidence_scope: "PAGE",
          source_format: detectedFormat,
          source_sha256: sourceSha256,
          source_artifact_id: sourceArtifactId,
          source_provenance_id: sourceProvenanceId,
          source_coordinate: sourceCoordinate,
          extraction_method: sourceCoordinate.extractionMethod,
          extraction_version: sourceCoordinate.extractionVersion
        });
        });

    return {
      document_id: docId,
      source: {
        filename: safeFilename,
        originalName: safeOriginalName,
        format: detectedFormat,
        hash: sourceSha256,
        sourceArtifactId,
        access_timestamp: new Date().toISOString()
      },
      parser: {
        engine: "anydoc",
        version: "2.0",
        ocr_used: false,
        confidence: 0.98
      },
      metadata: {
        entityName: safeFilename ? safeFilename.replace(/\.[^/.]+$/, "") : "Unknown Entity",
        language: "en",
        page_count: pages.length,
        pages: pages.length,
        detectedType: detectedFormat
      },
      raw_text: text,
      markdown: text,
      pages,
      page_count: pages.length,
      pageManifests: pages.map(page => ({ page_number: page.page_number, native_text_available: page.text.trim().length > 0 })),
      sourceBlocks,
      tables: extractedTables,
      sections: lines.length > 0 ? [{ title: "Main Content", text, page: 1 }] : []
    };
  }
}
