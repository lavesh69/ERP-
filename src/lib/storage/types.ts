export interface StorageUploadResult {
  fileKey: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  isPrivate: boolean;
}

export interface StorageProvider {
  name: string;
  upload(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    isPrivate?: boolean
  ): Promise<StorageUploadResult>;

  getDownloadUrl(fileKey: string, expiresInSeconds?: number): Promise<string>;

  delete(fileKey: string): Promise<boolean>;
}
