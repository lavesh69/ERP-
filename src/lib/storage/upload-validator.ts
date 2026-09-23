/**
 * AI App Security Checklist (PDF Item 13: Protect File Uploads)
 * - Validates file types (strict extension blacklist for executables)
 * - Enforces allowed MIME types
 * - Enforces maximum file size limit (15 MB default)
 */

export const FORBIDDEN_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".ps1",
  ".vbs",
  ".js",
  ".mjs",
  ".py",
  ".bin",
  ".msi",
  ".dll",
  ".scr",
  ".jar",
  ".com",
  ".pif",
  ".app",
  ".php",
  ".asp",
  ".aspx",
  ".cgi",
  ".pl",
]);

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 Megabytes

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUploadFile(
  filename: string,
  mimeType: string,
  sizeBytes: number
): UploadValidationResult {
  if (!filename || typeof filename !== "string") {
    return { valid: false, error: "Missing or invalid filename" };
  }

  // 1. Check file size
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds maximum permitted threshold of 15MB (Current: ${(sizeBytes / (1024 * 1024)).toFixed(2)}MB)`,
    };
  }

  // 2. Check forbidden extension
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) {
    return { valid: false, error: "Files without extensions are not permitted" };
  }

  const ext = filename.substring(dotIndex).toLowerCase();
  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Security Violation: Executable and script extensions (${ext}) are strictly forbidden by institutional security policy.`,
    };
  }

  // 3. Check allowed MIME type if provided
  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
    // If it is octet-stream, check that the extension is known safe
    const safeExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg", ".txt", ".csv", ".docx", ".xlsx"]);
    if (!safeExtensions.has(ext)) {
      return {
        valid: false,
        error: `Security Violation: Unsupported or untrusted file format (${mimeType})`,
      };
    }
  }

  return { valid: true };
}
