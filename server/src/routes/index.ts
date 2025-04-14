import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import adminRoutes from "./admin.routes";

const router = Router();

// Authentication routes (/api/auth/*)
// Login, register, password reset, email verification, etc.
router.use("/auth", authRoutes);

// User management routes (/api/users/*)
// User profiles, CRUD operations on users, role management
// Permissions are handled inside the routes based on user role
router.use("/users", userRoutes);

// Admin-specific routes (/api/admin/*)
// Dashboard stats, reporting, and admin-only features
// All routes require SUPER_ADMIN role
router.use("/admin", adminRoutes);

export { router as apiRoutes };
