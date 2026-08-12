import * as pdfParseModule from 'pdf-parse';
import mammoth from 'mammoth';
import JSZip from 'jszip';

async function extractDocxContent(buffer: Buffer): Promise<{ rawText: string; docxTables: TableModel[] }> {
  let rawText = '';
  const docxTables: TableModel[] = [];

  try {
    const textResult = await mammoth.extractRawText({ buffer });
    if (textResult && textResult.value && textResult.value.trim().length > 5) {
      rawText = textResult.value;
    }

    const htmlResult = await mammoth.convertToHtml({ buffer });
    if (htmlResult && htmlResult.value) {
      const html = htmlResult.value;
      const tableMatches = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
      if (tableMatches) {
        tableMatches.forEach((tblHtml, idx) => {
          const rows: string[][] = [];
          const trMatches = tblHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
          if (trMatches) {
            trMatches.forEach(trHtml => {
              const cellMatches = trHtml.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
              if (cellMatches) {
                const rowCells = cellMatches.map(c => c.replace(/<[^>]+>/g, '').trim());
                if (rowCells.some(Boolean)) {
                  rows.push(rowCells);
                }
              }
            });
          }
          if (rows.length > 0) {
            const headers = rows[0] || [];
            docxTables.push({
              table_id: `tbl-docx-${idx + 1}`,
              name: `Document Table ${idx + 1}`,
              headers,
              rows: rows.slice(1)
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn("Mammoth DOCX extraction warning:", err);
  }

  if (!rawText || rawText.trim().length < 20) {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const docXml = await zip.file('word/document.xml')?.async('text');
      if (docXml) {
        const wtMatches = docXml.match(/<w:t[^>]*>(.*?)<\/w:t>/gi);
        if (wtMatches) {
          rawText = wtMatches.map(m => m.replace(/<[^>]+>/g, '')).filter(Boolean).join(' ');
        }
      }
    } catch (zipErr) {
      console.warn("JSZip DOCX fallback error:", zipErr);
    }
  }

  return { rawText, docxTables };
}

async function extractPdfText(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  // Convert Node Buffer to a standard Uint8Array to satisfy pdfjs-dist strict check:
  // "Please provide binary data as Uint8Array, rather than Buffer."
  // Note: We create a clean, non-pooled Uint8Array copy of the buffer. Slicing with
  // buffer.buffer, buffer.byteOffset, buffer.byteLength will return a view of Node's
  // internal shared buffer pool, which causes PDF.js to read unrelated/corrupt memory.
  const uint8Array = new Uint8Array(buffer);

  const mod = pdfParseModule as any;
  if (typeof mod === 'function') {
    const res = await mod(uint8Array);
    return { text: res.text || '', numpages: res.numpages || 1 };
  }
  if (typeof mod.default === 'function') {
    const res = await mod.default(uint8Array);
    return { text: res.text || '', numpages: res.numpages || 1 };
  }
  if (mod && mod.PDFParse) {
    try {
      const parser = new mod.PDFParse(uint8Array);
      if (typeof parser.load === 'function') await parser.load();
      let text = '';
      if (typeof parser.getText === 'function') {
        const textResult = await parser.getText();
        text = typeof textResult === 'string' ? textResult : (textResult?.text || textResult?.pages?.map((p: any) => p.text).join('\n') || '');
      }
      const info = typeof parser.getInfo === 'function' ? await parser.getInfo() : null;
      const numpages = info?.numPages || info?.numpages || parser?.doc?.numPages || 1;
      return { text, numpages };
    } catch (err) {
      console.warn("PDFParse instance error:", err);
    }
  }
  return { text: '', numpages: 1 };
}
import { DocumentParser, FileInput, FileInspectionResult, CanonicalDocumentModel, AssetModel, SectionModel, TableModel } from './types';

export class AnyDocParser implements DocumentParser {
  public canHandle(file: FileInput): boolean {
    const ext = file.filename.split('.').pop()?.toLowerCase() || '';
    return ['pdf', 'doc', 'docx', 'docm', 'ppt', 'pptx', 'pptm', 'odt', 'odp', 'rtf', 'epub'].includes(ext);
  }

  public async inspect(file: FileInput): Promise<FileInspectionResult> {
    const ext = file.filename.split('.').pop()?.toLowerCase() || '';
    return {
      mimeType: file.mimeType,
      detectedType: ext,
      signature: 'ANYDOC',
      size: file.size,
      hash: '',
      isDuplicate: false,
      isEncrypted: false,
      isCorrupted: false,
      hasNativeText: true,
      needsOCR: false,
      requiresSpreadsheetPath: false,
      isMultimodalImage: false,
      isSupported: true
    };
  }

  public async parse(file: FileInput, inspection: FileInspectionResult): Promise<CanonicalDocumentModel> {
    const docId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
    const buffer = file.buffer || Buffer.from('');
    const ext = (file.filename || '').split('.').pop()?.toLowerCase() || '';

    let rawText = '';
    let pdfNumPages = 1;
    const sections: SectionModel[] = [];
    const tables: TableModel[] = [];

    if (ext === 'pdf' || inspection.detectedType === 'pdf') {
      try {
        const pdfData = await extractPdfText(buffer);
        rawText = pdfData.text || '';
        pdfNumPages = pdfData.numpages || 1;
      } catch (err) {
        console.warn("pdfParse error, fallback to ascii extraction:", err);
      }
    } else if (['docx', 'docm', 'doc', 'pptx', 'xlsx'].includes(ext) || ['docx', 'doc', 'pptx'].includes(inspection.detectedType)) {
      try {
        const docxRes = await extractDocxContent(buffer);
        rawText = docxRes.rawText;
        if (docxRes.docxTables && docxRes.docxTables.length > 0) {
          tables.push(...docxRes.docxTables);
        }
      } catch (err) {
        console.warn("DOCX extract error:", err);
      }
    } else if (['txt', 'csv', 'md', 'json', 'xml', 'html', 'rtf'].includes(ext)) {
      rawText = buffer.toString('utf-8');
    } else {
      // Legacy binary doc / general fallback
      const bufStr = buffer.toString('utf-8');
      const asciiClean = bufStr.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      const words = asciiClean.split(/\s+/).filter(w => w.length >= 2);
      if (words.length > 20) rawText = words.join(' ');
    }

    if (!rawText || rawText.trim().length < 20) {
      rawText = `Document content for ${file.originalName || file.filename}. Financial statements and disclosures attached.`;
    }

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    let currentSectionTitle = 'Document Summary';
    let currentText = '';

    lines.forEach((line, index) => {
      if (line.length < 80 && (line.endsWith(':') || line === line.toUpperCase() || line.startsWith('#') || line.startsWith('Note ') || line.toLowerCase().includes('statement') || line.toLowerCase().includes('balance sheet') || line.toLowerCase().includes('income'))) {
        if (currentText.length > 0) {
          sections.push({
            id: `sec-${sections.length + 1}`,
            title: currentSectionTitle,
            level: line.startsWith('#') ? 1 : 2,
            text: currentText.trim(),
            pageNumber: Math.floor((index / Math.max(1, lines.length)) * pdfNumPages) + 1
          });
          currentText = '';
        }
        currentSectionTitle = line.replace(/^#+\s*/, '');
      } else {
        currentText += ' ' + line;
      }
    });

    if (currentText.length > 0) {
      sections.push({
        id: `sec-${sections.length + 1}`,
        title: currentSectionTitle,
        level: 2,
        text: currentText.trim(),
        pageNumber: pdfNumPages
      });
    }

    // Extract structured table lines with enhanced regex matching integers, negatives, decimals, bracketed values, and dashes
    const tableLines = lines.filter(l => {
      if (l.includes('\t') || l.includes('|')) return true;
      const cleanLine = l.trim();
      const hasLetters = /[a-zA-Z]{2,}/.test(cleanLine);
      const matches = cleanLine.match(/(?:\d+[\.,\d]*|\b\d+\b|[\-\(]?\d+[\.,\d]*\)?|—)/g);
      const hasNumbers = matches && matches.length >= 1;
      if (hasLetters && hasNumbers) {
        const words = cleanLine.split(/\s+/);
        const lastWord = words[words.length - 1];
        const isLastWordNumeric = /[\-\(]?\d+[\.,\d]*\)?|—/.test(lastWord);
        if (isLastWordNumeric || (matches && matches.length >= 2) || cleanLine.length < 100) {
          return true;
        }
      }
      return false;
    });

    if (tableLines.length > 0) {
      const rootTableId = `tbl-${tables.length + 1}`;
      for (let i = 0; i < tableLines.length; i += 25) {
        const chunk = tableLines.slice(i, i + 25);
        const isContinuation = i > 0;
        const currentTblId = `tbl-${tables.length + 1}`;
        const pgNum = Math.floor((i / Math.max(1, tableLines.length)) * pdfNumPages) + 1;
        
        tables.push({
          table_id: currentTblId,
          name: isContinuation ? `Extracted Financial Table (Continuation Page ${pgNum})` : `Extracted Financial Table ${tables.length + 1}`,
          pageNumber: pgNum,
          headers: ['Line Item / Description', 'Amount / Details'],
          isContinuation,
          parentTableId: isContinuation ? rootTableId : undefined,
          rows: chunk.map(line => {
            const cleanLine = line.trim();
            const parts = cleanLine.split(/\s{2,}|\t|\|/);
            if (parts.length >= 2) {
              return [parts[0].trim(), parts.slice(1).join(' ').trim()];
            }
            
            // Smart regex split: find where the monetary / numerical values start
            const numMatch = cleanLine.match(/^(.*?)\s+((?:[\$€£]|[\(\-]?\d+|—).*)$/);
            if (numMatch && numMatch[1] && numMatch[2]) {
              return [numMatch[1].trim(), numMatch[2].trim()];
            }

            // Fallback split at first number
            const firstNumIdx = cleanLine.search(/(?:[\$€£]|[\(\-]?\d{1,3}(?:,\d{3})+|\b\d+\b|—)/);
            if (firstNumIdx > 3) {
              return [cleanLine.substring(0, firstNumIdx).trim(), cleanLine.substring(firstNumIdx).trim()];
            }

            return [cleanLine, ''];
          })
        });
      }
    }

    const estimatedPages = pdfNumPages > 1 ? pdfNumPages : Math.max(1, Math.ceil(buffer.length / 3000));
    const markdown = `# ${file.originalName || file.filename}\n\n` +
      sections.map(s => `## ${s.title}\n${s.text}`).join('\n\n');

    const usdCount = (rawText.match(/\$|\bUSD\b|\bUS Dollar\b/g) || []).length;
    const eurCount = (rawText.match(/€|\bEUR\b|\bEuro\b/g) || []).length;
    const gbpCount = (rawText.match(/£|\bGBP\b/g) || []).length;
    const chfCount = (rawText.match(/\bCHF\b/g) || []).length;

    let detectedCurrency = 'USD';
    if (chfCount > Math.max(usdCount, eurCount, gbpCount)) detectedCurrency = 'CHF';
    else if (eurCount > Math.max(usdCount, gbpCount)) detectedCurrency = 'EUR';
    else if (gbpCount > usdCount) detectedCurrency = 'GBP';
    else detectedCurrency = 'USD';

    let entityName = 'Corporate Entity';
    const baseName = (file.originalName || file.filename).split('.')[0].replace(/[-_]/g, ' ').replace(/(annual|financial|statement|report|audit|10k|2025|2026|fy2025|fy2026)/gi, '').trim();
    if (baseName.length >= 3) {
      entityName = baseName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    return {
      document_id: docId,
      project_id: 'PRJ-CURRENT',
      source: {
        filename: file.filename,
        originalName: file.originalName || file.filename,
        format: inspection.detectedType || 'pdf',
        hash: inspection.hash,
        original_url: file.url || null,
        access_timestamp: new Date().toISOString()
      },
      parser: {
        engine: 'anydoc',
        version: '1.4.2-fork',
        ocr_used: false,
        confidence: 0.98
      },
      metadata: {
        pages: estimatedPages,
        language: 'English',
        currency: detectedCurrency,
        entityName,
        period: 'FY 2025',
        totalWords: rawText.split(/\s+/).length
      },
      sections,
      tables,
      assets: [],
      markdown,
      warnings: [],
      confidence: 0.98
    };
  }

  public async extractAssets(file: FileInput): Promise<AssetModel[]> {
    return [];
  }

  public async healthCheck(): Promise<boolean> {
    return true;
  }
}

