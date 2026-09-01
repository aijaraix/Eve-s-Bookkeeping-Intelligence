import { StatementFactCandidate, EvidenceCrossCheckResult } from './types.js';
import { amountAppearsInSourceBlock } from '../failClosedGuards.js';

export class EvidenceCrossCheckEngine {
  /**
   * Cross-check an AI-extracted FactCandidate against deterministic page manifests and native text source blocks.
   * Fail closed: scanned pages and amounts missing from the source block are UNCONFIRMED / REVIEW_REQUIRED.
   */
  public static verifyCandidateAgainstSource(
    candidate: StatementFactCandidate,
    pageManifests: any[],
    sourceBlocks: any[]
  ): EvidenceCrossCheckResult {
    const pageNum = candidate.physicalPage;
    const pageManifest = pageManifests.find(pm => (pm.physical_page_number === pageNum || pm.page_number === pageNum));
    const pageBlocks = sourceBlocks.filter(sb => sb.page_number === pageNum);

    const targetQuote = (candidate.sourceQuote || "").toLowerCase().trim();
    const targetLabel = (candidate.rowLabel || candidate.metricLabel || "").toLowerCase().trim();
    const rawValue = candidate.rawValue || "";

    const hasNativeText = pageManifest
      ? Boolean(pageManifest.native_text_available)
      : pageBlocks.some(sb => String(sb.raw_text || "").trim().length > 0);

    if (!hasNativeText) {
      return {
        candidate,
        evidenceStatus: 'UNCONFIRMED',
        matchedPageNumber: pageNum,
        confidenceScore: 0,
        notes: `REVIEW_REQUIRED: Page ${pageNum} has no native text layer. Scanned/image-only pages cannot be auto-confirmed.`
      };
    }

    let exactQuoteMatch = false;
    let labelMatch = false;
    let valueMatch = false;
    let matchedBlockText = "";

    pageBlocks.forEach(block => {
      const blockTextRaw = block.raw_text || "";
      const blockText = blockTextRaw.toLowerCase();

      if (targetQuote && blockText.includes(targetQuote)) {
        exactQuoteMatch = true;
        matchedBlockText = blockTextRaw;
      }

      if (targetLabel && blockText.includes(targetLabel)) {
        labelMatch = true;
        if (!matchedBlockText) matchedBlockText = blockTextRaw;
      }

      if (amountAppearsInSourceBlock(rawValue, blockTextRaw)) {
        valueMatch = true;
        if (!matchedBlockText) matchedBlockText = blockTextRaw;
      }
    });

    if (!valueMatch) {
      return {
        candidate,
        evidenceStatus: 'UNCONFIRMED',
        matchedSourceText: matchedBlockText || undefined,
        matchedPageNumber: pageNum,
        confidenceScore: 0,
        notes: `REVIEW_REQUIRED: Amount "${rawValue}" is not a substring of any source block on Page ${pageNum}.`
      };
    }

    if (exactQuoteMatch || (labelMatch && valueMatch)) {
      return {
        candidate,
        evidenceStatus: 'CONFIRMED',
        matchedSourceText: matchedBlockText,
        matchedPageNumber: pageNum,
        confidenceScore: candidate.confidence,
        notes: `Exact evidence corroborated on physical Page ${pageNum}.`
      };
    }

    if (labelMatch || valueMatch) {
      return {
        candidate,
        evidenceStatus: 'PARTIAL',
        matchedSourceText: matchedBlockText,
        matchedPageNumber: pageNum,
        confidenceScore: candidate.confidence,
        notes: `Partial evidence matched on physical Page ${pageNum} (${labelMatch ? 'Label' : 'Value'} found). REVIEW_REQUIRED.`
      };
    }

    return {
      candidate,
      evidenceStatus: 'UNCONFIRMED',
      matchedPageNumber: pageNum,
      confidenceScore: 0,
      notes: `Fact unconfirmed against native text layer on physical Page ${pageNum}. Marked for review.`
    };
  }
}
