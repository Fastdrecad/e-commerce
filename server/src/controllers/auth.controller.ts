import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { EMAIL_PROVIDER, ROLES, TOKEN_TYPES } from "../constants";
import { keys } from "../config/keys";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { sendEmail } from "../utils/email";
import { OAuth2Client } from "google-auth-library";
import { Token } from "../models/token.model";
import axios from "axios";

if (!keys.jwt.secret) {
  throw new Error("JWT secret is not defined in environment variables!");
}
// Define JWT secret with fallback
const JWT_SECRET = keys.jwt.secret;

// Rate limiting configuration
const rateLimiter = new RateLimiterMemory({
  points: 10, // 5 attempts
  duration: 60 * 60 // per 1 hour
});

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId: string, type: string): string => {
  // Add more context to the token payload
  const payload = {
    id: userId,
    type,
    // Add a random fingerprint to make tokens more unique
    fingerprint: crypto.randomBytes(8).toString("hex"),
    // Add timestamp for easier debugging and tracking
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: keys.jwt.tokenLife || "7d"
  } as jwt.SignOptions);
};

// Get token expiration time in seconds
const getTokenExpirySeconds = (): number => {
  // Parse the expiry string (e.g., "7d" to seconds)
  const tokenLife = keys.jwt.tokenLife || "7d";
  const unit = tokenLife.slice(-1);
  const value = parseInt(tokenLife.slice(0, -1));

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
      return 7 * 24 * 60 * 60; // default 7 days
  }
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: "30d" // 30 days
  } as jwt.SignOptions);
};

// Helper function to safely get ObjectId string
const getIdString = (doc: any): string => {
  if (doc && doc._id) {
    return doc._id.toString();
  }
  throw new Error("Invalid document ID");
};

