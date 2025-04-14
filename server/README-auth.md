# Secure Cookie-Based Authentication

This project uses a secure cookie-based authentication system that follows security best practices for handling user authentication.

## How It Works

1. **HTTP-Only Cookies for Refresh Tokens**:

   - Refresh tokens are stored in HTTP-only cookies, making them inaccessible to JavaScript
   - This prevents XSS (Cross-Site Scripting) attacks from stealing refresh tokens

2. **Access Tokens in Memory**:

   - Access tokens are short-lived and kept in memory in the frontend application
   - They are never stored in local/session storage or cookies

3. **Secure Cookie Configuration**:
   ```typescript
   // From src/constants/index.ts
   export const COOKIE_OPTIONS = {
     httpOnly: true,
     secure: process.env.NODE_ENV === "production",
     sameSite: "strict" as const,
     maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
   };
   ```

## Security Features

- **httpOnly**: Prevents JavaScript access to cookies, mitigating XSS attacks
- **secure**: In production, cookies are only sent over HTTPS
- **sameSite: "strict"**: Prevents cookies from being sent in cross-site requests, mitigating CSRF attacks
- **Limited maxAge**: Refresh tokens expire after 7 days for security

## How Authentication Flows Work

### Login Flow

1. User submits credentials
2. Server validates credentials and generates:
   - Short-lived access token (returned in response body)
   - Long-lived refresh token (stored in HTTP-only cookie)
3. Frontend stores access token in memory only

### Token Refresh Flow

1. Access token expires
2. Frontend requests new access token from `/api/auth/refresh-token`
3. Server automatically receives the refresh token from the cookie
4. Server validates refresh token and issues:
   - New access token (returned in response body)
   - New refresh token (rotated for security, stored in HTTP-only cookie)

### Logout Flow

1. Frontend calls `/api/auth/logout`
2. Server clears the refresh token cookie
3. Token is also invalidated in the database

## Implementation Details

The `COOKIE_OPTIONS` constant from `src/constants/index.ts` is used consistently throughout the authentication flow to ensure secure cookie handling:

```typescript
// In controllers/auth.controller.ts
res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
```

## Client-Side Integration

For client-side integration, ensure your frontend HTTP client:

1. Includes credentials in requests:

   ```javascript
   // Axios configuration
   axios.defaults.withCredentials = true;
   ```

2. Manages access tokens in memory (e.g., in state or context)

3. Implements token refresh logic when access tokens expire

## Cross-Origin Considerations

When deploying to production, ensure your CORS settings align with the cookie security requirements:

```typescript
app.use(
  cors({
    credentials: true, // Required for cookies
    origin: process.env.CLIENT_URL // Should match your frontend domain
  })
);
```
