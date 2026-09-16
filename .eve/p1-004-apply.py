from __future__ import annotations

from pathlib import Path
import re
import textwrap

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text()


def write(path: str, content: str) -> None:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content)


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected exactly one match, found {count}: {old[:120]!r}")
    write(path, content.replace(old, new, 1))


def regex_once(path: str, pattern: str, repl: str, flags: int = 0) -> None:
    content = read(path)
    updated, count = re.subn(pattern, repl, content, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f"{path}: expected exactly one regex match, found {count}: {pattern[:120]!r}")
    write(path, updated)


spreadsheet_parser = r'''import crypto from "crypto";
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

    const workbook = XLSX.read(buffer, { type: "buffer", cellFormula: true, cellNF: true, cellText: true });
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
'''
write("src/lib/parser/spreadsheetParser.ts", spreadsheet_parser)

# Explicit fact fields so provenance is a first-class ExtractedFact contract.
replace_once(
    "src/types.ts",
    "  provenanceCoordinates?: any;\n  [key: string]: any;\n}",
    "  provenanceCoordinates?: any;\n  sourceProvenanceId?: string;\n  sourceProvenanceIds?: string[];\n  sourceCoordinate?: any;\n  sourceCoordinates?: any[];\n  sourceProvenanceRecords?: any[];\n  universalProvenance?: any;\n  provenance?: any;\n  [key: string]: any;\n}"
)

# Worker: resolve parser provenance IDs and attach exact cell evidence to facts.
replace_once(
    "server/worker.ts",
    "function extractDeterministicFactsFromDocument(parsedDoc: any, job: WorkerJob): ExtractedFact[] {\n  const extractedFacts: ExtractedFact[] = [];\n  const fullText =",
    "function extractDeterministicFactsFromDocument(parsedDoc: any, job: WorkerJob): ExtractedFact[] {\n  const extractedFacts: ExtractedFact[] = [];\n  const parserProvenanceById = new Map<string, any>((Array.isArray(parsedDoc.sourceValueProvenance) ? parsedDoc.sourceValueProvenance : []).map((p: any) => [p.provenanceId, p]));\n  const fullText ="
)
replace_once(
    "server/worker.ts",
    "                const factId = `fct-${pattern.metric}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;\n\n                extractedFacts.push({",
    "                const factId = `fct-${pattern.metric}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;\n                const valueEvidence = table.rowEvidence?.[rIdx]?.[cIdx];\n                const labelEvidence = table.rowEvidence?.[rIdx]?.[0];\n                const sourceCoordinates = [labelEvidence?.coordinate, valueEvidence?.coordinate].filter(Boolean);\n                const sourceProvenanceIds = [labelEvidence?.provenanceId, valueEvidence?.provenanceId].filter(Boolean);\n                const sourceProvenanceRecords = sourceProvenanceIds.map((id: string) => parserProvenanceById.get(id)).filter(Boolean);\n                const universalProvenanceId = `prov-fact-${factId}`;\n\n                extractedFacts.push({"
)
replace_once(
    "server/worker.ts",
    "                  verificationStatus: \"CANONICAL_SELECTED\",\n                  provenance: {",
    "                  verificationStatus: \"CANONICAL_SELECTED\",\n                  sourceProvenanceId: valueEvidence?.provenanceId,\n                  sourceProvenanceIds,\n                  sourceCoordinate: valueEvidence?.coordinate,\n                  sourceCoordinates,\n                  provenanceCoordinates: sourceCoordinates,\n                  sourceProvenanceRecords,\n                  universalProvenance: {\n                    provenanceId: universalProvenanceId,\n                    workspaceId: job.workspaceId,\n                    entityId: undefined,\n                    period: defaultPeriod,\n                    currency: job.functionalCurrency,\n                    lineageKind: \"CANONICAL_FACT\",\n                    materiality: \"MATERIAL\",\n                    coordinates: [],\n                    parentProvenanceIds: sourceProvenanceIds,\n                    rawLiteral: cellValStr,\n                    normalizedValue: finalValue,\n                    transformationSteps: [{\n                      stepId: `step-map-${factId}`,\n                      operation: \"MAP\",\n                      inputProvenanceIds: sourceProvenanceIds,\n                      inputLiteral: cellValStr,\n                      outputValue: finalValue,\n                      engine: \"EveSpreadsheetFactExtractor\",\n                      engineVersion: \"1\"\n                    }],\n                    verificationState: \"VERIFIED\",\n                    presentationUsages: []\n                  },\n                  provenance: {"
)
replace_once(
    "server/worker.ts",
    "                    tableName: sheetName,\n                    rowLabel: rawLabel,\n                    columnLabel: table.headers?.[cIdx] || \"Value\"\n                  }",
    "                    tableName: sheetName,\n                    rowLabel: rawLabel,\n                    columnLabel: table.headers?.[cIdx] || \"Value\",\n                    sourceProvenanceId: valueEvidence?.provenanceId,\n                    sourceProvenanceIds,\n                    sourceCoordinate: valueEvidence?.coordinate,\n                    provenanceCoordinates: sourceCoordinates,\n                    sourceArtifactId: valueEvidence?.coordinate?.sourceArtifactId,\n                    sourceSha256: valueEvidence?.coordinate?.sourceSha256,\n                    sheetName: valueEvidence?.coordinate?.sheetName || sheetName,\n                    cellAddress: valueEvidence?.coordinate?.cellAddress,\n                    formula: valueEvidence?.coordinate?.formula,\n                    numberFormat: valueEvidence?.coordinate?.numberFormat\n                  }"
)

