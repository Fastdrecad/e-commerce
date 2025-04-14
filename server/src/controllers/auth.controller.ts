import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { EMAIL_PROVIDER, ROLES, COOKIE_OPTIONS } from "../constants";
import { keys } from "../config/keys";
import crypto from "crypto";
import { RateLimiterMemory } from "rate-limiter-flexible";
import emailService from "../services/email.service";
import tokenService from "../services/token.service";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

if (!keys.jwt.secret) {
  throw new Error("JWT secret is not defined in environment variables!");
}

// Rate limiting configuration
const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 attempts
  duration: 60 * 60 // per 1 hour
});

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to safely get ObjectId string
const getIdString = (doc: any): string => {
  if (doc && doc._id) {
    return doc._id.toString();
  }
  throw new Error("Invalid document ID");
};

// Helper function to calculate token expiry in seconds
const getAccessTokenExpirySeconds = (): number => {
  const expiryString = keys.jwt.accessTokenLife;
  const unit = expiryString.slice(-1);
  const value = parseInt(expiryString.slice(0, -1));

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60; // days to seconds
    case "h":
      return value * 60 * 60; // hours to seconds
    case "m":
      return value * 60; // minutes to seconds
    case "s":
      return value; // seconds
    default:
      return 900; // default 15 minutes
  }
};

