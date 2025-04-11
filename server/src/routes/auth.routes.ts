import { Router } from "express";
import authController from "../controllers/auth.controller";
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  verifyEmailSchema
} from "../schemas/auth.schemas";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

// Public routes
router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register
);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);
router.post("/refresh-token", authController.refreshToken);
router.get(
  "/verify-email/:token",
  validateRequest(verifyEmailSchema),
  authController.verifyEmail
);
router.post("/logout", authController.logout);
router.post("/resend-verification", authController.resendVerificationEmail);

// Social auth routes
router.post("/google", authController.googleAuth);
router.post("/facebook", authController.facebookAuth);
router.post("/apple", authController.appleAuth);

// Development testing routes
if (process.env.NODE_ENV === "development") {
  router.post("/mock-social-auth", authController.mockSocialAuth);
}

export default router;