# Web persistence boundary: keep worker provenance instead of discarding it.
replace_once(
    "server.ts",
    "        extractionMethod: f.extractionMethod,\n        extractionEngine: f.extractionEngine,\n        created_at: new Date().toISOString()",
    "        extractionMethod: f.extractionMethod,\n        extractionEngine: f.extractionEngine,\n        sourceProvenanceId: f.sourceProvenanceId,\n        sourceProvenanceIds: f.sourceProvenanceIds,\n        sourceCoordinate: f.sourceCoordinate,\n        sourceCoordinates: f.sourceCoordinates || f.provenanceCoordinates,\n        provenanceCoordinates: f.provenanceCoordinates || f.sourceCoordinates,\n        sourceProvenanceRecords: f.sourceProvenanceRecords,\n        universalProvenance: f.universalProvenance,\n        provenance: f.provenance,\n        created_at: new Date().toISOString()"
)

# Presentation contracts expose exact source evidence to the real dashboard and drawer.
replace_once(
    "src/types/presentationModels.ts",
    "  sourceRawValue?: string | number;\n  sha256Hash?: string;\n}",
    "  sourceRawValue?: string | number;\n  sha256Hash?: string;\n  sourceType?: string;\n  sourceProvenanceId?: string;\n  sourceCoordinate?: any;\n  sourceCoordinates?: any[];\n  sourceLocationLabel?: string;\n  sourceFormula?: string;\n}"
)
replace_once(
    "src/types/presentationModels.ts",
    "  sourcePage?: number;\n  factLineageId?: string;\n  renderId?: string;\n}",
    "  sourcePage?: number;\n  sourceText?: string;\n  sourceRawValue?: string | number;\n  sourceType?: string;\n  sourceProvenanceId?: string;\n  sourceCoordinate?: any;\n  sourceCoordinates?: any[];\n  sourceLocationLabel?: string;\n  sourceFormula?: string;\n  factLineageId?: string;\n  renderId?: string;\n}"
)

