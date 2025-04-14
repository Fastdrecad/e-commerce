import { Response, Request } from "express";
import { User } from "../models/user.model";
import { Types } from "mongoose";
import { ROLES } from "../constants";
import { AppError } from "./appError";
import { AuditLog, AuditActionType } from "../models/auditLog.model";
import { sendResponse as standardizedResponse } from "./responseHandlers";
import { isValidRole as validateRole, getEnumValues } from "./validation";

// Re-export the standardized response helper to avoid breaking existing code
export const sendResponse = standardizedResponse;

// User validation helpers
export const findUserById = async (
  userId: string,
  includePassword = false,
  includeInactive = false
) => {
  const query = User.findById(userId);

  if (includePassword) {
    query.select("+password");
  }

  if (includeInactive) {
    (query as any).setOptions({ includeInactive: true });
  }

  return query;
};

export const findUserWithAdminNotes = async (
  userId: string,
  includePassword = false,
  includeInactive = false
) => {
  const query = User.findById(userId).select("+adminNotes");

  if (includePassword) {
    query.select("+password");
  }

  if (includeInactive) {
    (query as any).setOptions({ includeInactive: true });
  }

  return query;
};

export const findAllUsers = async (includeInactive = false) => {
  const query = User.find({}).select("-password");

  if (includeInactive) {
    (query as any).setOptions({ includeInactive: true });
  }

  return query;
};

export const checkEmailInUse = async (
  email: string,
  excludeUserId?: string
) => {
  const query: any = { email };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  return User.findOne(query);
};

export const getUserIdString = (id: string | Types.ObjectId) => {
  return id instanceof Types.ObjectId ? id.toString() : String(id);
};

export const getValidRoles = () => getEnumValues(ROLES);

// Use the imported validateRole function
export const isValidRole = (role: string): boolean => {
  return validateRole(role);
};

export const verifyAuthentication = (user: any) => {
  if (!user) {
    throw new AppError("Not authenticated", 401);
  }
  return user;
};

// Get admin dashboard statistics
export const getDashboardStats = async (includeInactive = true) => {
  const query = includeInactive ? {} : { isActive: true };

  const totalUsers = await User.countDocuments(query);
  const admins = await User.countDocuments({
    ...query,
    role: ROLES.SUPER_ADMIN
  });
  const customers = await User.countDocuments({
    ...query,
    role: ROLES.CUSTOMER
  });
  const verifiedUsers = await User.countDocuments({
    ...query,
    isEmailVerified: true
  });
  const inactiveUsers = includeInactive
    ? await User.countDocuments({ isActive: false })
    : 0;

  return {
    totalUsers,
    admins,
    customers,
    verifiedUsers,
    unverifiedUsers: totalUsers - verifiedUsers,
    inactiveUsers
  };
};

// Helper to create an audit log entry
export const createAuditLog = async (
  action: AuditActionType,
  performedBy: string,
  targetResource: string,
  details: string,
  metadata: Record<string, any> = {},
  req?: Request
) => {
  try {
    const auditLog = {
      action,
      performedBy,
      targetResource,
      details,
      metadata,
      ip: req?.ip,
      userAgent: req?.headers["user-agent"]
    };

    return await AuditLog.create(auditLog);
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit logging should not stop operations
  }
};

// Data integrity helpers - implement these based on your related models
export const anonymizeUserRelatedData = async (userId: string) => {
  // Example: Anonymize reviews, comments, etc.
  // await Review.updateMany({ user: userId }, { userName: "Anonymous User" });
  // await Comment.updateMany({ user: userId }, { userName: "Anonymous User" });

  // This should be implemented based on your specific data models
  return true;
};

export const transferUserData = async (
  fromUserId: string,
  toUserId: string
) => {
  // Example: Transfer orders, reviews, etc. to another user
  // await Order.updateMany({ user: fromUserId }, { user: toUserId });

  // This should be implemented based on your specific data models
  return true;
};

// Enhanced delete functions
export const softDeleteUserById = async (
  userId: string,
  adminId: string,
  reason?: string,
  req?: Request
) => {
  const user = await findUserById(userId, false, true);

  if (!user) return null;

  await user.softDelete(adminId, reason);

  // Create audit log
  await createAuditLog(
    AuditActionType.USER_DELETE,
    adminId,
    userId,
    `User ${user.email} was soft-deleted with reason: ${reason || "Not specified"}`,
    { userId, email: user.email, reason },
    req
  );

  return user;
};

export const restoreUserById = async (
  userId: string,
  adminId: string,
  req?: Request
) => {
  const query = User.findById(userId);
  (query as any).setOptions({ includeInactive: true });
  const user = await query;

  if (!user) return null;

  await user.restore();

  // Create audit log
  await createAuditLog(
    AuditActionType.USER_RESTORE,
    adminId,
    userId,
    `User ${user.email} was restored`,
    { userId, email: user.email },
    req
  );

  return user;
};

// Hard delete with data handling
export const hardDeleteUserById = async (
  userId: string,
  adminId: string,
  shouldAnonymize = true,
  req?: Request
) => {
  // First get user details for the audit log
  const user = await findUserById(userId, false, true);

  if (!user) return null;

  // Store data for audit log
  const userData = {
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role
  };

  // Anonymize or transfer related data if needed
  if (shouldAnonymize) {
    await anonymizeUserRelatedData(userId);
  }

  // Perform hard delete
  const deletedUser = await User.findByIdAndDelete(userId);

  // Create audit log
  await createAuditLog(
    AuditActionType.USER_DELETE,
    adminId,
    userId,
    `User ${userData.email} was permanently deleted`,
    { userId, userData, hardDelete: true },
    req
  );

  return deletedUser;
};
