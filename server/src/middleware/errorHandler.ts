import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { ZodError } from "zod";

interface ErrorResponse {
  status: string;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let response: ErrorResponse = {
    status: "error",
    message: "Internal server error"
  };

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    response = {
      status: "fail",
      message: "Validation failed",
      errors: err.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message
      }))
    };
  }
  // Handle custom AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    response = {
      status: "fail",
      message: err.message
    };
  }
  // Handle Mongoose validation errors
  else if (err.name === "ValidationError") {
    statusCode = 400;
    response = {
      status: "fail",
      message: "Validation failed",
      errors: Object.values((err as any).errors).map((error: any) => ({
        field: error.path,
        message: error.message
      }))
    };
  }
  // Handle JWT errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    response = {
      status: "fail",
      message: "Invalid token"
    };
  }
  // Handle JWT expired error
  else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    response = {
      status: "fail",
      message: "Token expired"
    };
  }
  // In development, include stack trace
  else if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