# Presentation adapter preserves the fact's universal coordinate into StatementLinePresentation.
regex_once(
    "src/adapters/presentationAdapters.ts",
    r"function factSourcePage\(fact: any\): number \| undefined \{\n  const raw = fact\?\.pageNumber \?\? fact\?\.page \?\? fact\?\.sourcePage \?\? fact\?\.extractorLocator;\n  const num = Number\(raw\);\n  return Number\.isFinite\(num\) \? num : undefined;\n\}\n",
    '''function factSourcePage(fact: any): number | undefined {\n  const raw = fact?.pageNumber ?? fact?.page ?? fact?.sourcePage ?? fact?.extractorLocator;\n  const num = Number(raw);\n  return Number.isFinite(num) ? num : undefined;\n}\n\nfunction factSourceCoordinates(fact: any): any[] {\n  const coordinates = fact?.sourceCoordinates || fact?.provenanceCoordinates || fact?.provenance?.provenanceCoordinates;\n  if (Array.isArray(coordinates) && coordinates.length > 0) return coordinates;\n  const single = fact?.sourceCoordinate || fact?.provenance?.sourceCoordinate;\n  return single ? [single] : [];\n}\n\nfunction sourceCoordinateLabel(coordinate: any, sourcePage?: number): string | undefined {\n  if (!coordinate) return sourcePage ? `Page ${sourcePage}` : undefined;\n  if (coordinate.sourceType === 'SPREADSHEET') {\n    const cell = coordinate.cellAddress || coordinate.rangeAddress || 'cell not recorded';\n    return `${coordinate.sheetName || 'Sheet'}!${cell}`;\n  }\n  if (coordinate.sourceType === 'CSV') {\n    return `Row ${coordinate.rowIndex}${coordinate.columnIndex ? ` · Column ${coordinate.columnIndex}` : ''}`;\n  }\n  if (coordinate.sourceType === 'PDF') return `Page ${coordinate.pageNumber}`;\n  if (coordinate.sourceType === 'IMAGE') return coordinate.pageNumber ? `Image page ${coordinate.pageNumber}` : 'Image region';\n  return sourcePage ? `Page ${sourcePage}` : coordinate.sourceType;\n}\n'''
)
replace_once(
    "src/adapters/presentationAdapters.ts",
    "    sourceDocName: factSourceName(fact),\n    sourcePage: factSourcePage(fact),\n    factLineageId: fact?.id,",
    "    sourceDocName: factSourceName(fact),\n    sourcePage: factSourcePage(fact),\n    sourceText: fact?.sourceText || fact?.rawText || fact?.provenance?.sourceText,\n    sourceRawValue: fact?.valueOriginal ?? fact?.rawValue,\n    sourceProvenanceId: fact?.sourceProvenanceId || fact?.provenance?.sourceProvenanceId,\n    sourceCoordinates: factSourceCoordinates(fact),\n    sourceCoordinate: factSourceCoordinates(fact)[0],\n    sourceType: factSourceCoordinates(fact)[0]?.sourceType,\n    sourceLocationLabel: sourceCoordinateLabel(factSourceCoordinates(fact)[0], factSourcePage(fact)),\n    sourceFormula: factSourceCoordinates(fact)[0]?.formula,\n    factLineageId: fact?.id,"
)

# Real Practice Home dashboard: pass and expose provenance metadata on the actual financial identity buttons.
replace_once(
    "src/components/views/practice/PracticeHomeView.tsx",
    "      currency: line.currency, scale: line.scale, provenanceStatus: 'review_required', sourceDocName: line.sourceDocName,\n      sourcePage: line.sourcePage, sourceRawValue: line.values[selectedPeriod] });",
    "      currency: line.currency, scale: line.scale, provenanceStatus: 'review_required', sourceDocName: line.sourceDocName,\n      sourcePage: line.sourcePage, sourceText: line.sourceText, sourceRawValue: line.sourceRawValue ?? line.values[selectedPeriod],\n      renderId: line.renderId, sourceType: line.sourceType, sourceProvenanceId: line.sourceProvenanceId,\n      sourceCoordinate: line.sourceCoordinate, sourceCoordinates: line.sourceCoordinates, sourceLocationLabel: line.sourceLocationLabel,\n      sourceFormula: line.sourceFormula });"
)
replace_once(
    "src/components/views/practice/PracticeHomeView.tsx",
    "                  return <button type=\"button\" key={metric} disabled={!line?.factLineageId} onClick={() => inspectLine(line)} className=\"p-4 bg-slate-50 rounded-xl border border-slate-200 disabled:cursor-default\">",
    "                  return <button type=\"button\" key={metric} disabled={!line?.factLineageId} onClick={() => inspectLine(line)}\n                    data-fact-lineage-id={line?.factLineageId || undefined}\n                    data-render-id={line?.renderId || undefined}\n                    data-source-provenance-id={line?.sourceProvenanceId || undefined}\n                    data-source-type={line?.sourceType || undefined}\n                    data-source-location={line?.sourceLocationLabel || undefined}\n                    className=\"p-4 bg-slate-50 rounded-xl border border-slate-200 disabled:cursor-default\">"
)

