import fs from "fs";
import path from "path";

export interface AddressInfo {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface PrivacySettings {
  showPhoneInDirectory?: boolean;
  showEmailInDirectory?: boolean;
  allowPushNotifications?: boolean;
}

export interface UserDemographics {
  bio?: string;
  bloodGroup?: string;
  dob?: string;
  gender?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: AddressInfo;
  socialLinks?: SocialLinks;
  privacySettings?: PrivacySettings;
}

const EXTENSIONS_FILE = path.join(process.cwd(), "data", "profile_extensions.json");

// In-memory cache fallback for serverless robustness
let memoryCache: Record<string, UserDemographics> = {};

function ensureFileExists(): void {
  try {
    const dir = path.dirname(EXTENSIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(EXTENSIONS_FILE)) {
      fs.writeFileSync(EXTENSIONS_FILE, JSON.stringify({}, null, 2), "utf8");
    }
  } catch (error) {
    console.error("Failed to ensure profile_extensions.json exists:", error);
  }
}

export function getUserDemographics(userId: string): UserDemographics {
  try {
    ensureFileExists();
    if (fs.existsSync(EXTENSIONS_FILE)) {
      const raw = fs.readFileSync(EXTENSIONS_FILE, "utf8");
      const data = JSON.parse(raw);
      if (data[userId]) {
        memoryCache[userId] = data[userId];
        return data[userId];
      }
    }
    return memoryCache[userId] || {};
  } catch (error) {
    console.error("Error reading demographics for user:", userId, error);
    return memoryCache[userId] || {};
  }
}

export function saveUserDemographics(
  userId: string,
  demographics: Partial<UserDemographics>
): UserDemographics {
  try {
    ensureFileExists();
    let data: Record<string, UserDemographics> = {};
    if (fs.existsSync(EXTENSIONS_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(EXTENSIONS_FILE, "utf8"));
      } catch {
        data = {};
      }
    }

    const current = data[userId] || memoryCache[userId] || {};
    const updated: UserDemographics = {
      ...current,
      ...demographics,
      address: {
        ...(current.address || {}),
        ...(demographics.address || {}),
      },
      socialLinks: {
        ...(current.socialLinks || {}),
        ...(demographics.socialLinks || {}),
      },
      privacySettings: {
        ...(current.privacySettings || {
          showPhoneInDirectory: true,
          showEmailInDirectory: true,
          allowPushNotifications: true,
        }),
        ...(demographics.privacySettings || {}),
      },
    };

    data[userId] = updated;
    memoryCache[userId] = updated;

    // Atomic write via temporary file
    const tmpFile = `${EXTENSIONS_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tmpFile, EXTENSIONS_FILE);

    return updated;
  } catch (error) {
    console.error("Error saving demographics for user:", userId, error);
    const current = memoryCache[userId] || {};
    const updated: UserDemographics = {
      ...current,
      ...demographics,
    };
    memoryCache[userId] = updated;
    return updated;
  }
}
