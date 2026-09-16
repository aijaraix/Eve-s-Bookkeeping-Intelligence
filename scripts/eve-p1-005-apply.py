from pathlib import Path


def edit(path: str, old: str, new: str, count: int = 1) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"MISSING_SNIPPET:{path}:{old[:100]!r}")
    p.write_text(text.replace(old, new, count))


edit(
    "server.ts",
    'import { OCRParser } from "./src/lib/parser/ocrParser";\nimport { WebParser } from "./src/lib/parser/webParser";',
    'import { OCRParser } from "./src/lib/parser/ocrParser";\nimport { selectParserPath } from "./src/lib/parser/parserSelection";\nimport { WebParser } from "./src/lib/parser/webParser";',
)
edit(
    "server.ts",
    '''          const parsePromise = (async () => {\n            if (inspection.requiresSpreadsheetPath) {\n              return await spreadsheetParser.parse(fileInput, inspection);\n            } else if (inspection.needsOCR) {\n              return await ocrParser.parse(fileInput, inspection);\n            } else {\n              return await anyDocParser.parse(fileInput, inspection);\n            }\n          })();''',
    '''          const parsePromise = (async () => {\n            const parserPath = selectParserPath(inspection);\n            if (parserPath === "SPREADSHEET") return await spreadsheetParser.parse(fileInput, inspection);\n            if (parserPath === "OCR") return await ocrParser.parse(fileInput, inspection);\n            return await anyDocParser.parse(fileInput, inspection);\n          })();''',
)

edit(
    "server/worker.ts",
    'import { OCRParser } from "../src/lib/parser/ocrParser.js";\nimport {',
    'import { OCRParser } from "../src/lib/parser/ocrParser.js";\nimport { selectParserPath } from "../src/lib/parser/parserSelection.js";\nimport {',
)
edit(
    "server/worker.ts",
    '''    let parsedDoc: any;\n    const ext = inspection.detectedType.toLowerCase();\n\n    if (ext === "xlsx" || ext === "xls" || ext === "csv") {\n      parsedDoc = await spreadsheetParser.parse(fileInput, inspection);\n    } else {\n      parsedDoc = await anyDocParser.parse(fileInput, inspection);\n    }''',
    '''    let parsedDoc: any;\n    const parserPath = selectParserPath(inspection);\n    if (parserPath === "SPREADSHEET") {\n      parsedDoc = await spreadsheetParser.parse(fileInput, inspection);\n    } else if (parserPath === "OCR") {\n      parsedDoc = await ocrParser.parse(fileInput, inspection);\n    } else {\n      parsedDoc = await anyDocParser.parse(fileInput, inspection);\n    }''',
)
edit(
    "server/worker.ts",
    '''  const parserProvenanceById = new Map<string, any>((Array.isArray(parsedDoc.sourceValueProvenance) ? parsedDoc.sourceValueProvenance : []).map((p: any) => [p.provenanceId, p]));\n  const fullText =''',
    '''  const parserProvenanceById = new Map<string, any>((Array.isArray(parsedDoc.sourceValueProvenance) ? parsedDoc.sourceValueProvenance : []).map((p: any) => [p.provenanceId, p]));\n  const ocrLines: any[] = Array.isArray(parsedDoc.ocrLines) ? parsedDoc.ocrLines : [];\n  const fullText =''',
)
edit(
    "server/worker.ts",
    '''            else if (num < 1000000) num *= scale;\n\n            extractedFacts.push({\n              id: `fct-${pattern.metric}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,''',
    '''            else if (num < 1000000) num *= scale;\n\n            const normalizedLine = line.trim();\n            const ocrEvidence = ocrLines.find((entry: any) => String(entry?.text || '').trim() === normalizedLine);\n            const sourceCoordinates = ocrEvidence?.coordinate ? [ocrEvidence.coordinate] : [];\n            const sourceProvenanceIds = ocrEvidence?.provenanceId ? [ocrEvidence.provenanceId] : [];\n            const sourceProvenanceRecords = sourceProvenanceIds.map((id: string) => parserProvenanceById.get(id)).filter(Boolean);\n            const factId = `fct-${pattern.metric}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;\n            const factConfidence = ocrEvidence ? Math.min(0.95, Number(ocrEvidence.confidence) || 0) : 0.95;\n\n            extractedFacts.push({\n              id: factId,''',
)
edit(
    "server/worker.ts",
    '''              pageNumber: 1,\n              confidence: 0.95,\n              verificationStatus: "CANONICAL_SELECTED",\n              provenance: {\n                documentId: job.documentId,\n                documentTitle: job.documentTitle,\n                pageNumber: 1,\n                sourceText: line.trim()\n              }''',
    '''              pageNumber: ocrEvidence?.pageNumber || 1,\n              confidence: factConfidence,\n              verificationStatus: "CANONICAL_SELECTED",\n              sourceProvenanceId: ocrEvidence?.provenanceId,\n              sourceProvenanceIds,\n              sourceCoordinate: ocrEvidence?.coordinate,\n              sourceCoordinates,\n              provenanceCoordinates: sourceCoordinates,\n              sourceProvenanceRecords,\n              universalProvenance: sourceProvenanceIds.length ? {\n                provenanceId: `prov-fact-${factId}`,\n                workspaceId: job.workspaceId,\n                period: defaultPeriod,\n                currency: job.functionalCurrency,\n                lineageKind: "CANONICAL_FACT",\n                materiality: "MATERIAL",\n                coordinates: [],\n                parentProvenanceIds: sourceProvenanceIds,\n                rawLiteral: rawVal,\n                normalizedValue: num,\n                transformationSteps: [{\n                  stepId: `step-map-${factId}`,\n                  operation: "MAP",\n                  inputProvenanceIds: sourceProvenanceIds,\n                  inputLiteral: rawVal,\n                  outputValue: num,\n                  engine: "EveDeterministicFactExtractor",\n                  engineVersion: "1"\n                }],\n                verificationState: factConfidence >= 0.90 ? "VERIFIED" : "REVIEW_REQUIRED",\n                presentationUsages: []\n              } : undefined,\n              provenance: {\n                documentId: job.documentId,\n                documentTitle: job.documentTitle,\n                pageNumber: ocrEvidence?.pageNumber || 1,\n                sourceText: line.trim(),\n                sourceProvenanceId: ocrEvidence?.provenanceId,\n                sourceProvenanceIds,\n                sourceCoordinate: ocrEvidence?.coordinate,\n                provenanceCoordinates: sourceCoordinates,\n                sourceArtifactId: ocrEvidence?.coordinate?.sourceArtifactId,\n                sourceSha256: ocrEvidence?.coordinate?.sourceSha256,\n                ocrEngine: ocrEvidence?.coordinate?.extractionMethod,\n                ocrEngineVersion: ocrEvidence?.coordinate?.extractionVersion,\n                ocrConfidence: ocrEvidence?.confidence\n              }''',
)

