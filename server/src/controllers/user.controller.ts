import type { Request } from "express";
import { UserDocument } from "../models/user.model";
import { ROLES } from "../constants";
import {
  findUserById,
  checkEmailInUse,
  sendResponse,
  getValidRoles,
  verifyAuthentication,
  softDeleteUserById,
  createAuditLog
} from "../utils/userAdmin.utils";
import { AuditActionType } from "../models/auditLog.model";
import { asyncHandler } from "../utils/asyncHandler";

interface AuthRequest extends Request {
  user?: UserDocument;
}

class UserController {
  getProfile = asyncHandler<AuthRequest>(async (req, res) => {
    verifyAuthentication(req.user);
    const user = await findUserById(String(req.user!._id));
    sendResponse(res, 200, user);
  });

  updateProfile = asyncHandler<AuthRequest>(async (req, res) => {
    verifyAuthentication(req.user);
    const { firstName, lastName, email } = req.body;

    const user = await findUserById(String(req.user!._id));
    if (!user) {
      return sendResponse(res, 404, { message: "User not found" });
    }

    // Capture old values for audit log
    const oldValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    };

    if (email && email !== user.email) {
      const existingUser = await checkEmailInUse(email);
      if (existingUser) {
        return sendResponse(res, 400, { message: "Email already in use" });
      }
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    await user.save();

    // Create audit log for profile update
    await createAuditLog(
      AuditActionType.USER_UPDATE,
      String(req.user!._id),
      String(req.user!._id),
      "User updated their profile",
      {
        oldValues,
        newValues: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      },
      req
    );

    return sendResponse(res, 200, user);
  });

  changePassword = asyncHandler<AuthRequest>(async (req, res) => {
    verifyAuthentication(req.user);
    const { currentPassword, newPassword } = req.body;

    const user = await findUserById(String(req.user!._id), true);
    if (!user) {
      return sendResponse(res, 404, { message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      // Log failed password change attempt
      await createAuditLog(
        AuditActionType.PASSWORD_RESET,
        String(req.user!._id),
        String(req.user!._id),
        "Failed password change attempt - incorrect current password",
        {},
        req
      );

      return sendResponse(res, 401, {
        message: "Current password is incorrect"
      });
    }

    user.password = newPassword;
    await user.save();

    // Log successful password change
    await createAuditLog(
      AuditActionType.PASSWORD_RESET,
      String(req.user!._id),
      String(req.user!._id),
      "User successfully changed password",
      {},
      req
    );

    return sendResponse(res, 200, {
      message: "Password changed successfully"
    });
  });

  // Delete user account (soft delete)
  deleteUser = asyncHandler<AuthRequest>(async (req, res) => {
    verifyAuthentication(req.user);
    const { userId } = req.params;
    const { reason } = req.body;

    // Permission check is handled by the allowSelfOrAdmin middleware
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
      message: "Your account has been deactivated"
    });
  });

  // Edit user details
  editUser = asyncHandler<AuthRequest>(async (req, res) => {
    verifyAuthentication(req.user);
    const { userId } = req.params;
    const { firstName, lastName, email, role } = req.body;

    // Permission check is now handled by the allowSelfOrAdmin middleware
    const user = await findUserById(userId);

    if (!user) {
      return sendResponse(res, 404, {
        message: "User not found"
      });
    }

    // Capture old values for audit log
    const oldValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    };

    // Check if email is being changed and is not already in use
    if (email && email !== user.email) {
      const existingUser = await checkEmailInUse(email, userId);
      if (existingUser) {
        return sendResponse(res, 400, {
          message: "Email already in use"
        });
      }
      user.email = email;
    }

    // Update fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    // Get user ID as string for comparison
    const userIdString = String(req.user!._id);

    // Only SUPER_ADMIN can change roles and cannot change their own role
    if (
      role &&
      req.user!.role === ROLES.SUPER_ADMIN &&
      userId !== userIdString
    ) {
      // Check role validity
      const validRoles = getValidRoles();
      if (!validRoles.includes(role)) {
        return sendResponse(res, 400, {
          message: "Invalid role. Allowed roles are: " + validRoles.join(", ")
        });
      }
      user.role = role;
    }

    await user.save();

    // Create audit log
    await createAuditLog(
      AuditActionType.USER_UPDATE,
      String(req.user!._id),
      userId,
      `User details updated ${req.user!._id === userId ? "by self" : "by admin"}`,
      {
        oldValues,
        newValues: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      },
      req
    );

    return sendResponse(res, 200, {
      message: "User updated successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  });
}

export const userController = new UserController();
