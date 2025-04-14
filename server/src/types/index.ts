import { Request, Response, NextFunction } from "express";
import { UserDocument } from "../models/user.model";

// Re-export the UserDocument type from the model
export type { UserDocument };

export type TokenType = "email_verification" | "password_reset" | "refresh";

export interface AuthRequest extends Request {
  user?: UserDocument;
}

export type AuthRequestHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

/**
 * Application error codes organized by category
 *
 * Using const enum for improved type safety and better DX:
 * - Zero runtime cost (compiles to string literals)
 * - Provides autocomplete in IDEs
 * - Prevents invalid error codes
 */
export const enum ErrorCode {
  // Validation and input errors (400 range)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_ID = "INVALID_ID",
  INVALID_PARAMETERS = "INVALID_PARAMETERS",

  // Authentication errors (401 range)
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",

  // Authorization errors (403 range)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Resource errors (404 range)
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  PRODUCT_NOT_FOUND = "PRODUCT_NOT_FOUND",
  ORDER_NOT_FOUND = "ORDER_NOT_FOUND",

  // Conflict errors (409 range)
  DUPLICATE_KEY = "DUPLICATE_KEY",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
  CONCURRENT_MODIFICATION = "CONCURRENT_MODIFICATION",

  // Server errors (500 range)
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  DATABASE_UNAVAILABLE = "DATABASE_UNAVAILABLE",
  TRANSACTION_ERROR = "TRANSACTION_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
}
