import { StatementFactCandidate, EvidenceCrossCheckResult } from './types.js';
import { amountAppearsInSourceBlock } from '../failClosedGuards.js';

export class EvidenceCrossCheckEngine {
  /**
   * Cross-check an AI-extracted FactCandidate against deterministic page manifests and native text source blocks.
   * Fail closed: missing evidence never confirms a fact and must never crash the pipeline.
   */
  public static verifyCandidateAgainstSource(
    candidate: StatementFactCandidate,
    pageManifests: any[] | undefined | null,
    sourceBlocks: any[] | undefined | null
  ): EvidenceCrossCheckResult {
    const manifests = Array.isArray(pageManifests) ? pageManifests : [];
    const blocks = Array.isArray(sourceBlocks) ? sourceBlocks : [];
    const pageNum = candidate?.physicalPage;
    const pageManifest = manifests.find(pm => (pm?.physical_page_number === pageNum || pm?.page_number === pageNum));
    const pageBlocks = blocks.filter(sb => (sb?.page_number === pageNum || sb?.pageNumber === pageNum));

    const targetQuote = (candidate?.sourceQuote || "").toLowerCase().trim();
    const targetLabel = (candidate?.rowLabel || candidate?.metricLabel || "").toLowerCase().trim();
    const rawValue = candidate?.rawValue || "";

    const blockText = (block: any): string => String(block?.raw_text || block?.text_content || block?.text || "");
    const hasNativeText = pageManifest
      ? Boolean(pageManifest.native_text_available)
      : pageBlocks.some(sb => blockText(sb).trim().length > 0);

    if (!hasNativeText) {
      return {
        candidate,
        evidenceStatus: 'UNCONFIRMED',
        matchedPageNumber: pageNum,
        confidenceScore: 0,
        notes: `REVIEW_REQUIRED: Page ${pageNum ?? 'UNKNOWN'} has no native text evidence. Missing evidence cannot auto-confirm a fact.`
      };
    }

    let exactQuoteMatch = false;
    let labelMatch = false;
    let valueMatch = false;
    let matchedBlockText = "";

    pageBlocks.forEach(block => {
      const blockTextRaw = blockText(block);
      const blockTextLower = blockTextRaw.toLowerCase();

      if (targetQuote && blockTextLower.includes(targetQuote)) {
        exactQuoteMatch = true;
        matchedBlockText = blockTextRaw;
      }

      if (targetLabel && blockTextLower.includes(targetLabel)) {
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
        notes: `REVIEW_REQUIRED: Amount "${rawValue}" is not present in any deterministic source block on Page ${pageNum ?? 'UNKNOWN'}.`
      };
    }

    if (exactQuoteMatch || (labelMatch && valueMatch)) {
      return {
        candidate,
        evidenceStatus: 'CONFIRMED',
        matchedSourceText: matchedBlockText,
        matchedPageNumber: pageNum,
        confidenceScore: candidate?.confidence ?? 0,
        notes: `Exact evidence corroborated on physical Page ${pageNum}.`
      };
    }

    if (labelMatch || valueMatch) {
      return {
        candidate,
        evidenceStatus: 'PARTIAL',
        matchedSourceText: matchedBlockText,
        matchedPageNumber: pageNum,
        confidenceScore: candidate?.confidence ?? 0,
        notes: `Partial evidence matched on physical Page ${pageNum} (${labelMatch ? 'Label' : 'Value'} found). REVIEW_REQUIRED.`
      };
    }

    return {
      candidate,
      evidenceStatus: 'UNCONFIRMED',
      matchedPageNumber: pageNum,
      confidenceScore: 0,
      notes: `Fact unconfirmed against native text layer on physical Page ${pageNum ?? 'UNKNOWN'}. Marked for review.`
    };
  }
}
