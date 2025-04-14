import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  findUserById,
  findUserWithAdminNotes,
  findAllUsers,
  sendResponse,
  verifyAuthentication,
  isValidRole,
  getValidRoles,
  getDashboardStats,
  softDeleteUserById,
  restoreUserById,
  hardDeleteUserById,
  createAuditLog,
  checkEmailInUse
} from "../utils/userAdmin.utils";
import { AuditActionType } from "../models/auditLog.model";

class AdminController {
  // Fetch all users
  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      verifyAuthentication(req.user);

      // Check if inactive users should be included
      const includeInactive = req.query.includeInactive === "true";
      const users = await findAllUsers(includeInactive);

      return sendResponse(res, 200, {
        users,
        count: users.length
      });
    } catch (error) {
      next(error);
    }
  };

  // Fetch a specific user by ID
  getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      verifyAuthentication(req.user);
      const { userId } = req.params;

      // Check if inactive users should be included
      const includeInactive = req.query.includeInactive === "true";
      const user = await findUserById(userId, false, includeInactive);

      if (!user) {
        return sendResponse(res, 404, {
          message: "User not found"
        });
      }

      return sendResponse(res, 200, user);
    } catch (error) {
      next(error);
    }
  };

  // Change a user's role
  changeUserRole = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      verifyAuthentication(req.user);
      const { userId } = req.params;
      const { role } = req.body;

      // Validate the role
      if (!isValidRole(role)) {
        return sendResponse(res, 400, {
          message: `Invalid role. Allowed roles are: ${getValidRoles().join(", ")}`
        });
      }

      // Find the user
      const user = await findUserById(userId);
      if (!user) {
        return sendResponse(res, 404, {
          message: "User not found"
        });
      }

      // Prevent admin from changing their own role
      if (req.user && userId === String(req.user._id)) {
        return sendResponse(res, 400, {
          message: "You cannot change your own role"
        });
      }

      // Store the old role for audit log
      const oldRole = user.role;

      // Change the role and save
      user.role = role;
      await user.save();

      // Create audit log
      await createAuditLog(
        AuditActionType.USER_ROLE_CHANGE,
        String(req.user!._id),
        userId,
        `User role changed from ${oldRole} to ${role}`,
        { userId, email: user.email, oldRole, newRole: role },
        req
      );

      return sendResponse(res, 200, {
        message: "User role updated successfully",
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Soft delete a user
  softDeleteUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      verifyAuthentication(req.user);
      const { userId } = req.params;
      const { reason } = req.body;

      // Prevent admin from deleting their own account
      if (req.user && userId === String(req.user._id)) {
        return sendResponse(res, 400, {
          message: "You cannot delete your own account"
        });
      }

      const user = await softDeleteUserById(
        userId,
        String(req.user!._id),
        reason,
        req
      );
      if (!user) {
        return sendResponse(res, 404, {
          message: "User not found"
        });
      }

      return sendResponse(res, 200, {
        message: "User deactivated successfully"
      });
    } catch (error) {
      next(error);
    }
  };

  // Restore a soft-deleted user
  restoreUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      verifyAuthentication(req.user);
      const { userId } = req.params;

      const user = await restoreUserById(userId, String(req.user!._id), req);
      if (!user) {
        return sendResponse(res, 404, {
          message: "User not found"
        });
      }

      return sendResponse(res, 200, {
        message: "User restored successfully"
      });
    } catch (error) {
      next(error);
    }
  };

  // Hard delete a user (permanent)
  hardDeleteUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      verifyAuthentication(req.user);
      const { userId } = req.params;
      const { shouldAnonymize } = req.body;

      // Prevent admin from deleting their own account
      if (req.user && userId === String(req.user._id)) {
        return sendResponse(res, 400, {
          message: "You cannot delete your own account"
        });
      }

      // This requires additional confirmation
      const { confirmation } = req.body;
      if (confirmation !== "PERMANENT_DELETE") {
        return sendResponse(res, 400, {
          message:
            "This action is permanent. Please provide the confirmation code: PERMANENT_DELETE"
        });
      }

      const user = await hardDeleteUserById(
        userId,
        String(req.user!._id),
        shouldAnonymize !== false,
        req
      );

      if (!user) {
        return sendResponse(res, 404, {
          message: "User not found"
        });
      }

      return sendResponse(res, 200, {
        message: "User permanently deleted"
      });
    } catch (error) {
      next(error);
    }
  };

  // Admin dashboard statistics
  getDashboardStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      verifyAuthentication(req.user);

      // Determine if inactive users should be included in stats
      const includeInactive = req.query.includeInactive !== "false";
      const stats = await getDashboardStats(includeInactive);

      return sendResponse(res, 200, { stats });
    } catch (error) {
      next(error);
    }
  };

  // Admin edit user details with extended capabilities
  adminEditUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      verifyAuthentication(req.user);
      const { userId } = req.params;
      const {
        firstName,
        lastName,
        email,
        role,
        isEmailVerified,
        isActive,
        notes,
        adminNotes
      } = req.body;

      // Find the user including inactive ones and admin notes
      const user = await findUserWithAdminNotes(userId, false, true);

      if (!user) {
        return sendResponse(res, 404, {
          message: "User not found"
        });
      }

      // Prevent admin from changing their own role
      if (role && req.user && userId === String(req.user._id)) {
        return sendResponse(res, 400, {
          message: "You cannot change your own role"
        });
      }

      // Capture old values for audit log
      const oldValues = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        adminNotes: user.adminNotes
      };

      const changes = [];

      // Check if email is being changed and is not already in use
      if (email && email !== user.email) {
        const existingUser = await checkEmailInUse(email, userId);
        if (existingUser) {
          return sendResponse(res, 400, {
            message: "Email already in use"
          });
        }
        user.email = email;
        changes.push(`email changed to ${email}`);
      }

      // Update basic fields if provided
      if (firstName !== undefined) {
        user.firstName = firstName;
        changes.push(`first name changed to ${firstName}`);
      }

      if (lastName !== undefined) {
        user.lastName = lastName;
        changes.push(`last name changed to ${lastName}`);
      }

      // Admin-specific extended capabilities
      if (role !== undefined) {
        // Check role validity
        if (!isValidRole(role)) {
          return sendResponse(res, 400, {
            message:
              "Invalid role. Allowed roles are: " + getValidRoles().join(", ")
          });
        }
        user.role = role;
        changes.push(`role changed to ${role}`);
      }

      if (isEmailVerified !== undefined) {
        user.isEmailVerified = isEmailVerified;
        changes.push(`email verification status changed to ${isEmailVerified}`);
      }

      // Handle admin notes
      if (adminNotes !== undefined) {
        const timestamp = new Date().toISOString();
        const adminName = req.user?.firstName
          ? `${req.user.firstName} ${req.user.lastName}`
          : `Admin ${String(req.user!._id)}`;

        // Add new note with timestamp and admin name
        const existingNotes = user.adminNotes || "";
        const newAdminNote = `[${timestamp}] ${adminName}: ${adminNotes}`;

        if (existingNotes) {
          user.adminNotes = `${existingNotes}\n${newAdminNote}`;
        } else {
          user.adminNotes = newAdminNote;
        }

        changes.push("admin notes updated");
      }

      // Handle activation/deactivation
      if (isActive !== undefined && isActive !== user.isActive) {
        if (isActive) {
          // Restore user if they were deactivated
          if (!user.isActive) {
            await user.restore();
            changes.push("user account activated");
          }
        } else {
          // Deactivate user
          if (user.isActive) {
            await user.softDelete(String(req.user!._id), notes);
            changes.push("user account deactivated");
          }
        }
      }

      // Only save if we're not already handling activation/deactivation
      // which already includes saving
      if (!(isActive !== undefined && isActive !== user.isActive)) {
        await user.save();
      }

      // Create audit log
      await createAuditLog(
        AuditActionType.USER_UPDATE,
        String(req.user!._id),
        userId,
        `Admin updated user: ${changes.join(", ")}`,
        {
          oldValues,
          newValues: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
            adminNotesUpdated: adminNotes !== undefined
          },
          notes
        },
        req
      );

      return sendResponse(res, 200, {
        message: "User updated successfully by admin",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          hasAdminNotes: !!user.adminNotes
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Get user admin notes
  getUserAdminNotes = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      verifyAuthentication(req.user);
      const { userId } = req.params;

      // Get user with admin notes
      const user = await findUserWithAdminNotes(userId, false, true);

      if (!user) {
        return sendResponse(res, 404, {
          message: "User not found"
        });
      }

      // Create audit log for viewing admin notes
      await createAuditLog(
        AuditActionType.ADMIN_ACTION,
        String(req.user!._id),
        userId,
        `Admin viewed admin notes for user ${user.email}`,
        {},
        req
      );

      return sendResponse(res, 200, {
        userId: user._id,
        email: user.email,
        adminNotes: user.adminNotes || "",
        hasNotes: !!user.adminNotes
      });
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();
