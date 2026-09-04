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
  size: number;
  isDuplicate: boolean;
  filename: string;
}

export function saveUploadedFile(buffer: Buffer, originalFilename: string): StoredFileResult {
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const ext = path.extname(originalFilename) || ".bin";
  const storedFilename = `${sha256}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storedFilename);

  let isDuplicate = false;
  if (fs.existsSync(filePath)) {
    isDuplicate = true;
  } else {
    fs.writeFileSync(filePath, buffer);
  }

  return {
    filePath,
    sha256,
    size: buffer.length,
    isDuplicate,
    filename: originalFilename
  };
}

export function readStoredFile(filePath: string): Buffer {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath);
  }
  throw new Error(`Stored file not found at path: ${filePath}`);
}