// Auth controller class
class AuthController {
  // Register new user
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password, confirmPassword } =
        req.body;

      // Validate that passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({
          message: "Passwords do not match"
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          message: "Email already in use"
        });
      }

      // Create new user with proper casting
      const userData = {
        firstName,
        lastName,
        email,
        password,
        provider: EMAIL_PROVIDER.EMAIL,
        role: ROLES.CUSTOMER
      };

      const user = (await User.create(userData)) as any;

      // Generate verification token
      const verificationToken = tokenService.generateRandomToken();
      const hashedToken = tokenService.hashToken(verificationToken);

      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours
      await user.save();

      console.log("Email verification token (for testing):", verificationToken);

      // Send verification email
      const verificationUrl = `${keys.app.clientURL}/auth/verify-email?token=${verificationToken}`;
      try {
        await emailService.sendEmail({
          to: user.email,
          subject: "Email Verification",
          text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
          html: `
            <div>
              <h2>Email Verification</h2>
              <p>Please verify your email by clicking the button below:</p>
              <a href="${verificationUrl}" style="padding:10px 15px; background-color:#4CAF50; color:white; text-decoration:none; border-radius:5px;">
                Verify My Email
              </a>
              <p>Or copy and paste this link in your browser: ${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
            </div>
          `
        });
        console.log("Verification email sent");
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        // Continue registration process even if email fails
        // In production, this could be logged to a monitoring service
      }

      // Generate tokens
      const userId = getIdString(user);
      const accessToken = tokenService.generateAccessToken(userId);
      const refreshToken = tokenService.generateRefreshToken(userId);

      // Save refresh token
      await tokenService.saveRefreshToken(userId, refreshToken);

      res.status(201).json({
        message:
          "User successfully registered. Please check your email for a verification link.",
        ...(process.env.NODE_ENV === "development" && {
          verificationToken, // Only included in development for testing
          devNote: "This token is only included in development mode for testing"
        })
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Check rate limit
      try {
        await rateLimiter.consume(req.ip || "unknown");
      } catch (error) {
        console.warn(`Rate limit exceeded for IP: ${req.ip || "unknown"}`);
        return res.status(429).json({
          message: "Too many login attempts. Please try again later.",
          retryAfter: 1800 // Suggest retry after 30 min
        });
      }

      // Find user with password included and proper casting
      const user = (await User.findOne({ email }).select("+password")) as any;
      if (!user) {
        // Use consistent response time regardless of whether user exists
        // to prevent timing attacks that could reveal user existence
        await new Promise((resolve) =>
          setTimeout(resolve, 200 + Math.random() * 100)
        );

        return res.status(401).json({
          message: "Invalid credentials"
        });
      }

      // Check password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        // Log failed attempts for security monitoring
        console.warn(`Failed login attempt for user: ${email}`);

        return res.status(401).json({
          message: "Invalid credentials"
        });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(403).json({
          message: "Please verify your email before logging in",
          needsVerification: true,
          email: user.email
        });
      }

      // Update last login
      await user.updateLastLogin();

      // Generate tokens
      const userId = getIdString(user);
      const accessToken = tokenService.generateAccessToken(userId);
      const refreshToken = tokenService.generateRefreshToken(userId);

      // Save refresh token to database with device info for auditing
      const userAgent = req.headers["user-agent"] || "unknown";
      await tokenService.saveRefreshToken(
        userId,
        refreshToken,
        userAgent,
        req.ip || "unknown"
      );

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

      // Only send access token in response body
      res.status(200).json({
        accessToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        expiresIn: getAccessTokenExpirySeconds()
      });
    } catch (error) {
      console.error("Login error:", error);
      next(error);
    }
  }

  // Refresh token
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Get refresh token from cookie instead of request body
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          message: "Refresh token is required"
        });
      }

      // Check if token exists in database and is valid
      const tokenDoc = await tokenService.findRefreshToken(refreshToken);

      if (!tokenDoc) {
        // Clear the invalid cookie
        res.clearCookie("refreshToken");
        return res.status(401).json({
          message: "Invalid or expired refresh token"
        });
      }

      // Verify JWT refresh token
      try {
        const decoded = tokenService.verifyToken(refreshToken);
        if (!decoded) {
          throw new Error("Invalid token");
        }

        // Find user
        const user = await User.findById(decoded.id);
        if (!user) {
          // Delete invalid token and clear cookie
          await tokenService.deleteRefreshToken(refreshToken);
          res.clearCookie("refreshToken");
          return res.status(401).json({
            message: "Invalid refresh token"
          });
        }

        // Generate new tokens
        const userId = getIdString(user);
        const accessToken = tokenService.generateAccessToken(userId);
        const newRefreshToken = tokenService.generateRefreshToken(userId);

        // Implement token rotation (delete old token, create new one)
        await tokenService.deleteRefreshToken(refreshToken);
        await tokenService.saveRefreshToken(
          userId,
          newRefreshToken,
          req.headers["user-agent"] || "unknown",
          req.ip || "unknown"
        );

        // Set new refresh token as HTTP-only cookie
        res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

        // Only send access token in response body
        res.status(200).json({
          accessToken,
          expiresIn: getAccessTokenExpirySeconds()
        });
      } catch (error) {
        // JWT verification failed, clear cookie
        await tokenService.deleteRefreshToken(refreshToken);
        res.clearCookie("refreshToken");
        return res.status(401).json({
          message: "Invalid refresh token"
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // Forgot password
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email is required"
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email format"
        });
      }

      // Find user with case-insensitive email
      const user = (await User.findOne({ email: email.toLowerCase() })) as any;
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      // Ensure provider is set correctly
      if (!user.provider) {
        user.provider = EMAIL_PROVIDER.EMAIL;
      }

      // Generate reset token
      const resetToken = user.createPasswordResetToken();
      await user.save();

      console.log("Generated reset token:", resetToken);
      console.log("Hashed reset token stored in DB:", user.passwordResetToken);

      // Send reset email
      const resetUrl = `${keys.app.clientURL}/reset-password/${resetToken}`;
      try {
        await emailService.sendEmail({
          to: user.email,
          subject: "Password Reset",
          text: `Click this link to reset your password: ${resetUrl}`,
          html: `
            <div>
              <h2>Password Reset Request</h2>
              <p>You requested a password reset. Click the button below to reset your password:</p>
              <a href="${resetUrl}" style="padding:10px 15px; background-color:#2196F3; color:white; text-decoration:none; border-radius:5px;">
                Reset Password
              </a>
              <p>Or copy and paste this link in your browser: ${resetUrl}</p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // In development with SKIP_EMAIL_SEND=true, return a success message
        if (
          process.env.NODE_ENV === "development" &&
          process.env.SKIP_EMAIL_SEND === "true"
        ) {
          return res.status(200).json({
            message:
              "Password reset link generated (email sending skipped in development)",
            devToken: resetToken // Only provided in development for testing
          });
        }

        return res.status(500).json({
          message: "Error sending email. Please try again later."
        });
      }

      res.status(200).json({
        message: "Password reset email sent",
        ...(process.env.NODE_ENV === "development" && { devToken: resetToken })
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      next(error);
    }
  }

  // Reset password
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      console.log("Reset password attempt with token:", token);

      // Hash token
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      console.log("Hashed token:", hashedToken);

      const user = (await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      })) as any;

      if (!user) {
        return res.status(400).json({
          message: "Invalid or expired token"
        });
      }

      // Update password
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      res.status(200).json({
        message: "Password reset successful"
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify email
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("Received verification request with params:", req.params);
      const { token } = req.params;

      if (!token || typeof token !== "string") {
        console.log("Token validation failed:", { token, type: typeof token });
        return res.status(400).json({
          message: "Verification token is required",
          received: token,
          type: typeof token
        });
      }

      console.log("Attempting to verify email with token:", token);

      // Hash token
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      console.log("Hashed verification token:", hashedToken);

      const user = (await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      })) as any;

      if (!user) {
        console.log("No user found with token or token expired");
        return res.status(400).json({
          message: "Invalid or expired verification token"
        });
      }

      console.log("Found user for verification:", user.email);

      // Update user
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;

      // Track verification timestamp for security auditing
      user.emailVerifiedAt = new Date();

      await user.save();

      // Log successful verification for audit purposes
      console.log(`User ${user.email} verified their email successfully`);

      // For security, auto-expire all sessions (except current) upon major account changes
      if (process.env.NODE_ENV === "production") {
        await tokenService.deleteAllUserRefreshTokens(user._id);
      }

      res.status(200).json({
        message: "Email verified successfully",
        // Return the verification status for client-side handling
        verified: true
      });
    } catch (error) {
      console.error("Email verification error:", error);
      next(error);
    }
  }

  // Check if email exists
  async checkEmailExists(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.query;

      if (!email || typeof email !== "string") {
        return res.status(400).json({
          message: "Email parameter is required"
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email format"
        });
      }

      // Find if user exists
      const user = await User.findOne({ email: email.toLowerCase() });

      // Return exists: true/false without revealing additional user information for security
      res.status(200).json({
        exists: !!user,
        isVerified: user ? user.isEmailVerified : false
      });
    } catch (error) {
      console.error("Error checking email existence:", error);
      next(error);
    }
  }

  // Logout user
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        // Delete the refresh token from database
        await tokenService.deleteRefreshToken(refreshToken);
      }

      // Clear the cookie
      res.clearCookie("refreshToken");

      res.status(200).json({
        message: "Logout successful"
      });
    } catch (error) {
      next(error);
    }
  }

  // Resend verification email
  async resendVerificationEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.body;

      // Find the user
      const user = (await User.findOne({ email })) as any;
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return res.status(400).json({
          message: "Email is already verified"
        });
      }

      // Generate new verification token
      const verificationToken = tokenService.generateRandomToken();
      const hashedToken = tokenService.hashToken(verificationToken);

      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours
      await user.save();

      console.log("New verification token (for testing):", verificationToken);

      // Send verification email
      const verificationUrl = `${keys.app.clientURL}/auth/verify-email?token=${verificationToken}`;
      try {
        await emailService.sendEmail({
          to: user.email,
          subject: "Email Verification",
          text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
          html: `
            <div>
              <h2>Email Verification</h2>
              <p>Please verify your email by clicking the button below:</p>
              <a href="${verificationUrl}" style="padding:10px 15px; background-color:#4CAF50; color:white; text-decoration:none; border-radius:5px;">
                Verify My Email
              </a>
              <p>Or copy and paste this link in your browser: ${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
            </div>
          `
        });
        console.log("Verification email sent");
      } catch (emailError) {
        console.error("Email sending error:", emailError);

        // In development with email disabled, return token directly
        if (
          process.env.NODE_ENV === "development" &&
          process.env.SKIP_EMAIL_SEND === "true"
        ) {
          return res.status(200).json({
            message: "Verification email would be sent (development mode)",
            verificationToken,
            verificationUrl: `${keys.app.clientURL}/auth/verify-email?token=${verificationToken}`
          });
        }

        return res.status(500).json({
          message: "Error sending verification email. Please try again later."
        });
      }

      res.status(200).json({
        message: "Verification email has been sent",
        ...(process.env.NODE_ENV === "development" && { verificationToken })
      });
    } catch (error) {
      next(error);
    }
  }

  // Mock social auth (only for development testing)
  async mockSocialAuth(req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV !== "development") {
      return res.status(404).json({
        message: "Endpoint not found"
      });
    }

    try {
      const { provider, email, firstName, lastName } = req.body;

      if (!email || !provider) {
        return res.status(400).json({
          message: "Email and provider are required"
        });
      }

      // Find or create user
      let user = (await User.findOne({ email })) as any;

      if (!user) {
        // Generate a strong random password that satisfies the validation requirements
        const strongPassword = `Test${Math.floor(Math.random() * 10000)}!${Date.now().toString().slice(-4)}`;

        user = (await User.create({
          firstName: firstName || "Social",
          lastName: lastName || "User",
          email,
          password: strongPassword,
          provider,
          isEmailVerified: true
        })) as any;
      }

      // Generate tokens
      const userId = getIdString(user);
      const accessToken = tokenService.generateAccessToken(userId);
      const refreshToken = tokenService.generateRefreshToken(userId);

      // Save refresh token to database
      await tokenService.saveRefreshToken(userId, refreshToken);

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

      // Only send access token in response body
      res.status(200).json({
        accessToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        expiresIn: getAccessTokenExpirySeconds(),
        mockInfo: "This is a mock social auth response for development testing"
      });
    } catch (error) {
      next(error);
    }
  }

  // Google authentication
  async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { tokenId, access_token } = req.body;

      // Use the token that's available (tokenId for web client, access_token for mobile/react app)
      const token = tokenId || access_token;

      if (!token) {
        return res.status(400).json({
          message: "No valid token provided"
        });
      }

      let userInfo;
      let email, given_name, family_name, sub;

      try {
        if (tokenId) {
          // Verify ID token with Google
          const ticket = await googleClient.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID
          });

          const payload = ticket.getPayload();
          if (!payload) {
            return res.status(400).json({
              message: "Invalid Google token"
            });
          }

          email = payload.email;
          given_name = payload.given_name;
          family_name = payload.family_name;
          sub = payload.sub;
        } else {
          // Use the access token to get user info
          const response = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`
          );
          userInfo = await response.json();

          if (!userInfo || userInfo.error) {
            return res.status(400).json({
              message: "Invalid Google access token",
              error: userInfo?.error || "Unknown error"
            });
          }

          email = userInfo.email;
          given_name = userInfo.given_name;
          family_name = userInfo.family_name;
          sub = userInfo.sub;
        }
      } catch (error) {
        console.error("Google token validation error:", error);
        return res.status(400).json({
          message: "Error validating Google token",
          error: error instanceof Error ? error.message : String(error)
        });
      }

      if (!email) {
        return res.status(400).json({
          message: "Email not provided by Google"
        });
      }

      // Generate a strong password
      const strongPassword = `Google${Math.floor(Math.random() * 10000)}!${Date.now().toString().slice(-4)}`;

      // Find or create user with proper casting
      let user = (await User.findOne({ email })) as any;
      if (!user) {
        user = (await User.create({
          firstName: given_name,
          lastName: family_name,
          email,
          password: strongPassword,
          provider: EMAIL_PROVIDER.GOOGLE,
          googleId: sub,
          isEmailVerified: true
        })) as any;
      }

      // Generate tokens
      const userId = getIdString(user);
      const accessToken = tokenService.generateAccessToken(userId);
      const refreshToken = tokenService.generateRefreshToken(userId);

      // Save refresh token to database
      await tokenService.saveRefreshToken(userId, refreshToken);

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

      // Only send access token in response body
      res.status(200).json({
        accessToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        expiresIn: getAccessTokenExpirySeconds()
      });
    } catch (error) {
      next(error);
    }
  }

  // Facebook authentication
  async facebookAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken: fbAccessToken, userID } = req.body;

      // Verify Facebook token
      try {
        const { data } = await axios.get(
          `https://graph.facebook.com/v12.0/${userID}`,
          {
            params: {
              fields: "id,email,first_name,last_name",
              access_token: fbAccessToken
            }
          }
        );

        if (!data.email) {
          return res.status(400).json({
            message: "Could not get email from Facebook"
          });
        }

        // Generate a strong password
        const strongPassword = `Facebook${Math.floor(Math.random() * 10000)}!${Date.now().toString().slice(-4)}`;

        // Find or create user with proper casting
        let user = (await User.findOne({ email: data.email })) as any;
        if (!user) {
          user = (await User.create({
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            password: strongPassword,
            provider: EMAIL_PROVIDER.FACEBOOK,
            facebookId: data.id,
            isEmailVerified: true
          })) as any;
        }

        // Generate tokens
        const userId = getIdString(user);
        const accessToken = tokenService.generateAccessToken(userId);
        const refreshToken = tokenService.generateRefreshToken(userId);

        // Save refresh token to database
        await tokenService.saveRefreshToken(userId, refreshToken);

        // Set refresh token as HTTP-only cookie
        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

        // Only send access token in response body
        res.status(200).json({
          accessToken,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
          },
          expiresIn: getAccessTokenExpirySeconds()
        });
      } catch (error) {
        console.error("Facebook API error:", error);
        return res.status(400).json({
          message: "Error validating Facebook credentials"
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // Apple authentication
  async appleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, firstName, lastName, email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email is required for Apple authentication"
        });
      }

      // Generate a strong password
      const strongPassword = `Apple${Math.floor(Math.random() * 10000)}!${Date.now().toString().slice(-4)}`;

      // In a production app, you would verify the Apple token here
      // using the 'jsonwebtoken' library and Apple's public keys
      // See: https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens

      // Find or create user
      let user = (await User.findOne({ email })) as any;

      if (!user) {
        user = (await User.create({
          firstName: firstName || "Apple",
          lastName: lastName || "User",
          email,
          password: strongPassword,
          provider: EMAIL_PROVIDER.APPLE,
          appleId: token, // Store a unique identifier from Apple
          isEmailVerified: true
        })) as any;
      } else if (user.provider !== EMAIL_PROVIDER.APPLE) {
        // Update the user's provider if they were previously using a different method
        user.provider = EMAIL_PROVIDER.APPLE;
        await user.save();
      }

      // Generate tokens
      const userId = getIdString(user);
      const accessToken = tokenService.generateAccessToken(userId);
      const refreshToken = tokenService.generateRefreshToken(userId);

      // Save refresh token to database
      await tokenService.saveRefreshToken(userId, refreshToken);

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

      // Only send access token in response body
      res.status(200).json({
        accessToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        expiresIn: getAccessTokenExpirySeconds()
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
