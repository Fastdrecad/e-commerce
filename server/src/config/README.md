# Configuration Best Practices

This document outlines the best practices for managing configuration in your MERN application.

## Configuration Structure

The application uses a centralized configuration approach with the following components:

1. **Environment Variables**: Defined in `.env` file and loaded once
2. **Configuration Object**: Typed object in `keys.ts` that provides access to all app settings
3. **Service Modules**: Encapsulate functionality that depends on configuration

## Key Benefits

- **Type Safety**: TypeScript interfaces ensure configuration is properly typed
- **Validation**: Early detection of missing required environment variables
- **Immutability**: Configuration is frozen to prevent accidental modifications
- **Encapsulation**: Business logic is separated from configuration details

## Where to Use Configuration

### DO Use In

1. **Service Modules**: Create dedicated service classes that encapsulate functionality:

   ```typescript
   // Example: email.service.ts
   class EmailService {
     constructor() {
       this.transporter = nodemailer.createTransport({
         host: keys.email.host,
         port: keys.email.port
         // ...
       });
     }
   }
   ```

2. **Bootstrap Code**: Use for app initialization only:

   ```typescript
   // Example: index.ts
   const port = keys.app.port;
   app.listen(port, () => {
     console.log(`Server running on port ${port}`);
   });
   ```

3. **Configuration Factories**: For creating clients and connections:
   ```typescript
   // Example: database.ts
   export default async function setupDB() {
     await mongoose.connect(keys.database.url, keys.database.options);
   }
   ```

### DON'T Use In

1. **Controllers**: Controllers should receive all dependencies through services:

   ```typescript
   // Bad
   class UserController {
     async getUser(req, res) {
       // Directly using keys in controller
       jwt.verify(token, keys.jwt.secret);
     }
   }

   // Good
   class UserController {
     async getUser(req, res) {
       // Using service that internally uses keys
       const decoded = tokenService.verifyToken(token);
     }
   }
   ```

2. **Models**: Models should be independent of configuration:

   ```typescript
   // Bad
   userSchema.methods.generateToken = function () {
     return jwt.sign({ id: this._id }, keys.jwt.secret);
   };

   // Good
   // Move token generation to a service
   ```

3. **Middleware**: Use services instead:

   ```typescript
   // Bad
   const authMiddleware = (req, res, next) => {
     jwt.verify(token, keys.jwt.secret);
   };

   // Good
   const authMiddleware = (req, res, next) => {
     tokenService.verifyToken(token);
   };
   ```

## Validation

The configuration system includes validation to ensure required values exist:

```typescript
function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;

  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }

  return value;
}
```

This allows the application to fail fast during startup if critical configuration is missing.

## Service Pattern Example

```typescript
// token.service.ts
import { keys } from "../config/keys";

class TokenService {
  generateToken(userId: string): string {
    return jwt.sign({ id: userId }, keys.jwt.secret, {
      expiresIn: keys.jwt.accessTokenLife
    });
  }
}

// auth.controller.ts
import tokenService from "../services/token.service";

class AuthController {
  async login(req, res) {
    // Generate token using service
    const token = tokenService.generateToken(user._id);
    res.json({ token });
  }
}
```

## Environment-Specific Configuration

The configuration system supports different values based on the environment:

```typescript
database: {
  options: {
    autoIndex: NODE_ENV !== "production"; // Disable in production for performance
  }
}
```

This allows for different behavior in development, testing, and production environments.

## Security Considerations

- Sensitive configuration (secrets, API keys) should only be loaded in memory, never logged
- Configuration validation happens early to prevent runtime errors
- Environment-specific defaults provide sensible values in development
