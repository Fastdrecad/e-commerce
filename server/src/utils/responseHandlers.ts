import { Response } from "express";

/**
 * Standard success response structure for consistent API responses
 */
export interface SuccessResponse<T = any> {
  status: string;
  statusCode: number;
  statusDescription: string;
  message?: string;
  data: T;
  timestamp: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

/**
 * HTTP status codes with their descriptions
 */
export const HTTP_STATUS_DESCRIPTIONS: Record<number, string> = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  500: "Internal Server Error",
  503: "Service Unavailable"
};

/**
 * Sends a standardized success response
 *
 * @param res - Express response object
 * @param statusCode - HTTP status code (default: 200)
 * @param data - Response payload data
 * @param message - Optional success message
 * @param metadata - Optional metadata for additional context
 * @param requestId - Optional request identifier for tracking
 * @returns Express response with formatted success response
 */
export const sendResponse = <T = any>(
  res: Response,
  statusCode: number = 200,
  data: T,
  message?: string,
  metadata?: Record<string, any>,
  requestId?: string
): Response => {
  const statusDescription =
    HTTP_STATUS_DESCRIPTIONS[statusCode] ||
    (statusCode >= 200 && statusCode < 300 ? "Success" : "Unknown");

  const response: SuccessResponse<T> = {
    status: "success",
    statusCode,
    statusDescription,
    data,
    timestamp: new Date().toISOString(),
    requestId
  };

  if (message) {
    response.message = message;
  }

  if (metadata) {
    response.metadata = metadata;
  }

  return res.status(statusCode).json(response);
};

/**
 * Specialized function to send a created resource response
 */
export const sendCreatedResponse = <T = any>(
  res: Response,
  data: T,
  message: string = "Resource created successfully",
  metadata?: Record<string, any>,
  requestId?: string
): Response => {
  return sendResponse(res, 201, data, message, metadata, requestId);
};

/**
 * Specialized function to send a no content response
 */
export const sendNoContentResponse = (
  res: Response,
  message: string = "Operation completed successfully"
): Response => {
  return res.status(204).set("X-Message", message).send();
};

/**
 * Specialized function to send a deleted resource response
 */
export const sendDeletedResponse = (
  res: Response,
  message: string = "Resource deleted successfully",
  metadata?: Record<string, any>,
  requestId?: string
): Response => {
  return sendResponse(
    res,
    200,
    { deleted: true },
    message,
    metadata,
    requestId
  );
};

/**
 * Specialized function to send an updated resource response
 */
export const sendUpdatedResponse = <T = any>(
  res: Response,
  data: T,
  message: string = "Resource updated successfully",
  metadata?: Record<string, any>,
  requestId?: string
): Response => {
  return sendResponse(res, 200, data, message, metadata, requestId);
};
