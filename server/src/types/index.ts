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
