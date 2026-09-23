import fs from "fs";
import path from "path";
import crypto from "crypto";
import { StorageProvider, StorageUploadResult } from "./types";

export class LocalStorageProvider implements StorageProvider {
  name = "LocalStorageProvider";
  private basePublicDir: string;
  private basePrivateDir: string;

  constructor() {
    this.basePublicDir = path.join(process.cwd(), "public", "uploads", "documents");
    this.basePrivateDir = path.join(process.cwd(), "storage", "private");

    if (!fs.existsSync(this.basePublicDir)) {
      fs.mkdirSync(this.basePublicDir, { recursive: true });
    }
    if (!fs.existsSync(this.basePrivateDir)) {
      fs.mkdirSync(this.basePrivateDir, { recursive: true });
    }
  }

  /**
   * Sanitizes input filename to prevent directory traversal and special character attacks
   */
  private sanitizeFilename(filename: string): string {
    const base = path.basename(filename);
    return base.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  async upload(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    isPrivate = false
  ): Promise<StorageUploadResult> {
    const cleanName = this.sanitizeFilename(filename);
    const uniquePrefix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const fileKey = `${uniquePrefix}-${cleanName}`;

    const targetDirectory = isPrivate ? this.basePrivateDir : this.basePublicDir;
    const targetPath = path.join(targetDirectory, fileKey);

    // Verify target path stays inside intended root (path traversal guard)
    const resolvedPath = path.resolve(targetPath);
    if (!resolvedPath.startsWith(path.resolve(targetDirectory))) {
      throw new Error("Security Violation: Illegal path traversal detected");
    }

    fs.writeFileSync(resolvedPath, buffer);

    const fileUrl = isPrivate
      ? `/api/documents/download?key=${encodeURIComponent(fileKey)}`
      : `/uploads/documents/${fileKey}`;

    return {
      fileKey,
      fileUrl,
      fileSizeBytes: buffer.length,
      mimeType,
      isPrivate,
    };
  }

  async getDownloadUrl(fileKey: string, expiresInSeconds = 900): Promise<string> {
    const cleanKey = this.sanitizeFilename(fileKey);
    // Return signed URL with expiration timestamp and HMAC token
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const secret = process.env.SESSION_SECRET || "classroom-storage-secret";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${cleanKey}:${expiresAt}`)
      .digest("hex");

    return `/api/documents/download?key=${encodeURIComponent(cleanKey)}&expires=${expiresAt}&sig=${signature}`;
  }

  async delete(fileKey: string): Promise<boolean> {
    const cleanKey = this.sanitizeFilename(fileKey);
    const publicPath = path.join(this.basePublicDir, cleanKey);
    const privatePath = path.join(this.basePrivateDir, cleanKey);

    let deleted = false;
    if (fs.existsSync(publicPath)) {
      fs.unlinkSync(publicPath);
      deleted = true;
    }
    if (fs.existsSync(privatePath)) {
      fs.unlinkSync(privatePath);
      deleted = true;
    }
    return deleted;
  }
}
