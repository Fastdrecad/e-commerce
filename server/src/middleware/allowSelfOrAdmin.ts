import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { ROLES } from "../constants";
import { Types } from "mongoose";

/**
 * Middleware that allows either the user themselves or an admin to access a resource
 * @returns Middleware function
 */
export const allowSelfOrAdmin = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Unauthorized - Authentication required"
        });
      }

      const userId = req.params.userId;

      // Convert user ID to string for comparison
      const userIdString =
        req.user._id instanceof Types.ObjectId
          ? req.user._id.toString()
          : String(req.user._id);

      const isSelf = userIdString === userId;
      const isAdmin = req.user.role === ROLES.SUPER_ADMIN;

      if (!isSelf && !isAdmin) {
        return res.status(403).json({
          message:
            "Forbidden - You can only access your own resources or need admin privileges"
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
