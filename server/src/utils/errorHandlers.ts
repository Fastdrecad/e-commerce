import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import { AppError } from "./appError";
import { ErrorCode } from "../types";

/**
 * Standard error response structure for consistent API error handling
 */
export interface ErrorResponse {
  status: string;
  code: ErrorCode | string;
  message: string;
  errors?: Record<string, string> | Array<{ field?: string; message: string }>;
  stack?: string;
  timestamp?: string;
  requestId?: string;
  statusDescription?: string;
  metadata?: Record<string, any>;
}

/**
 * Handles MongoDB and Mongoose errors by converting them to user-friendly responses
 * @param error The error object (MongoDB or Mongoose error)
 * @param res Express response object to send error response
 * @returns Boolean indicating if error was handled
 */
export const handleMongoErrors = (error: unknown, res: Response): boolean => {
  const errorResponse: ErrorResponse = {
    status: "error",
    code: ErrorCode.DATABASE_ERROR,
    message: "Database error",
    timestamp: new Date().toISOString()
  };

  // MongoDB duplicate key error (E11000)
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "MongoServerError" &&
    "code" in error &&
    error.code === 11000
  ) {
    const mongoError = error as {
      keyPattern?: Record<string, any>;
      keyValue?: Record<string, any>;
    };
    const field = Object.keys(mongoError.keyPattern || {})[0] || "field";
    const value = mongoError.keyValue ? mongoError.keyValue[field] : "";
    const message = `Duplicate ${field}: "${value}" already exists.`;

    res.status(409).json({
      ...errorResponse,
      code: ErrorCode.DUPLICATE_KEY,
      message,
      errors: { [field]: message },
      statusDescription: "Conflict"
    });
    return true;
  }

  // Mongoose validation error
  if (error instanceof MongooseError.ValidationError) {
    const validationErrors: Record<string, string> = {};

    // Extract validation error messages for each field
    Object.keys(error.errors).forEach((key) => {
      validationErrors[key] = error.errors[key].message;
    });

    res.status(400).json({
      ...errorResponse,
      code: ErrorCode.VALIDATION_ERROR,
      message: "Validation failed",
      errors: validationErrors,
      statusDescription: "Bad Request"
    });
    return true;
  }

  // Mongoose CastError (invalid ID format, etc.)
  if (error instanceof MongooseError.CastError) {
    const message = `Invalid ${error.path}: ${error.value}.`;

    res.status(400).json({
      ...errorResponse,
      code: ErrorCode.INVALID_ID,
      message,
      errors: { [error.path]: message },
      statusDescription: "Bad Request"
    });
    return true;
  }

  // MongoDB transaction errors
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "MongoServerError" &&
    "errorLabels" in error &&
    Array.isArray(error.errorLabels) &&
    error.errorLabels.includes("TransientTransactionError")
  ) {
    res.status(500).json({
      ...errorResponse,
      code: ErrorCode.TRANSACTION_ERROR,
      message: "Database transaction failed. Please try again.",
      statusDescription: "Internal Server Error"
    });
    return true;
  }

  // Connection errors
  if (
    error &&
    typeof error === "object" &&
    (("name" in error && error.name === "MongoNetworkError") ||
      ("name" in error &&
        error.name === "MongoServerError" &&
        "code" in error &&
        typeof error.code === "number" &&
        [7, 26, 91].includes(error.code)))
  ) {
    res.status(503).json({
      ...errorResponse,
      code: ErrorCode.DATABASE_UNAVAILABLE,
      message: "Database service unavailable. Please try again later.",
      statusDescription: "Service Unavailable"
    });
    return true;
  }

  // Not a MongoDB specific error
  return false;
};
