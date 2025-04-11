import { z } from "zod";

// Register schema
export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
        "Password must contain at least one uppercase letter, one number, and one symbol"
      )
  })
});

// Login schema
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required")
  })
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address")
  })
});

// Reset password schema
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
        "Password must contain at least one uppercase letter, one number, and one symbol"
      )
  })
});

// Change password schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
        "Password must contain at least one uppercase letter, one number, and one symbol"
      )
  })
});

// Email verification schema
export const verifyEmailSchema = z.object({
  params: z.object({
    token: z.string().min(1, "Token is required")
  })
});

// Infer types from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
