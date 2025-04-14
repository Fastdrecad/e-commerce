import { Router, RequestHandler } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { userController } from "../controllers/user.controller";
import { validateRequest } from "../middleware/validateRequest";
import { changePasswordSchema } from "../schemas/auth.schemas";
import { updateUserSchema } from "../schemas/user.schemas";
import { allowSelfOrAdmin } from "../middleware/allowSelfOrAdmin";

const router = Router();

// Protected routes - all require authentication
router.use(authMiddleware);

// -------------------------------------------------------------------------
// CURRENT USER PROFILE ROUTES
// These routes are for the currently authenticated user's own profile
// -------------------------------------------------------------------------
router.get("/profile", userController.getProfile as RequestHandler);
router.put(
  "/profile",
  validateRequest(updateUserSchema),
  userController.updateProfile as RequestHandler
);
router.put(
  "/change-password",
  validateRequest(changePasswordSchema),
  userController.changePassword as RequestHandler
);

// -------------------------------------------------------------------------
// USER MANAGEMENT ROUTES
// These routes are for operations on specific users by ID
// Permissions handled by allowSelfOrAdmin middleware which allows:
// - Users to manage only their own accounts
// - SUPER_ADMIN users to manage any account
// -------------------------------------------------------------------------
router.delete(
  "/:userId",
  allowSelfOrAdmin() as RequestHandler,
  userController.deleteUser as RequestHandler
);

router.put(
  "/:userId",
  allowSelfOrAdmin() as RequestHandler,
  validateRequest(updateUserSchema),
  userController.editUser as RequestHandler
);

export default router;
