/**
 * Application Role Constants
 * Used for user authorization and permissions
 */
export enum ROLES {
  SUPER_ADMIN = "SUPER_ADMIN",
  CUSTOMER = "CUSTOMER",
  GUEST = "GUEST",
  ORDER_MANAGER = "ORDER_MANAGER"
}

/**
 * Authentication Provider Types
 * Represents the possible authentication methods for users
 */
export enum EMAIL_PROVIDER {
  EMAIL = "email",
  GOOGLE = "google",
  FACEBOOK = "facebook",
  APPLE = "apple"
}

/**
 * Token Type Constants
 * Used for different authentication and verification tokens
 */
export enum TOKEN_TYPES {
  EMAIL_VERIFICATION = "email_verification",
  PASSWORD_RESET = "password_reset",
  REFRESH = "refresh",
  ACCESS = "access"
}

/**
 * Cookie configuration for JWT tokens
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Order status types for e-commerce
 */
export enum ORDER_STATUS {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded"
}

/**
 * Payment methods for orders
 */
export enum PAYMENT_METHOD {
  CREDIT_CARD = "credit_card",
  PAYPAL = "paypal",
  STRIPE = "stripe",
  BANK_TRANSFER = "bank_transfer"
}

/**
 * Payment status types
 */
export enum PAYMENT_STATUS {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded"
}

/**
 * Product status types
 */
export enum PRODUCT_STATUS {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
  OUT_OF_STOCK = "out_of_stock"
}

// Type for validating ROLES
export type Role = keyof typeof ROLES;

// Type for validating EMAIL_PROVIDER
export type Provider = keyof typeof EMAIL_PROVIDER;

// Type for validating TOKEN_TYPES
export type TokenType = keyof typeof TOKEN_TYPES;

// Type for validating ORDER_STATUS
export type OrderStatus = keyof typeof ORDER_STATUS;

// Type for validating PAYMENT_METHOD
export type PaymentMethod = keyof typeof PAYMENT_METHOD;

// Type for validating PAYMENT_STATUS
export type PaymentStatus = keyof typeof PAYMENT_STATUS;

// Type for validating PRODUCT_STATUS
export type ProductStatus = keyof typeof PRODUCT_STATUS;