# Provenance drawer: show source-type-aware locator and exact spreadsheet fields.
replace_once(
    "src/components/design-system/EveProvenanceDrawer.tsx",
    "  const recordedHash = metadata.sha256Hash || 'Hash not recorded';\n",
    "  const recordedHash = metadata.sha256Hash || metadata.sourceCoordinate?.sourceSha256 || 'Hash not recorded';\n  const coordinate = metadata.sourceCoordinate || metadata.sourceCoordinates?.[0];\n  const sourceLocator = metadata.sourceLocationLabel || (coordinate?.sourceType === 'SPREADSHEET'\n    ? `${coordinate.sheetName || 'Sheet'}!${coordinate.cellAddress || coordinate.rangeAddress || 'cell not recorded'}`\n    : coordinate?.sourceType === 'CSV'\n      ? `Row ${coordinate.rowIndex}${coordinate.columnIndex ? ` · Column ${coordinate.columnIndex}` : ''}`\n      : coordinate?.sourceType === 'PDF'\n        ? `Page ${coordinate.pageNumber}`\n        : metadata.sourcePage ? `Page ${metadata.sourcePage}` : 'not recorded');\n"
)
replace_once(
    "src/components/design-system/EveProvenanceDrawer.tsx",
    "                      Source locator: {metadata.sourcePage || 'not recorded'} (physical PDF page not independently verified)",
    "                      Source locator: {sourceLocator}"
)
replace_once(
    "src/components/design-system/EveProvenanceDrawer.tsx",
    "                  <div className=\"p-3 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs font-serif leading-relaxed text-slate-800\">\n                    <p className=\"italic\">\n                      {metadata.sourceText || 'No source quotation is recorded for this reference.'}\n                    </p>\n                  </div>\n                </div>\n              </div>",
    "                  <div className=\"p-3 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs font-serif leading-relaxed text-slate-800\">\n                    <p className=\"italic\">\n                      {metadata.sourceText || 'No source quotation is recorded for this reference.'}\n                    </p>\n                  </div>\n                  {coordinate?.sourceType === 'SPREADSHEET' && (\n                    <div className=\"grid grid-cols-2 gap-2 text-[11px] font-mono bg-indigo-50/60 border border-indigo-100 rounded-lg p-3\">\n                      <span className=\"text-slate-500\">Workbook</span><span>{coordinate.workbookName || metadata.sourceDocName || 'Not recorded'}</span>\n                      <span className=\"text-slate-500\">Sheet / Cell</span><span>{coordinate.sheetName || 'Sheet'}!{coordinate.cellAddress || coordinate.rangeAddress || 'Not recorded'}</span>\n                      <span className=\"text-slate-500\">Formula</span><span>{coordinate.formula || 'Literal value'}</span>\n                      <span className=\"text-slate-500\">Cached / parsed value</span><span>{coordinate.cachedValue !== undefined && coordinate.cachedValue !== null ? String(coordinate.cachedValue) : 'Not recorded'}</span>\n                      <span className=\"text-slate-500\">Number format</span><span>{coordinate.numberFormat || 'Not recorded'}</span>\n                      <span className=\"text-slate-500\">Provenance ID</span><span className=\"break-all\">{metadata.sourceProvenanceId || 'Not recorded'}</span>\n                    </div>\n                  )}\n                </div>\n              </div>"
)
replace_once(
    "src/components/design-system/EveProvenanceDrawer.tsx",
    "                    <span className=\"text-slate-500\">Raw Filing Value</span>",
    "                    <span className=\"text-slate-500\">Raw Source Value</span>"
)

