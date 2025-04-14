# Error Handling Utilities

This directory contains utilities for consistent error handling across the application.

## errorHandlers.ts

Contains utilities for handling MongoDB errors and other common error types:

### `handleMongoErrors`

Handles MongoDB and Mongoose errors by converting them to user-friendly responses with appropriate status codes.

Error types handled:

- Duplicate key errors (E11000)
- Validation errors
- Cast errors (invalid ObjectId, etc.)
- Transaction errors
- Connection errors

### `globalErrorHandler`

Express middleware for centralized error handling that works with any error, including MongoDB errors and custom AppError instances.

### `asyncHandler`

Utility function to wrap async route handlers with error handling, eliminating the need for try/catch blocks.

## appError.ts

Custom error class with additional properties for better error handling:

- `statusCode`: HTTP status code (e.g., 400, 404, 500)
- `status`: String status ("fail" or "error")
- `code`: Error code for client-side error handling (e.g., "DUPLICATE_KEY", "VALIDATION_ERROR")
- `isOperational`: Flag indicating if error is operational (expected) or programming error

## Usage Examples

### Basic Error Handling

```typescript
import { AppError } from "../utils/appError";

// Creating a custom error
throw new AppError("User not found", 404, "USER_NOT_FOUND");
```

### Using asyncHandler

```typescript
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/appError";

router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    res.json(user);
  })
);
```

### With Custom Request Type

```typescript
import { asyncHandler } from "../utils/asyncHandler";

interface AuthRequest extends Request {
  user?: UserDocument;
}

router.get(
  "/profile",
  asyncHandler<AuthRequest>(async (req, res) => {
    // req.user is available and typed correctly
    if (!req.user) {
      throw new AppError("Not authenticated", 401, "NOT_AUTHENTICATED");
    }

    res.json(req.user);
  })
);
```

### Error Response Format

Success responses:

```json
{
  "status": "success",
  "data": { ... }
}
```

Error responses:

```json
{
  "status": "error",
  "code": "DUPLICATE_KEY",
  "message": "Duplicate email: 'test@example.com' already exists.",
  "field": "email"
}
```

Validation errors:

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```
