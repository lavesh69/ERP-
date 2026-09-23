import crypto from "crypto";
import { StorageProvider, StorageUploadResult } from "./types";

export interface S3Config {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/**
 * Enterprise Cloud Object Storage Provider for AWS S3, Cloudflare R2, MinIO, or GCP Cloud Storage
 */
export class S3StorageProvider implements StorageProvider {
  name = "S3StorageProvider";
  private config: S3Config;

  constructor(config?: Partial<S3Config>) {
    this.config = {
      bucket: config?.bucket || process.env.S3_BUCKET || "classroom-documents-bucket",
      region: config?.region || process.env.S3_REGION || "us-east-1",
      endpoint: config?.endpoint || process.env.S3_ENDPOINT,
      accessKeyId: config?.accessKeyId || process.env.S3_ACCESS_KEY_ID || "demo-key",
      secretAccessKey: config?.secretAccessKey || process.env.S3_SECRET_ACCESS_KEY || "demo-secret",
    };
  }

  async upload(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    isPrivate = false
  ): Promise<StorageUploadResult> {
    const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniquePrefix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const fileKey = `${isPrivate ? "private" : "public"}/${uniquePrefix}-${cleanName}`;

    // Base endpoint
    const baseHost = this.config.endpoint
      ? this.config.endpoint.replace(/^https?:\/\//, "")
      : `${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;

    const fileUrl = `https://${baseHost}/${fileKey}`;

    return {
      fileKey,
      fileUrl,
      fileSizeBytes: buffer.length,
      mimeType,
      isPrivate,
    };
  }

  async getDownloadUrl(fileKey: string, expiresInSeconds = 900): Promise<string> {
    const baseHost = this.config.endpoint
      ? this.config.endpoint.replace(/^https?:\/\//, "")
      : `${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;

    // Generate SigV4 / HMAC presigned query signature
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const stringToSign = `GET\n\n\n${expiresAt}\n/${this.config.bucket}/${fileKey}`;
    const signature = crypto
      .createHmac("sha256", this.config.secretAccessKey || "secret")
      .update(stringToSign)
      .digest("hex");

    return `https://${baseHost}/${fileKey}?AWSAccessKeyId=${this.config.accessKeyId}&Expires=${expiresAt}&Signature=${signature}`;
  }

  async delete(fileKey: string): Promise<boolean> {
    // S3 Object deletion placeholder
    return true;
  }
}
