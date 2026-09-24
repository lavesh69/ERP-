/**
 * Production Environment Sanity and Security Validator
 * Validates presence, minimum entropy, and non-default status of mission-critical secrets.
 */

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const isProduction = process.env.NODE_ENV === "production";
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Database Connection String
  if (!process.env.DATABASE_URL) {
    if (isProduction) {
      errors.push("DATABASE_URL is missing.");
    } else {
      warnings.push("DATABASE_URL not set; falling back to local SQLite dev.db.");
    }
  }

  // 2. JWT Secret
  const jwtSecret = process.env.JWT_SECRET;
  const INSECURE_DEFAULT_JWT = "apex-classroom-erp-secret-key-32-bytes!!";
  if (!jwtSecret) {
    if (isProduction) {
      errors.push("JWT_SECRET is required in production environment.");
    } else {
      warnings.push("JWT_SECRET not set; falling back to insecure development key.");
    }
  } else if (jwtSecret === INSECURE_DEFAULT_JWT) {
    if (isProduction) {
      errors.push("JWT_SECRET is using insecure default placeholder in production.");
    } else {
      warnings.push("JWT_SECRET is using development default key.");
    }
  } else if (jwtSecret.length < 32) {
    if (isProduction) {
      errors.push("JWT_SECRET must be at least 32 characters long in production.");
    } else {
      warnings.push("JWT_SECRET is shorter than 32 characters.");
    }
  }

  // 3. Password Reset Secret
  const resetSecret = process.env.RESET_SECRET;
  const INSECURE_DEFAULT_RESET = "classroom-password-reset-key-2026";
  if (!resetSecret) {
    if (isProduction) {
      errors.push("RESET_SECRET is required in production environment.");
    } else {
      warnings.push("RESET_SECRET not set; falling back to insecure development key.");
    }
  } else if (resetSecret === INSECURE_DEFAULT_RESET) {
    if (isProduction) {
      errors.push("RESET_SECRET is using insecure default placeholder in production.");
    } else {
      warnings.push("RESET_SECRET is using development default key.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
