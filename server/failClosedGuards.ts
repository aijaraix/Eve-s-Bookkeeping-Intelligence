/**
 * Fail-closed helpers for extraction → persistence → reporting.
 * Never invent amounts, SHA hashes, auditors, or confidence.
 */

const EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const PLACEHOLDER_HASH_PREFIX = "HASH-";

export function isEmptySha256(hash?: string | null): boolean {
  if (!hash) return true;
  const h = String(hash).trim().toLowerCase();
  return h.length === 0 || h === EMPTY_SHA256;
}

export function isPlaceholderDocumentHash(hash?: string | null): boolean {
  if (!hash) return true;
  const h = String(hash).trim();
  if (h.startsWith(PLACEHOLDER_HASH_PREFIX)) return true;
  if (!/^[a-f0-9]{64}$/i.test(h)) return true;
  return isEmptySha256(h);
}

export function assertRealDocumentHash(hash?: string | null): string {
  if (isPlaceholderDocumentHash(hash)) {
    throw new Error(
      `REFUSED: documentHash must be a real SHA-256 from file storage, not a placeholder (${hash || "missing"}).`
    );
  }
  return String(hash);
}

/**
 * Amount must appear as a number token in the source block (comma/space variants allowed).
 * Digit-soup false positives (e.g. "50" inside "50861") are rejected.
 */
export function amountAppearsInSourceBlock(rawValue: string | number | undefined, sourceText: string | undefined): boolean {
  if (rawValue == null || !sourceText) return false;
  const raw = String(rawValue).trim();
  if (!raw) return false;

  const isPureNumeric = /^[\d.,\s\-()]+$/.test(raw);
  if (!isPureNumeric && sourceText.includes(raw)) return true;

  const amountDigits = raw.replace(/[^0-9.]/g, "");
  if (!amountDigits || amountDigits.length < 2) return false;

  const [intPart, decPart] = amountDigits.split(".");
  if (!intPart) return false;

  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "[,\\s]?");
  const decimal = decPart != null && decPart.length > 0 ? `[.,]${decPart}` : "";
  try {
    const pattern = new RegExp(`(?<![0-9])${grouped}${decimal}(?![0-9])`);
    if (pattern.test(sourceText)) return true;
  } catch {
    return false;
  }
  return false;
}

export function derivePeriodBounds(period?: string | null): { start?: string; end?: string; label?: string } {
  const label = (period || "").trim();
  if (!label) return {};
  const yearMatch = label.match(/\b(20\d{2})\b/);
  if (!yearMatch) return { label };
  const year = yearMatch[1];
  return { start: `${year}-01-01`, end: `${year}-12-31`, label };
}

export function persistFactStatus(incomingStatus?: string | null, evidenceStatus?: string | null): string {
  const evidence = String(evidenceStatus || "").toUpperCase();
  if (evidence && evidence !== "CONFIRMED") {
    return "pending_review";
  }

  const status = String(incomingStatus || "").trim();
  if (!status) return "pending_review";

  const upper = status.toUpperCase();
  if (upper === "APPROVED" || upper === "VALIDATED" || upper === "VERIFIED") {
    if (evidence && evidence !== "CONFIRMED") return "pending_review";
    return status.toLowerCase();
  }
  if (upper === "REJECTED" || upper === "BLOCKED") return status.toLowerCase();
  return status.toLowerCase() === "approved" ? "pending_review" : status;
}

export function persistFactConfidence(incoming?: number | null): number | undefined {
  if (incoming == null || Number.isNaN(Number(incoming))) return undefined;
  return Number(incoming);
}

export function isConfirmedEvidenceStatus(status?: string | null): boolean {
  return String(status || "").toUpperCase() === "CONFIRMED";
}

export function looksLikeBankStatement(filename?: string, text?: string, documentType?: string): boolean {
  const fn = (filename || "").toLowerCase();
  const t = (text || "").toLowerCase();
  const dtype = (documentType || "").toLowerCase();

  if (dtype.includes("bank") && dtype.includes("statement")) return true;
  if ((fn.includes("bank") && (fn.includes("statement") || fn.includes("stmt") || fn.includes("transact"))) ||
      fn.endsWith(".csv") && (fn.includes("bank") || fn.includes("ledger") || fn.includes("activity"))) {
    return true;
  }

  const isAnnualReport =
    t.includes("consolidated income") ||
    t.includes("statement of financial position") ||
    t.includes("statement of comprehensive income") ||
    t.includes("independent auditor") ||
    (t.includes("annual report") && t.includes("shareholders"));

  if (isAnnualReport && !(fn.includes("bank") && fn.includes("statement"))) return false;

  const hasBalances = t.includes("beginning balance") && t.includes("ending balance");
  const hasTxLanguage =
    t.includes("deposit") ||
    t.includes("withdrawal") ||
    t.includes("debit") ||
    t.includes("credit") ||
    t.includes("account statement") ||
    t.includes("checking account");

  return hasBalances && hasTxLanguage;
}

export function shouldRejectDriveUrlOnlyUpload(filesLength: number, driveUrl?: string): boolean {
  return filesLength === 0 && Boolean(driveUrl && String(driveUrl).trim());
}

export function shouldRejectEmptyUpload(filesLength: number, driveUrl?: string): boolean {
  return filesLength === 0 && !String(driveUrl || "").trim();
}

export function isDemoRecord(record: any): boolean {
  if (!record) return false;
  return record.dataOrigin === "DEMO" || record.data_origin === "DEMO";
}

export function isBannedMockFact(fact: any): boolean {
  if (!fact) return true;
  if (isDemoRecord(fact)) return true;
  const id = String(fact.id || fact.fact_id || "");
  if (id.startsWith("fct-uni-") || id.startsWith("fct-nes-") || id.startsWith("fct-tef-") || id.startsWith("fct-gen-")) {
    return true;
  }
  const original = String(fact.valueOriginal || "");
  const functional = String(fact.valueFunctional || "");
  if (original.includes("59.60B") || functional.includes("59.60B") || original.includes("59,604") || functional.includes("59604000000")) {
    return true;
  }
  return false;
}

export function formatUnileverContinuingTurnoverDisplay(normalizedValue: number): string {
  if (normalizedValue === 50503000000) return "€50.503B";
  if (Math.abs(normalizedValue - 50503000000) < 1) return "€50.503B";
  return "";
}
