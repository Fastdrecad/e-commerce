import { ErrorCode } from "../types";

/**
 * Custom application error class with additional properties for comprehensive error handling
 *
 * Features:
 * - Proper status code assignment
 * - Error classification (operational vs programming)
 * - Consistent error codes for client-side handling
 * - Stack trace capture
 * - Support for metadata/contextual information
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly status: string;
  readonly isOperational: boolean;
  readonly code: ErrorCode;
  readonly timestamp: string;
  readonly metadata?: Record<string, any>;

  /**
   * Create a new application error
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code (defaults to 500)
   * @param code - Error code from ErrorCode enum (defaults based on status code)
   * @param metadata - Additional contextual information for debugging
   */
  constructor(
    message: string,
    statusCode = 500,
    code?: ErrorCode,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.metadata = metadata;

    // Determine appropriate error code if not provided
    if (!code) {
      if (statusCode === 400) code = ErrorCode.VALIDATION_ERROR;
      else if (statusCode === 401) code = ErrorCode.UNAUTHORIZED;
      else if (statusCode === 403) code = ErrorCode.FORBIDDEN;
      else if (statusCode === 404) code = ErrorCode.RESOURCE_NOT_FOUND;
      else if (statusCode === 409) code = ErrorCode.DUPLICATE_KEY;
      else code = ErrorCode.INTERNAL_SERVER_ERROR;
    }

    this.code = code;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}
