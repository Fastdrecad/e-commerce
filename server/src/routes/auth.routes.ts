import { Router } from "express";
import authController from "../controllers/auth.controller";
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  verifyEmailSchema,
  checkEmailSchema
} from "../schemas/auth.schemas";
import { validateRequest } from "../middleware/validateRequest";
import { extractRefreshToken } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register
);
router.post("/login", validateRequest(loginSchema), authController.login);
router.get(
  "/check-email",
  validateRequest(checkEmailSchema),
  authController.checkEmailExists
);
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
router.post("/refresh-token", extractRefreshToken, authController.refreshToken);
router.get(
  "/verify-email/:token",
  validateRequest(verifyEmailSchema),
  authController.verifyEmail
);
router.post("/logout", extractRefreshToken, authController.logout);
router.post("/resend-verification", authController.resendVerificationEmail);

// Social auth routes
router.post("/oauth/google", authController.googleAuth);
router.post("/oauth/facebook", authController.facebookAuth);
router.post("/oauth/apple", authController.appleAuth);

// Development testing routes
if (process.env.NODE_ENV === "development") {
  router.post("/mock-social-auth", authController.mockSocialAuth);
}

export default router;
