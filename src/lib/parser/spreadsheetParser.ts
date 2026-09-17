import crypto from "crypto";
import * as XLSX from "xlsx";
import { CanonicalDocumentModel, FileInspectionResult } from "./types.js";
import {
  SourceValueProvenance,
  UniversalSourceCoordinate
} from "../evidence/universalSourceEvidence.js";

interface SpreadsheetCellEvidenceRef {
  provenanceId: string;
  cellAddress?: string;
  coordinate: UniversalSourceCoordinate;
}

interface SpreadsheetTableEvidence {
  headers: string[];
  rows: any[][];
  sheetName: string;
  name: string;
  pageNumber: number;
  rangeAddress?: string;
  headerEvidence: Array<SpreadsheetCellEvidenceRef | null>;
  rowEvidence: Array<Array<SpreadsheetCellEvidenceRef | null>>;
}

function primitiveCellValue(value: any): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function safeSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "sheet";
}

function formulaWithEquals(formula: any): string | undefined {
  if (!formula) return undefined;
  const raw = String(formula);
  return raw.startsWith("=") ? raw : `=${raw}`;
}

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
    const sourceSha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const sourceArtifactId = `artifact-spreadsheet-${sourceSha256.slice(0, 24)}`;
    const docId = `doc-sheet-${sourceSha256.slice(0, 16)}-${Date.now()}`;
    const detectedFormat = String(inspection?.detectedType || safeFilename.split(".").pop() || "xlsx").toLowerCase();
    const isCsvLike = detectedFormat === "csv" || detectedFormat === "tsv";

    const tables: SpreadsheetTableEvidence[] = [];
    const pages: Array<{ page_number: number; text: string; tables: any[] }> = [];
    const sourceBlocks: any[] = [];
    const sourceValueProvenance: SourceValueProvenance[] = [];
    const cellEvidence: SpreadsheetCellEvidenceRef[] = [];
    const spreadsheetManifest: any[] = [];
    let combinedText = "";

    if (buffer.length === 0) {
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
        metadata: {
          entityName: "Spreadsheet Import",
          page_count: 1,
          pages: 1,
          tablesCount: 0,
          detectedType: "spreadsheet",
          populatedCells: 0
        },
        raw_text: "",
        markdown: "",
        pages: [],
        page_count: 1,
        pageManifests: [{ page_number: 1, native_text_available: true }],
        tables: [],
        sourceBlocks: [],
        source_blocks: [],
        sourceValueProvenance: [],
        cellEvidence: [],
        spreadsheetManifest: []
      };
    }

    const workbook = XLSX.read(buffer, { type: "buffer", cellFormula: true, cellNF: true, cellText: true, cellStyles: true });
    let pageIdx = 1;

    for (const sheetName of workbook.SheetNames) {
      const worksheet: any = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      const rangeAddress = worksheet["!ref"] as string | undefined;
      if (!rangeAddress) continue;

      const decodedRange = XLSX.utils.decode_range(rangeAddress);
      const merges: any[] = Array.isArray(worksheet["!merges"]) ? worksheet["!merges"] : [];
      const rowsMeta: any[] = Array.isArray(worksheet["!rows"]) ? worksheet["!rows"] : [];
      const colsMeta: any[] = Array.isArray(worksheet["!cols"]) ? worksheet["!cols"] : [];
      const workbookSheetMeta = ((workbook as any).Workbook?.Sheets || []).find(
        (s: any) => String(s?.name || s?.Name || "") === sheetName
      );
      const hiddenSheet = Number(workbookSheetMeta?.Hidden || 0) > 0;

      const jsonRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        blankrows: true
      }) as any[][];

      const evidenceMatrix: Array<Array<SpreadsheetCellEvidenceRef | null>> = [];
      let populatedCellCount = 0;
      let formulaCellCount = 0;

      for (let localRow = 0; localRow < jsonRows.length; localRow++) {
        const rowEvidence: Array<SpreadsheetCellEvidenceRef | null> = [];
        const absoluteRow = decodedRange.s.r + localRow;
        const row = jsonRows[localRow] || [];
        const width = Math.max(row.length, decodedRange.e.c - decodedRange.s.c + 1);

        for (let localCol = 0; localCol < width; localCol++) {
          const absoluteCol = decodedRange.s.c + localCol;
          const address = XLSX.utils.encode_cell({ r: absoluteRow, c: absoluteCol });
          const cell: any = worksheet[address];
          if (!cell) {
            rowEvidence.push(null);
            continue;
          }

          populatedCellCount++;
          if (cell.f) formulaCellCount++;

          const merge = merges.find((m: any) =>
            absoluteRow >= m.s.r && absoluteRow <= m.e.r && absoluteCol >= m.s.c && absoluteCol <= m.e.c
          );
          let rawLiteral = "";
          try {
            rawLiteral = cell.w !== undefined ? String(cell.w) : XLSX.utils.format_cell(cell);
          } catch {
            rawLiteral = cell.v === undefined || cell.v === null ? "" : String(cell.v);
          }
          const normalizedValue = primitiveCellValue(cell.v);
          const provenanceId = `prov-${sourceSha256.slice(0, 16)}-${safeSlug(sheetName)}-${address.toLowerCase()}`;
          const coordinateId = `coord-${sourceSha256.slice(0, 16)}-${safeSlug(sheetName)}-${address.toLowerCase()}`;

          const coordinate: UniversalSourceCoordinate = isCsvLike
            ? {
                coordinateId,
                sourceArtifactId,
                sourceSha256,
                sourceType: "CSV",
                rowIndex: absoluteRow + 1,
                columnIndex: absoluteCol + 1,
                columnName: String(jsonRows[0]?.[localCol] ?? "") || undefined,
                rawLiteral,
                normalizedLiteral: normalizedValue === null ? undefined : String(normalizedValue),
                confidence: 1,
                extractionMethod: "sheetjs-native-cell",
                extractionVersion: String((XLSX as any).version || "unknown")
              }
            : {
                coordinateId,
                sourceArtifactId,
                sourceSha256,
                sourceType: "SPREADSHEET",
                workbookName: safeOriginalName,
                sheetName,
                cellAddress: address,
                rangeAddress,
                rowIndex: absoluteRow + 1,
                columnIndex: absoluteCol + 1,
                formula: formulaWithEquals(cell.f),
                cachedValue: normalizedValue,
                numberFormat: cell.z ? String(cell.z) : undefined,
                cellType: cell.t ? String(cell.t) : undefined,
                mergedRange: merge ? XLSX.utils.encode_range(merge) : undefined,
                hiddenSheet,
                hiddenRow: Boolean(rowsMeta[absoluteRow]?.hidden),
                hiddenColumn: Boolean(colsMeta[absoluteCol]?.hidden),
                rawLiteral,
                normalizedLiteral: normalizedValue === null ? undefined : String(normalizedValue),
                confidence: 1,
                extractionMethod: "sheetjs-native-cell",
                extractionVersion: String((XLSX as any).version || "unknown")
              };

          const provenance: SourceValueProvenance = {
            provenanceId,
            lineageKind: "SOURCE_OBSERVATION",
            materiality: "UNKNOWN",
            coordinates: [coordinate],
            parentProvenanceIds: [],
            rawLiteral,
            normalizedValue,
            transformationSteps: [
              {
                stepId: `step-parse-${provenanceId}`,
                operation: "PARSE",
                inputLiteral: rawLiteral,
                outputValue: normalizedValue,
                engine: "SheetJS",
                engineVersion: String((XLSX as any).version || "unknown")
              }
            ],
            verificationState: "VERIFIED",
            presentationUsages: [],
            createdAt: new Date().toISOString()
          };
          const evidenceRef: SpreadsheetCellEvidenceRef = {
            provenanceId,
            cellAddress: isCsvLike ? undefined : address,
            coordinate
          };

          sourceValueProvenance.push(provenance);
          cellEvidence.push(evidenceRef);
          rowEvidence.push(evidenceRef);
        }
        evidenceMatrix.push(rowEvidence);
      }

      const headers = (jsonRows[0] || []).map((h) => String(h ?? ""));
      const rows = jsonRows.slice(1);
      const tableItem: SpreadsheetTableEvidence = {
        sheetName,
        name: sheetName,
        headers,
        rows,
        pageNumber: pageIdx,
        rangeAddress,
        headerEvidence: evidenceMatrix[0] || [],
        rowEvidence: evidenceMatrix.slice(1)
      };
      tables.push(tableItem);

      const sheetText = jsonRows
        .map((r) => (r || []).map((c) => String(c ?? "")).join("\t"))
        .join("\n");
      pages.push({
        page_number: pageIdx,
        text: sheetText,
        tables: [tableItem]
      });
      sourceBlocks.push({
        source_block_id: `SB-${docId}-S${pageIdx}`,
        document_id: docId,
        page_number: pageIdx,
        section: sheetName,
        raw_text: sheetText,
        text_content: sheetText,
        evidence_scope: "SHEET",
        source_format: detectedFormat,
        source_artifact_id: sourceArtifactId,
        source_sha256: sourceSha256,
        sheet_name: sheetName,
        range_address: rangeAddress
      });
      spreadsheetManifest.push({
        sheetName,
        pageNumber: pageIdx,
        rangeAddress,
        populatedCellCount,
        formulaCellCount,
        hiddenSheet,
        mergedRanges: merges.map((m: any) => XLSX.utils.encode_range(m))
      });
      combinedText += `\n--- Sheet: ${sheetName} ---\n${sheetText}\n`;
      pageIdx++;
    }

    const pageCount = pages.length > 0 ? pages.length : 1;

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
      metadata: {
        entityName: "Spreadsheet Import",
        page_count: pageCount,
        pages: pageCount,
        tablesCount: tables.length,
        detectedType: "spreadsheet",
        populatedCells: cellEvidence.length,
        formulaCells: spreadsheetManifest.reduce((sum, sheet) => sum + sheet.formulaCellCount, 0)
      },
      raw_text: combinedText,
      markdown: combinedText,
      pages,
      page_count: pageCount,
      pageManifests: pages.map((page) => ({
        page_number: page.page_number,
        native_text_available: true,
        sheet_name: tables.find((table) => table.pageNumber === page.page_number)?.sheetName
      })),
      tables,
      sourceBlocks,
      source_blocks: sourceBlocks,
      sourceValueProvenance,
      cellEvidence,
      spreadsheetManifest
    };
  }
}
