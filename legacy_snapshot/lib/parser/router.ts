import { FileInspectionResult } from "./types.js";

export class FileRouter {
  public async inspectFile(fileInput: {
    filename?: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
    buffer?: Buffer;
    [key: string]: any;
  }): Promise<FileInspectionResult> {
    const rawName = fileInput.originalName || fileInput.filename || "";
    const ext = rawName.includes(".")
      ? rawName.split(".").pop()?.toLowerCase() || ""
      : "";
    const mime = fileInput.mimeType || "application/octet-stream";

    let detectedType = ext || "unknown";
    let requiresParser = "AnyDocParser";
    let needsOCR = false;
    let isMultimodalImage = false;

    if (["xlsx", "xls", "csv", "tsv"].includes(ext) || mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) {
      detectedType = ext || "xlsx";
      requiresParser = "SpreadsheetParser";
    } else if (["pdf"].includes(ext) || mime.includes("pdf")) {
      detectedType = "pdf";
      requiresParser = "AnyDocParser";
    } else if (["png", "jpg", "jpeg", "webp", "tiff"].includes(ext) || mime.startsWith("image/")) {
      detectedType = ext || "image";
      requiresParser = "OCRParser";
      needsOCR = true;
      isMultimodalImage = true;
    } else if (["html", "htm"].includes(ext) || mime.includes("html")) {
      detectedType = "html";
      requiresParser = "WebParser";
    } else if (["docx", "doc"].includes(ext) || mime.includes("word")) {
      detectedType = ext || "docx";
      requiresParser = "AnyDocParser";
    } else if (["txt", "md", "json", "log"].includes(ext) || mime.startsWith("text/")) {
      detectedType = ext || "txt";
      requiresParser = "AnyDocParser";
    }

    return {
      detectedType,
      mimeType: mime,
      needsOCR,
      isMultimodalImage,
      requiresParser,
      confidence: 0.98,
      size: fileInput.size || fileInput.buffer?.length || 0,
      originalName: rawName
    };
  }
}
