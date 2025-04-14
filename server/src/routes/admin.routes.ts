import { Router, RequestHandler } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleCheck } from "../middleware/roleCheck.middleware";
import { ROLES } from "../constants";
import { adminController } from "../controllers/admin.controller";
import { validateRequest } from "../middleware/validateRequest";
import {
  updateUserRoleSchema,
  adminEditUserSchema
} from "../schemas/user.schemas";

const router = Router();

// Protect all admin routes - requires authentication and admin role
router.use(authMiddleware as RequestHandler);
router.use(roleCheck([ROLES.SUPER_ADMIN]) as RequestHandler);

// Admin dashboard
router.get("/dashboard", adminController.getDashboardStats as RequestHandler);

// User listing (admin-only functionality)
router.get("/users", adminController.getAllUsers as RequestHandler);
router.get("/users/:userId", adminController.getUserById as RequestHandler);
router.get(
  "/users/:userId/notes",
  adminController.getUserAdminNotes as RequestHandler
);

// User management - comprehensive admin edit capabilities
router.put(
  "/users/:userId",
  roleCheck([ROLES.SUPER_ADMIN]) as RequestHandler,
  validateRequest(adminEditUserSchema),
  adminController.adminEditUser as RequestHandler
);

// User management - role changes
router.patch(
  "/:userId/role",
  roleCheck([ROLES.SUPER_ADMIN]) as RequestHandler,
  validateRequest(updateUserRoleSchema),
  adminController.changeUserRole as RequestHandler
);

// Keep the PUT route for backward compatibility
router.put(
  "/:userId/role",
  roleCheck([ROLES.SUPER_ADMIN]) as RequestHandler,
  validateRequest(updateUserRoleSchema),
  adminController.changeUserRole as RequestHandler
);

// User management - soft delete and restore
router.patch(
  "/:userId/deactivate",
  roleCheck([ROLES.SUPER_ADMIN]) as RequestHandler,
  adminController.softDeleteUser as RequestHandler
);

router.patch(
  "/:userId/restore",
  roleCheck([ROLES.SUPER_ADMIN]) as RequestHandler,
  adminController.restoreUser as RequestHandler
);

// User management - hard delete (permanent)
router.delete(
  "/:userId/permanent",
  roleCheck([ROLES.SUPER_ADMIN]) as RequestHandler,
  adminController.hardDeleteUser as RequestHandler
);

export default router;