edit(
    "src/lib/parser/router.ts",
    '["png", "jpg", "jpeg", "webp", "tiff"]',
    '["png", "jpg", "jpeg", "webp", "tiff", "tif", "bmp"]',
)

edit(
    "src/types/presentationModels.ts",
    '''  sourceLocationLabel?: string;\n  sourceFormula?: string;\n}''',
    '''  sourceLocationLabel?: string;\n  sourceFormula?: string;\n  sourceConfidence?: number;\n  sourceExtractionMethod?: string;\n  sourceExtractionVersion?: string;\n}''',
    1,
)
edit(
    "src/types/presentationModels.ts",
    '''  sourceLocationLabel?: string;\n  sourceFormula?: string;\n  factLineageId?: string;''',
    '''  sourceLocationLabel?: string;\n  sourceFormula?: string;\n  sourceConfidence?: number;\n  sourceExtractionMethod?: string;\n  sourceExtractionVersion?: string;\n  factLineageId?: string;''',
)

edit(
    "src/adapters/presentationAdapters.ts",
    '''  if (coordinate.sourceType === 'PDF') return `Page ${coordinate.pageNumber}`;\n  if (coordinate.sourceType === 'IMAGE') return coordinate.pageNumber ? `Image page ${coordinate.pageNumber}` : 'Image region';''',
    '''  if (coordinate.sourceType === 'PDF') return `Page ${coordinate.pageNumber}`;\n  if (coordinate.sourceType === 'IMAGE') {\n    const box = coordinate.boundingBox;\n    const page = coordinate.pageNumber ? `Page ${coordinate.pageNumber} · ` : '';\n    if (!box) return `${page}Image region`;\n    const pct = (n: any) => `${(Number(n || 0) * 100).toFixed(1)}%`;\n    return `${page}Image region x=${pct(box.x)} y=${pct(box.y)} w=${pct(box.width)} h=${pct(box.height)}`;\n  }''',
)
edit(
    "src/adapters/presentationAdapters.ts",
    '''    sourceLocationLabel: sourceCoordinateLabel(factSourceCoordinates(fact)[0], factSourcePage(fact)),\n    sourceFormula: factSourceCoordinates(fact)[0]?.formula,\n    factLineageId:''',
    '''    sourceLocationLabel: sourceCoordinateLabel(factSourceCoordinates(fact)[0], factSourcePage(fact)),\n    sourceFormula: factSourceCoordinates(fact)[0]?.formula,\n    sourceConfidence: factSourceCoordinates(fact)[0]?.confidence,\n    sourceExtractionMethod: factSourceCoordinates(fact)[0]?.extractionMethod,\n    sourceExtractionVersion: factSourceCoordinates(fact)[0]?.extractionVersion,\n    factLineageId:''',
)

edit(
    "src/components/views/practice/PracticeHomeView.tsx",
    '''      sourceCoordinate: line.sourceCoordinate, sourceCoordinates: line.sourceCoordinates, sourceLocationLabel: line.sourceLocationLabel,\n      sourceFormula: line.sourceFormula });''',
    '''      sourceCoordinate: line.sourceCoordinate, sourceCoordinates: line.sourceCoordinates, sourceLocationLabel: line.sourceLocationLabel,\n      sourceFormula: line.sourceFormula, sourceConfidence: line.sourceConfidence, sourceExtractionMethod: line.sourceExtractionMethod,\n      sourceExtractionVersion: line.sourceExtractionVersion });''',
)

