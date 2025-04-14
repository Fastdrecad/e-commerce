import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { ZodError } from "zod";
import { handleMongoErrors, ErrorResponse } from "../utils/errorHandlers";
import { ErrorCode } from "../types";
import { AuthRequest } from "../types";
import { v4 as uuidv4 } from "uuid";
import { HTTP_STATUS_DESCRIPTIONS } from "../utils/responseHandlers";

/**
 * Centralized error handling middleware for Express
 * Processes different error types and returns consistent error responses
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Generate a unique request ID for tracking
  const requestId = req.headers["x-request-id"] || uuidv4();

  // Get basic request info
  const requestInfo = {
    url: req.originalUrl || req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    requestId
  };

  // Add user info if available (for authenticated requests)
  const authReq = req as AuthRequest;
  if (authReq.user) {
    Object.assign(requestInfo, {
      userId: authReq.user._id,
      userEmail: authReq.user.email
    });
  }

  // Log the error with request details
  console.error("Error:", err, { requestInfo });

  // Try to handle MongoDB errors first
  const isMongoError = handleMongoErrors(err, res);
  if (isMongoError) {
    return;
  }

  let statusCode = 500;
  const statusDescription =
    HTTP_STATUS_DESCRIPTIONS[statusCode] || "Internal Server Error";

  const errorResponse: ErrorResponse = {
    status: "error",
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: "Internal server error",
    statusDescription,
    timestamp: new Date().toISOString(),
    requestId: requestId as string
  };

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    const response: ErrorResponse = {
      status: "fail",
      code: ErrorCode.VALIDATION_ERROR,
      message: "Validation failed",
      statusDescription: HTTP_STATUS_DESCRIPTIONS[statusCode],
      errors: err.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message
      })),
      timestamp: new Date().toISOString(),
      requestId: requestId as string
    };

    res.status(statusCode).json(response);
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    const response: ErrorResponse = {
      status: err.status,
      code: err.code,
      message: err.message,
      statusDescription: HTTP_STATUS_DESCRIPTIONS[statusCode] || undefined,
      metadata: err.metadata, // Include any additional metadata
      timestamp: err.timestamp,
      requestId: requestId as string
    };

    res.status(statusCode).json(response);
    return;
  }

  // Handle JWT errors
  if (err instanceof Error) {
    if (err.name === "JsonWebTokenError") {
      statusCode = 401;
      const response: ErrorResponse = {
        status: "fail",
        code: ErrorCode.INVALID_TOKEN,
        message: "Invalid token",
        statusDescription: HTTP_STATUS_DESCRIPTIONS[statusCode],
        timestamp: new Date().toISOString(),
        requestId: requestId as string
      };

      res.status(statusCode).json(response);
      return;
    }

    // Handle JWT expired error
    if (err.name === "TokenExpiredError") {
      statusCode = 401;
      const response: ErrorResponse = {
        status: "fail",
        code: ErrorCode.TOKEN_EXPIRED,
        message: "Token expired",
        statusDescription: HTTP_STATUS_DESCRIPTIONS[statusCode],
        timestamp: new Date().toISOString(),
        requestId: requestId as string
      };

      res.status(statusCode).json(response);
      return;
    }

    // In development, include stack trace and actual error message
    if (process.env.NODE_ENV === "development") {
      errorResponse.message = err.message;
      errorResponse.stack = err.stack;
    }
  }

  // Update status description for the final error
  errorResponse.statusDescription =
    HTTP_STATUS_DESCRIPTIONS[statusCode] || "Internal Server Error";

  // Default error response for unhandled errors
  res.status(statusCode).json(errorResponse);
};
