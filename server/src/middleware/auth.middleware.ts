import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, UserDocument } from "../models/user.model";
import { keys } from "../config/keys";

// Export the interface so it can be used across the app
export interface AuthRequest extends Request {
  user?: UserDocument;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "No token, authorization denied" });
    return;
  }

  try {
    const decoded = jwt.verify(token, keys.jwt.secret!) as { id: string };
    User.findById(decoded.id)
      .select("-password")
      .then((user) => {
        if (!user) {
          res.status(401).json({ message: "User not found" });
          return;
        }
        (req as AuthRequest).user = user as UserDocument;
        next();
      })
      .catch(() => {
        res.status(401).json({ message: "Token is not valid" });
      });
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

/**
 * Extracts refresh token from either cookies or authorization header
 * This ensures backward compatibility with clients still using the old token-in-header approach
 */
export const extractRefreshToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // First check if token is in cookie
  if (req.cookies && req.cookies.refreshToken) {
    req.body.refreshToken = req.cookies.refreshToken;
  }
  // If not, check if token is in request body (for backward compatibility)
  else if (!req.body.refreshToken) {
    // Check authorization header as a fallback
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      req.body.refreshToken = authHeader.split(" ")[1];
    }
  }

  next();
};
