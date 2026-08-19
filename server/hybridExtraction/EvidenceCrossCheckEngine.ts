import { StatementFactCandidate, EvidenceCrossCheckResult } from './types.js';

export class EvidenceCrossCheckEngine {
  /**
   * Cross-check an AI-extracted FactCandidate against deterministic page manifests and native text source blocks.
   */
  public static verifyCandidateAgainstSource(
    candidate: StatementFactCandidate,
    pageManifests: any[],
    sourceBlocks: any[]
  ): EvidenceCrossCheckResult {
    const pageNum = candidate.physicalPage;
    const pageManifest = pageManifests.find(pm => (pm.physical_page_number === pageNum || pm.page_number === pageNum));
    const pageBlocks = sourceBlocks.filter(sb => sb.page_number === pageNum);

    const targetVal = (candidate.rawValue || "").replace(/[^0-9.]/g, "").trim();
    const targetQuote = (candidate.sourceQuote || "").toLowerCase().trim();
    const targetLabel = (candidate.rowLabel || candidate.metricLabel || "").toLowerCase().trim();

    // 1. Check if page has native text or is visual/image-only
    const hasNativeText = pageManifest ? pageManifest.native_text_available : (pageBlocks.length > 0);

    if (!hasNativeText) {
      // Scanned or image-only page verified visually by Gemini
      return {
        candidate,
        evidenceStatus: 'VISUALLY_CONFIRMED',
        matchedPageNumber: pageNum,
        confidenceScore: Math.min(candidate.confidence || 0.95, 0.95),
        notes: `Fact extracted visually from scanned Page ${pageNum}. Native text layer unavailable.`
      };
    }

    // 2. Search native text blocks on designated physical page
    let exactQuoteMatch = false;
    let labelMatch = false;
    let valueMatch = false;
    let matchedBlockText = "";

    pageBlocks.forEach(block => {
      const blockText = (block.raw_text || "").toLowerCase();
      const blockCleanDigits = blockText.replace(/[^0-9.]/g, "");

      if (targetQuote && blockText.includes(targetQuote)) {
        exactQuoteMatch = true;
        matchedBlockText = block.raw_text;
      }

      if (targetLabel && blockText.includes(targetLabel)) {
        labelMatch = true;
        if (!matchedBlockText) matchedBlockText = block.raw_text;
      }

      if (targetVal && targetVal.length >= 2 && blockCleanDigits.includes(targetVal)) {
        valueMatch = true;
        if (!matchedBlockText) matchedBlockText = block.raw_text;
      }
    });

    // 3. Determine Evidence Status
    if (exactQuoteMatch || (labelMatch && valueMatch)) {
      return {
        candidate,
        evidenceStatus: 'CONFIRMED',
        matchedSourceText: matchedBlockText,
        matchedPageNumber: pageNum,
        confidenceScore: 0.99,
        notes: `Exact evidence corroborated on physical Page ${pageNum}.`
      };
    } else if (labelMatch || valueMatch) {
      return {
        candidate,
        evidenceStatus: 'PARTIAL',
        matchedSourceText: matchedBlockText,
        matchedPageNumber: pageNum,
        confidenceScore: 0.85,
        notes: `Partial evidence matched on physical Page ${pageNum} (${labelMatch ? 'Label' : 'Value'} found).`
      };
    }

    return {
      candidate,
      evidenceStatus: 'UNCONFIRMED',
      matchedPageNumber: pageNum,
      confidenceScore: 0.70,
      notes: `Fact unconfirmed against native text layer on physical Page ${pageNum}. Marked for review.`
    };
  }
}
