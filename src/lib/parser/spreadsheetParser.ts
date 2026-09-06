import * as XLSX from "xlsx";
import { CanonicalDocumentModel, FileInspectionResult } from "./types.js";

export class SpreadsheetParser {
  public async inspect(fileInput: {
    filename?: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
    buffer?: Buffer;
    [key: string]: any;
  }): Promise<FileInspectionResult> {
    const rawName = fileInput.originalName || fileInput.filename || "spreadsheet.xlsx";
    const ext = rawName.includes(".") ? rawName.split(".").pop()?.toLowerCase() || "xlsx" : "xlsx";
    return {
      detectedType: ext,
      mimeType: fileInput.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      needsOCR: false,
      isMultimodalImage: false,
      requiresParser: "SpreadsheetParser",
      confidence: 0.99,
      size: fileInput.size || fileInput.buffer?.length || 0,
      originalName: rawName
    };
  }

  public async parse(
    fileInput: {
      filename?: string;
      originalName?: string;
      mimeType?: string;
      size?: number;
      buffer?: Buffer;
      [key: string]: any;
    },
    inspection?: any
  ): Promise<CanonicalDocumentModel> {
    const safeFilename = fileInput.filename || fileInput.originalName || "spreadsheet.xlsx";
    const safeOriginalName = fileInput.originalName || fileInput.filename || "spreadsheet.xlsx";
    const buffer = fileInput.buffer || Buffer.alloc(0);

    const docId = `doc-sheet-${Date.now()}`;
    const tables: Array<{ headers: string[]; rows: (string | number)[][]; sheetName: string; pageNumber: number }> = [];
    const pages: Array<{ page_number: number; text: string; tables: any[] }> = [];
    let combinedText = "";

    try {
      if (buffer.length > 0) {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        let pageIdx = 1;

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) continue;

          const jsonRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (jsonRows.length > 0) {
            const headers = (jsonRows[0] || []).map((h) => String(h ?? ""));
            const rows = jsonRows.slice(1);
            const tableItem = {
              sheetName,
              headers,
              rows,
              pageNumber: pageIdx
            };
            tables.push(tableItem);

            const sheetText = jsonRows
              .map((r) => r.map((c) => String(c ?? "")).join("\t"))
              .join("\n");
            pages.push({
              page_number: pageIdx,
              text: sheetText,
              tables: [tableItem]
            });
            combinedText += `\n--- Sheet: ${sheetName} ---\n` + sheetText + "\n";
            pageIdx++;
          }
        }
      }
    } catch (err) {
      console.warn("[SpreadsheetParser] Warning reading workbook:", err);
    }

    const pageCount = pages.length > 0 ? pages.length : 1;

    return {
      document_id: docId,
      source: {
        filename: safeFilename,
        originalName: safeOriginalName,
        format: inspection?.detectedType || "xlsx",
        access_timestamp: new Date().toISOString()
      },
      metadata: {
        entityName: "Spreadsheet Import",
        page_count: pageCount,
        pages: pageCount,
        tablesCount: tables.length,
        detectedType: "spreadsheet"
      },
      raw_text: combinedText,
      markdown: combinedText,
      pages,
      page_count: pageCount,
      pageManifests: Array.from({ length: pageCount }, (_, i) => ({
        page_number: i + 1,
        native_text_available: true
      })),
      tables
    };
  }
}