# End-to-end branch test: parser coordinate -> fact adapter -> actual dashboard metadata contract.
test_file = r'''import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import { SpreadsheetParser } from '../../src/lib/parser/spreadsheetParser.js';
import { adaptFactsToBalanceSheet } from '../../src/adapters/presentationAdapters.js';

const wb = XLSX.utils.book_new();
const ws: any = XLSX.utils.aoa_to_sheet([
  ['Metric', 'Value'],
  ['Total Assets', 100],
  ['Total Liabilities', 60],
  ['Total Equity', 40]
]);
ws.B4 = { t: 'n', f: 'B2-B3', v: 40, z: '$#,##0.00' };
ws['!ref'] = 'A1:B4';
ws['!cols'] = [{}, { hidden: true }];
XLSX.utils.book_append_sheet(wb, ws, 'Balance');
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

const parser = new SpreadsheetParser();
const parsed: any = await parser.parse({
  filename: 'Synthetic_Balance.xlsx',
  originalName: 'Synthetic_Balance.xlsx',
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  buffer,
  size: buffer.length
}, { detectedType: 'xlsx' });

assert.match(parsed.source.hash, /^[a-f0-9]{64}$/);
assert.equal(parsed.source.sourceArtifactId.startsWith('artifact-spreadsheet-'), true);
assert.equal(parsed.tables.length, 1);
assert.equal(parsed.tables[0].rowEvidence.length, 3);
const b4Ref = parsed.tables[0].rowEvidence[2][1];
assert.equal(b4Ref.coordinate.sourceType, 'SPREADSHEET');
assert.equal(b4Ref.coordinate.sheetName, 'Balance');
assert.equal(b4Ref.coordinate.cellAddress, 'B4');
assert.equal(b4Ref.coordinate.formula, '=B2-B3');
assert.equal(b4Ref.coordinate.cachedValue, 40);
assert.equal(b4Ref.coordinate.numberFormat, '$#,##0.00');
assert.equal(b4Ref.coordinate.hiddenColumn, true);
assert.equal(parsed.sourceValueProvenance.some((p: any) => p.provenanceId === b4Ref.provenanceId), true);

const b2Ref = parsed.tables[0].rowEvidence[0][1];
const b3Ref = parsed.tables[0].rowEvidence[1][1];
const sourceFact = (id: string, metric: string, value: number, evidence: any) => ({
  id,
  canonicalMetric: metric,
  labelOriginal: metric.replaceAll('_', ' '),
  labelNormalized: metric.replaceAll('_', ' '),
  valueOriginal: String(value),
  valueFunctional: String(value),
  normalizedValue: value,
  reportingPeriod: 'FY 2026',
  verificationStatus: 'VERIFIED',
  sourceDocument: 'Synthetic_Balance.xlsx',
  sourceText: `${metric}: ${value} (${evidence.coordinate.sheetName}!${evidence.coordinate.cellAddress})`,
  sourceProvenanceId: evidence.provenanceId,
  sourceCoordinate: evidence.coordinate,
  sourceCoordinates: [evidence.coordinate],
  provenanceCoordinates: [evidence.coordinate]
});
const facts = [
  sourceFact('fact-assets', 'total_assets', 100, b2Ref),
  sourceFact('fact-liabilities', 'total_liabilities', 60, b3Ref),
  sourceFact('fact-equity', 'total_equity', 40, b4Ref)
];
const projected = adaptFactsToBalanceSheet(facts, 'FY 2026', 'USD');
const equity = projected.lines.find(line => line.canonicalMetric === 'total_equity')!;
assert.equal(equity.factLineageId, 'fact-equity');
assert.equal(equity.sourceProvenanceId, b4Ref.provenanceId);
assert.equal(equity.sourceCoordinate?.cellAddress, 'B4');
assert.equal(equity.sourceLocationLabel, 'Balance!B4');
assert.equal(equity.sourceFormula, '=B2-B3');
assert.ok(equity.renderId, 'real presentation adapter must register a render ID');

const serverSource = fs.readFileSync('server.ts', 'utf8');
assert(serverSource.includes('sourceProvenanceId: f.sourceProvenanceId'), 'web persistence must retain provenance ID');
assert(serverSource.includes('sourceCoordinate: f.sourceCoordinate'), 'web persistence must retain exact source coordinate');
const workerSource = fs.readFileSync('server/worker.ts', 'utf8');
assert(workerSource.includes('sourceCoordinate: valueEvidence?.coordinate'), 'worker fact extraction must bind the numeric cell coordinate');
const homeSource = fs.readFileSync('src/components/views/practice/PracticeHomeView.tsx', 'utf8');
assert(homeSource.includes('data-source-provenance-id'), 'actual Practice Home financial identity card must expose provenance ID in DOM');
assert(homeSource.includes('data-source-location'), 'actual Practice Home financial identity card must expose source location in DOM');
const drawerSource = fs.readFileSync('src/components/design-system/EveProvenanceDrawer.tsx', 'utf8');
assert(drawerSource.includes("coordinate?.sourceType === 'SPREADSHEET'"), 'provenance drawer must render spreadsheet-specific evidence');
assert(drawerSource.includes('Sheet / Cell'), 'provenance drawer must show exact sheet/cell');

console.log('SPREADSHEET_SOURCE_TO_PIXEL_LINEAGE_TESTS=PASS');
'''
write("server/tests/spreadsheetSourceToPixelLineage.test.ts", test_file)

print("P1_004_PATCH_APPLIED=YES")
