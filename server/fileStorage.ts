import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface StoredFileResult {
  filePath: string;
  sha256: string;
  receivedSha256?: string;
  persistedSha256?: string;
  size: number;
  persistedSize?: number;
  isDuplicate: boolean;
  filename: string;
  durableProofVerified?: boolean;
}

/**
 * Durably saves uploaded physical bytes with atomic write semantics:
 * 1. Compute received SHA-256 and byte length from received buffer
 * 2. If content-addressed file exists:
 *    - Re-read persisted bytes from disk
 *    - Compute persisted SHA-256 and verify exact match with received SHA-256 and byte length
 *    - If mismatch, fail closed
 * 3. If file does not exist:
 *    - Write to unique temporary file
 *    - fsync to ensure disk flush
 *    - Atomically rename to final content-addressed path
 *    - Re-read persisted bytes from disk
 *    - Compute persisted SHA-256 and verify exact match with received SHA-256 and byte length
 * 4. Return StoredFileResult with verification evidence
 */
export function saveUploadedFile(buffer: Buffer, originalFilename: string): StoredFileResult {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("[FileStorage] Invalid buffer provided for physical file persistence.");
  }

  const receivedSha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const receivedSize = buffer.length;
  const ext = path.extname(originalFilename) || ".bin";
  const storedFilename = `${receivedSha256}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storedFilename);

  let isDuplicate = false;

  if (fs.existsSync(filePath)) {
    // Content-addressed artifact already exists: verify persisted bytes
    const persistedBytes = fs.readFileSync(filePath);
    const persistedSha256 = crypto.createHash("sha256").update(persistedBytes).digest("hex");
    const persistedSize = persistedBytes.length;

    if (persistedSha256 !== receivedSha256) {
      throw new Error(
        `[FileStorage] Existing content-addressed artifact hash corruption: received ${receivedSha256} vs persisted ${persistedSha256}`
      );
    }
    if (persistedSize !== receivedSize) {
      throw new Error(
        `[FileStorage] Existing content-addressed artifact size mismatch: received ${receivedSize} vs persisted ${persistedSize}`
      );
    }

    isDuplicate = true;
    return {
      filePath,
      sha256: receivedSha256,
      receivedSha256,
      persistedSha256,
      size: receivedSize,
      persistedSize,
      isDuplicate,
      filename: originalFilename,
      durableProofVerified: true
    };
  }

  // Atomic write semantics: temporary file -> fsync/close -> atomic rename
  const tempFilename = `${storedFilename}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
  const tempPath = path.join(UPLOAD_DIR, tempFilename);

  try {
    const fd = fs.openSync(tempPath, "w");
    fs.writeSync(fd, buffer, 0, buffer.length);
    fs.fsyncSync(fd);
    fs.closeSync(fd);

    // Atomic rename to final path
    fs.renameSync(tempPath, filePath);
  } catch (writeErr: any) {
    // Clean up temporary file if left behind
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {}
    throw new Error(`[FileStorage] Atomic source write failed: ${writeErr?.message || writeErr}`);
  }

  // Re-read the actual persisted bytes from disk
  let persistedBytes: Buffer;
  try {
    persistedBytes = fs.readFileSync(filePath);
  } catch (readErr: any) {
    throw new Error(`[FileStorage] Failed to re-read persisted source bytes: ${readErr?.message || readErr}`);
  }

  const persistedSha256 = crypto.createHash("sha256").update(persistedBytes).digest("hex");
  const persistedSize = persistedBytes.length;

  // Verify received SHA == persisted SHA
  if (persistedSha256 !== receivedSha256) {
    // Corrupted write! Fail closed
    try {
      fs.unlinkSync(filePath);
    } catch {}
    throw new Error(
      `[FileStorage] Cryptographic integrity verification failed: received SHA-256 ${receivedSha256} != persisted SHA-256 ${persistedSha256}`
    );
  }

  // Verify byte length
  if (persistedSize !== receivedSize) {
    try {
      fs.unlinkSync(filePath);
    } catch {}
    throw new Error(
      `[FileStorage] Byte length verification failed: received ${receivedSize} bytes != persisted ${persistedSize} bytes`
    );
  }

  return {
    filePath,
    sha256: receivedSha256,
    receivedSha256,
    persistedSha256,
    size: receivedSize,
    persistedSize,
    isDuplicate,
    filename: originalFilename,
    durableProofVerified: true
  };
}

export function readStoredFile(filePath: string): Buffer {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath);
  }
  throw new Error(`Stored file not found at path: ${filePath}`);
}
