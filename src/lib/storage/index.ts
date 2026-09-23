import { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local-provider";
import { S3StorageProvider } from "./s3-provider";

let defaultStorageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!defaultStorageProvider) {
    const driver = process.env.STORAGE_DRIVER || "local";
    if (driver === "s3") {
      defaultStorageProvider = new S3StorageProvider();
    } else {
      defaultStorageProvider = new LocalStorageProvider();
    }
  }
  return defaultStorageProvider;
}

export * from "./types";
export * from "./local-provider";
export * from "./s3-provider";
