import { Response, NextFunction } from "express";
import { ROLES } from "../constants";
import { AuthRequest } from "./auth.middleware";

/**
 * Middleware for checking user's role
 * @param roles - Array of roles allowed to access the route
 * @returns Middleware function
 */
export const roleCheck = (roles: ROLES[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check if the user is authenticated
      if (!req.user) {
        return res.status(401).json({
          message: "Unauthorized - Authentication required"
        });
      }

      // If no roles are specified, allow access to any authenticated user
      if (roles.length === 0) {
        return next();
      }

      // Check if the user has one of the required roles
      const hasRole = roles.includes(req.user.role as ROLES);
      if (!hasRole) {
        return res.status(403).json({
          message: "Forbidden - Insufficient permissions"
        });
      }

      // User has the required role, proceed to the next middleware or route
      next();
    } catch (error) {
      next(error);
    }
  };
};