// Auth controller class
class AuthController {
  // Register new user
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password } = req.body;

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
        provider: EMAIL_PROVIDER.Email,
        role: ROLES.Member
      };

      const user = (await User.create(userData)) as any;

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours
      await user.save();

      console.log("Email verification token (for testing):", verificationToken);

      // Send verification email
      const verificationUrl = `${keys.app.clientURL}/verify-email?token=${verificationToken}`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Email Verification",
          text: `Please verify your email by clicking on the following link: ${verificationUrl}`
        });
        console.log("Verification email sent");
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        // Continue registration process even if email fails
        // In production, this could be logged to a monitoring service
      }

      // Generate tokens
      const userId = getIdString(user);
      const accessToken = generateToken(userId, "access");
      const refreshToken = generateToken(userId, "refresh");

      // Save refresh token
      await Token.create({
        user: user._id,
        token: refreshToken,
        type: TOKEN_TYPES.REFRESH,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

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
      const accessToken = generateToken(userId, "access");
      const refreshToken = generateToken(userId, "refresh");

      // Save refresh token to database with device info for auditing
      const userAgent = req.headers["user-agent"] || "unknown";
      await Token.create({
        user: user._id,
        token: refreshToken,
        type: TOKEN_TYPES.REFRESH,
        userAgent,
        ipAddress: req.ip || "unknown",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        expiresIn: getTokenExpirySeconds()
      });
    } catch (error) {
      console.error("Login error:", error);
      next(error);
    }
  }

  // Refresh token
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          message: "Refresh token is required"
        });
      }

      // Check if token exists in database and is valid
      const tokenDoc = await Token.findOne({
        token: refreshToken,
        type: TOKEN_TYPES.REFRESH,
        expiresAt: { $gt: new Date() }
      });

      if (!tokenDoc) {
        return res.status(401).json({
          message: "Invalid or expired refresh token"
        });
      }

      // Verify JWT refresh token
      try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
          id: string;
          type: string;
        };

        // Find user
        const user = await User.findById(decoded.id);
        if (!user) {
          // Delete invalid token
          await Token.deleteOne({ _id: tokenDoc._id });
          return res.status(401).json({
            message: "Invalid refresh token"
          });
        }

        // Generate new tokens
        const userId = getIdString(user);
        const accessToken = generateToken(userId, "access");
        const newRefreshToken = generateToken(userId, "refresh");

        // Implement token rotation (delete old token, create new one)
        await Token.deleteOne({ _id: tokenDoc._id });
        await Token.create({
          user: user._id,
          token: newRefreshToken,
          type: TOKEN_TYPES.REFRESH,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        res.status(200).json({
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: getTokenExpirySeconds()
        });
      } catch (error) {
        // JWT verification failed
        await Token.deleteOne({ _id: tokenDoc._id });
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

      const user = (await User.findOne({ email })) as any;
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      // Generate reset token
      const resetToken = user.createPasswordResetToken();
      await user.save();

      console.log("Generated reset token:", resetToken);
      console.log("Hashed reset token stored in DB:", user.passwordResetToken);

      // Send reset email
      const resetUrl = `${keys.app.clientURL}/reset-password/${resetToken}`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Password Reset",
          text: `Click this link to reset your password: ${resetUrl}`
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
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          message: "Verification token is required"
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
        return res.status(400).json({
          message: "Invalid or expired verification token"
        });
      }

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
        await Token.deleteMany({
          user: user._id,
          type: TOKEN_TYPES.REFRESH
        });
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

  // Google authentication
  async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { tokenId } = req.body;

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

      const { email, given_name, family_name, sub } = payload;

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
          provider: EMAIL_PROVIDER.Google,
          googleId: sub,
          isEmailVerified: true
        })) as any;
      }

      // Generate tokens
      const userId = getIdString(user);
      const accessToken = generateToken(userId, "access");
      const refreshToken = generateToken(userId, "refresh");

      // Save refresh token to database
      await Token.create({
        user: user._id,
        token: refreshToken,
        type: TOKEN_TYPES.REFRESH,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        expiresIn: getTokenExpirySeconds()
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
            provider: EMAIL_PROVIDER.Facebook,
            facebookId: data.id,
            isEmailVerified: true
          })) as any;
        }

        // Generate tokens
        const userId = getIdString(user);
        const accessToken = generateToken(userId, "access");
        const refreshToken = generateToken(userId, "refresh");

        // Save refresh token to database
        await Token.create({
          user: user._id,
          token: refreshToken,
          type: TOKEN_TYPES.REFRESH,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        res.status(200).json({
          accessToken,
          refreshToken,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
          },
          expiresIn: getTokenExpirySeconds()
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
          provider: EMAIL_PROVIDER.Apple,
          appleId: token, // Store a unique identifier from Apple
          isEmailVerified: true
        })) as any;
      } else if (user.provider !== EMAIL_PROVIDER.Apple) {
        // Update the user's provider if they were previously using a different method
        user.provider = EMAIL_PROVIDER.Apple;
        await user.save();
      }

      // Generate tokens
      const userId = getIdString(user);
      const accessToken = generateToken(userId, "access");
      const refreshToken = generateToken(userId, "refresh");

      // Save refresh token to database
      await Token.create({
        user: user._id,
        token: refreshToken,
        type: TOKEN_TYPES.REFRESH,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        expiresIn: getTokenExpirySeconds()
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout user
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          message: "Refresh token is required"
        });
      }

      // Delete the refresh token from database
      await Token.deleteOne({ token: refreshToken });

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
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours
      await user.save();

      console.log("New verification token (for testing):", verificationToken);

      // Send verification email
      const verificationUrl = `${keys.app.clientURL}/verify-email?token=${verificationToken}`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Email Verification",
          text: `Please verify your email by clicking on the following link: ${verificationUrl}`
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
            verificationUrl: `${keys.app.clientURL}/verify-email?token=${verificationToken}`
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
      const accessToken = generateToken(userId, "access");
      const refreshToken = generateToken(userId, "refresh");

      // Save refresh token to database
      await Token.create({
        user: user._id,
        token: refreshToken,
        type: TOKEN_TYPES.REFRESH,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        expiresIn: getTokenExpirySeconds(),
        mockInfo: "This is a mock social auth response for development testing"
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
