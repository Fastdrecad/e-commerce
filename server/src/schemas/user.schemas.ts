import { z } from "zod";
import { ROLES } from "../constants";

// User update schema
export const updateUserSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .optional(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .optional(),
    email: z.string().email("Invalid email address").optional()
  })
});

// Role update schema
export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(
      [
        ROLES.SUPER_ADMIN as string,
        ROLES.CUSTOMER as string,
        ROLES.GUEST as string,
        ROLES.ORDER_MANAGER as string
      ],
      {
        errorMap: () => ({
          message: `Role must be one of: ${Object.values(ROLES).join(", ")}`
        })
      }
    )
  }),
  params: z.object({
    userId: z.string().min(1, "User ID is required")
  })
});

// Admin user edit schema with extended capabilities
export const adminEditUserSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .optional(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .optional(),
    email: z.string().email("Invalid email address").optional(),
    role: z
      .enum(
        [
          ROLES.SUPER_ADMIN as string,
          ROLES.CUSTOMER as string,
          ROLES.GUEST as string,
          ROLES.ORDER_MANAGER as string
        ],
        {
          errorMap: () => ({
            message: `Role must be one of: ${Object.values(ROLES).join(", ")}`
          })
        }
      )
      .optional(),
    isEmailVerified: z.boolean().optional(),
    isActive: z.boolean().optional(),
    notes: z.string().optional(),
    adminNotes: z.string().optional()
  }),
  params: z.object({
    userId: z.string().min(1, "User ID is required")
  })
});

// Infer types from schemas
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type AdminEditUserInput = z.infer<typeof adminEditUserSchema>;
