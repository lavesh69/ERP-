export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "SECURITY_AUDIT";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class StructuredLogger {
  private isProduction = process.env.NODE_ENV === "production";

  private format(level: LogLevel, message: string, meta?: Record<string, any>, err?: Error): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };

    if (err) {
      entry.error = {
        name: err.name,
        message: err.message,
        stack: this.isProduction ? undefined : err.stack,
      };
    }

    return JSON.stringify(entry);
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (!this.isProduction) {
      console.debug(this.format("DEBUG", message, meta));
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    console.log(this.format("INFO", message, meta));
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(this.format("WARN", message, meta));
  }

  error(message: string, err?: any, meta?: Record<string, any>): void {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    console.error(this.format("ERROR", message, meta, errorObj));
  }

  security(action: string, actor: string, details?: Record<string, any>): void {
    const log = this.format("SECURITY_AUDIT", `[Security] ${action} by ${actor}`, details);
    console.log(log);
  }
}

export const logger = new StructuredLogger();
