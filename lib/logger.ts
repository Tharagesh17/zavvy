/**
 * Structured logging utility
 * 
 * Provides consistent logging across the application with:
 * - Request ID tracking for correlation
 * - Structured JSON output for production
 * - Different log levels
 * - Automatic error serialization
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  userId?: string;
  sellerId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;
  private requestId: string | null = null;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  /**
   * Set request ID for correlation
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Generate a unique request ID
   */
  generateRequestId(): string {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const timestamp = new Date().toISOString();
    const logData: Record<string, unknown> = {
      timestamp,
      level: level.toUpperCase(),
      message,
      requestId: this.requestId,
      ...context,
    };

    if (error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    // In development, use console for readability
    // In production, output JSON for log aggregation
    if (this.isDevelopment) {
      const contextStr = context ? ` ${JSON.stringify(context)}` : "";
      const errorStr = error ? ` [Error: ${error.message}]` : "";
      console.log(`[${logData.level}] ${message}${contextStr}${errorStr}`);
    } else {
      console.log(JSON.stringify(logData));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log("debug", message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log("warn", message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log("error", message, context, error);
  }

  /**
   * Log API request start
   */
  logRequestStart(method: string, path: string, context?: LogContext): void {
    this.info(`→ ${method} ${path}`, {
      ...context,
      method,
      path,
      event: "request_start",
    });
  }

  /**
   * Log API request completion
   */
  logRequestEnd(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 400 ? "warn" : "info";
    this.log(level, `← ${method} ${path} ${statusCode} (${durationMs}ms)`, {
      ...context,
      method,
      path,
      statusCode,
      durationMs,
      event: "request_end",
    });
  }

  /**
   * Log security events
   */
  logSecurity(event: string, context: LogContext & { reason: string }): void {
    this.warn(`Security: ${event}`, {
      ...context,
      event: "security",
      securityEvent: event,
    });
  }

  /**
   * Log authentication events
   */
  logAuth(event: "login" | "logout" | "verify" | "failed", context: LogContext): void {
    this.info(`Auth: ${event}`, {
      ...context,
      event: "auth",
      authEvent: event,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create a child logger with preset context
 */
export function createChildLogger(context: LogContext): Logger {
  const childLogger = new Logger();
  const originalLog = childLogger["log"].bind(childLogger);
  
  childLogger["log"] = (level: LogLevel, message: string, ctx?: LogContext, error?: Error) => {
    originalLog(level, message, { ...context, ...ctx }, error);
  };
  
  return childLogger;
}

/**
 * AsyncLocalStorage for request context (Node.js only)
 * This allows tracking request context across async boundaries
 */
export const requestContext = {
  async run<T>(context: LogContext, fn: () => Promise<T>): Promise<T> {
    // Simple implementation - in production, use AsyncLocalStorage
    logger.setRequestId(context.requestId || logger.generateRequestId());
    return fn();
  },
};
