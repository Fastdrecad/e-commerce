# Application Constants

This directory contains centralized constants and enumerations used throughout the application. Using TypeScript enums provides better type safety, IDE autocomplete support, and helps prevent typos and bugs.

## Available Constants

### ROLES

User role enumerations for authentication and authorization.

```typescript
enum ROLES {
  SUPER_ADMIN = "SUPER_ADMIN",
  CUSTOMER = "CUSTOMER",
  GUEST = "GUEST",
  ORDER_MANAGER = "ORDER_MANAGER"
}
```

### EMAIL_PROVIDER

Authentication providers for user accounts.

```typescript
enum EMAIL_PROVIDER {
  EMAIL = "email",
  GOOGLE = "google",
  FACEBOOK = "facebook",
  APPLE = "apple"
}
```

### TOKEN_TYPES

Types of authentication/verification tokens.

```typescript
enum TOKEN_TYPES {
  EMAIL_VERIFICATION = "email_verification",
  PASSWORD_RESET = "password_reset",
  REFRESH = "refresh",
  ACCESS = "access"
}
```

### ORDER_STATUS

Status values for orders in the e-commerce system.

```typescript
enum ORDER_STATUS {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded"
}
```

### PAYMENT_METHOD

Payment method types for orders.

```typescript
enum PAYMENT_METHOD {
  CREDIT_CARD = "credit_card",
  PAYPAL = "paypal",
  STRIPE = "stripe",
  BANK_TRANSFER = "bank_transfer"
}
```

### PAYMENT_STATUS

Status values for payments.

```typescript
enum PAYMENT_STATUS {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded"
}
```

### PRODUCT_STATUS

Status values for products.

```typescript
enum PRODUCT_STATUS {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
  OUT_OF_STOCK = "out_of_stock"
}
```

## Usage Examples

```typescript
import { ROLES, EMAIL_PROVIDER, TOKEN_TYPES } from "../constants";
import { isValidRole } from "../utils/validation";

// Check user role
if (user.role === ROLES.SUPER_ADMIN) {
  // Admin-only operations
}

// Check authentication provider
if (user.provider === EMAIL_PROVIDER.GOOGLE) {
  // Special handling for Google-authenticated users
}

// Create a token with type
const token = {
  userId: user._id,
  type: TOKEN_TYPES.EMAIL_VERIFICATION
};

// Validate user input using type guards
if (isValidRole(userInput.role)) {
  // Role is valid, safe to use
}
```

## Type Safety

For each enum, there's a corresponding TypeScript type:

```typescript
type Role = keyof typeof ROLES;
type Provider = keyof typeof EMAIL_PROVIDER;
type TokenType = keyof typeof TOKEN_TYPES;
// etc.
```

Use these types in your function signatures for better type safety:

```typescript
function checkUserPermission(role: Role, requiredRole: Role): boolean {
  // Type-safe role checking
}
```

## Validation Utilities

Validation utilities for these constants are available in `utils/validation.ts`, including type guards and helper functions.
