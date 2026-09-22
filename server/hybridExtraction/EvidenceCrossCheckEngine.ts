import { StatementFactCandidate, EvidenceCrossCheckResult } from './types.js';
import { amountAppearsInSourceBlock } from '../failClosedGuards.js';

export class EvidenceCrossCheckEngine {
  /**
   * Cross-check an AI-extracted candidate against deterministic source text.
   * PDF/page-scoped evidence must match the physical page. HTML/iXBRL evidence
   * may be document-scoped because printed filing page references are not
   * physical browser/HTML page boundaries. Missing evidence always fails closed.
   */
  public static verifyCandidateAgainstSource(
    candidate: StatementFactCandidate,
    pageManifests: any[] | undefined | null,
    sourceBlocks: any[] | undefined | null
  ): EvidenceCrossCheckResult {
    const manifests = Array.isArray(pageManifests) ? pageManifests : [];
    const blocks = Array.isArray(sourceBlocks) ? sourceBlocks : [];
    const pageNum = candidate?.physicalPage;
    const exactPageBlocks = blocks.filter(sb => (sb?.page_number === pageNum || sb?.pageNumber === pageNum));
    const documentBlocks = blocks.filter(sb => String(sb?.evidence_scope || '').toUpperCase() === 'DOCUMENT');
    const usingDocumentScope = exactPageBlocks.length === 0 && documentBlocks.length > 0;
    const candidateBlocks = exactPageBlocks.length > 0 ? exactPageBlocks : documentBlocks;

    const normalizeText = (value: any): string => String(value || '')
      // Native HTML/iXBRL blocks can retain entities while parser candidates
      // contain their decoded glyphs. Compare the same visible accounting text
      // without weakening the independent value check below.
      .replace(/&#(\d+);/g, (_match, decimal) => String.fromCodePoint(Number(decimal)))
      .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
      .replace(/&apos;|&#39;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/&amp;/gi, '&')
      .replace(/&nbsp;/gi, ' ')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    const targetQuote = normalizeText(candidate?.sourceQuote);
    const targetLabel = normalizeText(candidate?.rowLabel || candidate?.metricLabel);
    const targetLabelVariants = [
      targetLabel,
      targetLabel.replace(/,?\s+(?:beginning|ending) balances?$/, ''),
    ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);
    const rawValue = candidate?.rawValue || '';
    const blockText = (block: any): string => String(block?.raw_text || block?.text_content || block?.text || '');

    const pageManifest = manifests.find(pm => (pm?.physical_page_number === pageNum || pm?.page_number === pageNum));
    const hasNativeText = candidateBlocks.some(sb => blockText(sb).trim().length > 0) || Boolean(pageManifest?.native_text_available);

    if (!hasNativeText || candidateBlocks.length === 0) {
      return {
        candidate,
        evidenceStatus: 'UNCONFIRMED',
        matchedPageNumber: exactPageBlocks.length > 0 ? pageNum : undefined,
        confidenceScore: 0,
        notes: usingDocumentScope
          ? 'REVIEW_REQUIRED: Document-scoped evidence is empty.'
          : `REVIEW_REQUIRED: Page ${pageNum ?? 'UNKNOWN'} has no deterministic native-text evidence.`
      };
    }

    let quoteAndValueMatch = false;
    let labelAndValueMatch = false;
    let quoteOnlyMatch = false;
    let labelOnlyMatch = false;
    let valueOnlyMatch = false;
    let matchedBlockText = '';
    let matchedSourceBlock: any | undefined;

    for (const block of candidateBlocks) {
      const raw = blockText(block);
      const normalized = normalizeText(raw);
      const quoteMatch = Boolean(targetQuote && normalized.includes(targetQuote));
      const labelMatch = targetLabelVariants.some(label => normalized.includes(label));
      const valueMatch = amountAppearsInSourceBlock(rawValue, raw);

      if (quoteMatch) quoteOnlyMatch = true;
      if (labelMatch) labelOnlyMatch = true;
      if (valueMatch) valueOnlyMatch = true;

      if (quoteMatch && valueMatch) {
        quoteAndValueMatch = true;
        matchedBlockText = raw;
        matchedSourceBlock = block;
        break;
      }
      if (labelMatch && valueMatch && !labelAndValueMatch) {
        labelAndValueMatch = true;
        matchedBlockText = raw;
        matchedSourceBlock = block;
      } else if (!matchedBlockText && (quoteMatch || labelMatch || valueMatch)) {
        matchedBlockText = raw;
        matchedSourceBlock = block;
      }
    }

    const scopeNote = usingDocumentScope
      ? `Confirmed against document-scoped native HTML evidence; printed page reference ${pageNum ?? 'UNKNOWN'} was not asserted as a physical page.`
      : `Confirmed against physical Page ${pageNum}.`;

    if (quoteAndValueMatch || labelAndValueMatch) {
      return {
        candidate,
        evidenceStatus: 'CONFIRMED',
        matchedSourceText: matchedBlockText,
        matchedPageNumber: usingDocumentScope ? undefined : pageNum,
        matchedSourceBlock,
        confidenceScore: candidate?.confidence ?? 0,
        notes: scopeNote
      };
    }

    if (quoteOnlyMatch || labelOnlyMatch || valueOnlyMatch) {
      return {
        candidate,
        evidenceStatus: 'PARTIAL',
        matchedSourceText: matchedBlockText || undefined,
        matchedPageNumber: usingDocumentScope ? undefined : pageNum,
        matchedSourceBlock,
        confidenceScore: candidate?.confidence ?? 0,
        notes: usingDocumentScope
          ? 'Partial document-scoped native-text evidence matched. REVIEW_REQUIRED.'
          : `Partial evidence matched on physical Page ${pageNum ?? 'UNKNOWN'}. REVIEW_REQUIRED.`
      };
    }

    return {
      candidate,
      evidenceStatus: 'UNCONFIRMED',
      matchedPageNumber: usingDocumentScope ? undefined : pageNum,
      confidenceScore: 0,
      notes: usingDocumentScope
        ? 'Fact was not corroborated within any deterministic document-scoped HTML source block.'
        : `Fact unconfirmed against native text on physical Page ${pageNum ?? 'UNKNOWN'}.`
    };
  }
}