edit(
    "src/components/design-system/EveProvenanceDrawer.tsx",
    '''                  {coordinate?.sourceType === 'SPREADSHEET' && (\n                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-indigo-50/60 border border-indigo-100 rounded-lg p-3">\n                      <span className="text-slate-500">Workbook</span><span>{coordinate.workbookName || metadata.sourceDocName || 'Not recorded'}</span>\n                      <span className="text-slate-500">Sheet / Cell</span><span>{coordinate.sheetName || 'Sheet'}!{coordinate.cellAddress || coordinate.rangeAddress || 'Not recorded'}</span>\n                      <span className="text-slate-500">Formula</span><span>{coordinate.formula || 'Literal value'}</span>\n                      <span className="text-slate-500">Cached / parsed value</span><span>{coordinate.cachedValue !== undefined && coordinate.cachedValue !== null ? String(coordinate.cachedValue) : 'Not recorded'}</span>\n                      <span className="text-slate-500">Number format</span><span>{coordinate.numberFormat || 'Not recorded'}</span>\n                      <span className="text-slate-500">Provenance ID</span><span className="break-all">{metadata.sourceProvenanceId || 'Not recorded'}</span>\n                    </div>\n                  )}''',
    '''                  {coordinate?.sourceType === 'SPREADSHEET' && (\n                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-indigo-50/60 border border-indigo-100 rounded-lg p-3">\n                      <span className="text-slate-500">Workbook</span><span>{coordinate.workbookName || metadata.sourceDocName || 'Not recorded'}</span>\n                      <span className="text-slate-500">Sheet / Cell</span><span>{coordinate.sheetName || 'Sheet'}!{coordinate.cellAddress || coordinate.rangeAddress || 'Not recorded'}</span>\n                      <span className="text-slate-500">Formula</span><span>{coordinate.formula || 'Literal value'}</span>\n                      <span className="text-slate-500">Cached / parsed value</span><span>{coordinate.cachedValue !== undefined && coordinate.cachedValue !== null ? String(coordinate.cachedValue) : 'Not recorded'}</span>\n                      <span className="text-slate-500">Number format</span><span>{coordinate.numberFormat || 'Not recorded'}</span>\n                      <span className="text-slate-500">Provenance ID</span><span className="break-all">{metadata.sourceProvenanceId || 'Not recorded'}</span>\n                    </div>\n                  )}\n                  {coordinate?.sourceType === 'IMAGE' && (\n                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-teal-50/60 border border-teal-100 rounded-lg p-3">\n                      <span className="text-slate-500">Image / Page</span><span>{coordinate.imageWidth}×{coordinate.imageHeight}{coordinate.pageNumber ? ` · page ${coordinate.pageNumber}` : ''}</span>\n                      <span className="text-slate-500">OCR region</span><span>{coordinate.ocrRegionId || 'Not recorded'}</span>\n                      <span className="text-slate-500">Bounding box</span><span>x={Number(coordinate.boundingBox?.x || 0).toFixed(4)} y={Number(coordinate.boundingBox?.y || 0).toFixed(4)} w={Number(coordinate.boundingBox?.width || 0).toFixed(4)} h={Number(coordinate.boundingBox?.height || 0).toFixed(4)} {coordinate.boundingBox?.unit || ''}</span>\n                      <span className="text-slate-500">OCR text</span><span>{coordinate.rawLiteral || metadata.sourceText || 'Not recorded'}</span>\n                      <span className="text-slate-500">Confidence</span><span>{typeof coordinate.confidence === 'number' ? `${(coordinate.confidence * 100).toFixed(2)}%` : 'Not recorded'}</span>\n                      <span className="text-slate-500">OCR engine</span><span>{coordinate.extractionMethod || metadata.sourceExtractionMethod || 'Not recorded'}</span>\n                      <span className="text-slate-500">Engine version</span><span>{coordinate.extractionVersion || metadata.sourceExtractionVersion || 'Not recorded'}</span>\n                      <span className="text-slate-500">Provenance ID</span><span className="break-all">{metadata.sourceProvenanceId || 'Not recorded'}</span>\n                    </div>\n                  )}''',
)

p = Path(".env.example")
text = p.read_text()
if "EVE_OCR_PADDLE_URL=" not in text:
    text += '''\n# Local self-hosted OCR services\nEVE_OCR_PADDLE_URL=http://eve-ocr-paddle.zeabur.internal:8765\nEVE_OCR_DOCTR_URL=http://eve-ocr-doctr.zeabur.internal:8765\nEVE_OCR_TIMEOUT_MS=120000\nEVE_OCR_AVG_CONFIDENCE_FLOOR=0.90\nEVE_OCR_MATERIAL_CONFIDENCE_FLOOR=0.85\nEVE_OCR_FALLBACK_IMPROVEMENT_MARGIN=0.02\n'''
    p.write_text(text)

print("P1_005_PATCH_APPLIED=YES")
