import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { keys } from "../config/keys";
import { TOKEN_TYPES } from "../constants";
import { Token } from "../models/token.model";

/**
 * JWT payload interface
 */
interface TokenPayload {
  id: string;
  type: string;
  fingerprint?: string;
  iat?: number;
  exp?: number;
}

/**
 * Token service to handle all JWT and token-related functionality
 */
class TokenService {
  /**
   * Generate a JWT access token
   * @param userId User ID to include in the token
   * @returns The signed JWT token string
   */
  generateAccessToken(userId: string): string {
    const payload: TokenPayload = {
      id: userId,
      type: "access",
      // Add random fingerprint to make tokens more unique and prevent reuse
      fingerprint: crypto.randomBytes(8).toString("hex"),
      // Include timestamp for easier debugging
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, keys.jwt.secret, {
      expiresIn: keys.jwt.accessTokenLife
    } as SignOptions);
  }

  /**
   * Generate a JWT refresh token
   * @param userId User ID to include in the token
   * @returns The signed JWT refresh token string
   */
  generateRefreshToken(userId: string): string {
    const payload: TokenPayload = {
      id: userId,
      type: "refresh",
      fingerprint: crypto.randomBytes(8).toString("hex"),
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, keys.jwt.secret, {
      expiresIn: keys.jwt.refreshTokenLife
    } as SignOptions);
  }

  /**
   * Verify and decode a JWT token
   * @param token JWT token to verify
   * @returns Decoded token payload or null if invalid
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, keys.jwt.secret) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save a refresh token to the database
   * @param userId User ID associated with the token
   * @param token Refresh token string
   * @param userAgent Optional user agent string
   * @param ipAddress Optional IP address
   * @returns Promise resolving to the created token document
   */
  async saveRefreshToken(
    userId: string,
    token: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<any> {
    const refreshTokenLife = keys.jwt.refreshTokenLife;

    // Parse the expiry string (e.g., "7d", "30d") to get milliseconds
    const expiryMilliseconds = this.parseExpiryTime(refreshTokenLife);

    return Token.create({
      user: userId,
      token,
      type: TOKEN_TYPES.REFRESH,
      userAgent: userAgent || "unknown",
      ipAddress: ipAddress || "unknown",
      expiresAt: new Date(Date.now() + expiryMilliseconds)
    });
  }

  /**
   * Find a valid refresh token in the database
   * @param token Refresh token string to find
   * @returns Promise resolving to the token document or null
   */
  async findRefreshToken(token: string): Promise<any> {
    return Token.findOne({
      token,
      type: TOKEN_TYPES.REFRESH,
      expiresAt: { $gt: new Date() }
    });
  }

  /**
   * Delete a refresh token from the database
   * @param token Refresh token string to delete
   * @returns Promise resolving when the token is deleted
   */
  async deleteRefreshToken(token: string): Promise<void> {
    await Token.deleteOne({ token });
  }

  /**
   * Delete all refresh tokens for a user
   * @param userId User ID to delete tokens for
   * @returns Promise resolving when the tokens are deleted
   */
  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    await Token.deleteMany({
      user: userId,
      type: TOKEN_TYPES.REFRESH
    });
  }

  /**
   * Generate a random token for email verification or password reset
   * @returns Random token string
   */
  generateRandomToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Hash a token for secure storage
   * @param token Plain token string
   * @returns Hashed token string
   */
  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Parse expiry time string to milliseconds
   * @param expiryString Expiry time string (e.g., "7d", "1h", "30m")
   * @returns Milliseconds
   */
  private parseExpiryTime(expiryString: string): number {
    const unit = expiryString.slice(-1);
    const value = parseInt(expiryString.slice(0, -1), 10);

    switch (unit) {
      case "d":
        return value * 24 * 60 * 60 * 1000; // days to ms
      case "h":
        return value * 60 * 60 * 1000; // hours to ms
      case "m":
        return value * 60 * 1000; // minutes to ms
      case "s":
        return value * 1000; // seconds to ms
      default:
        return 7 * 24 * 60 * 60 * 1000; // default 7 days
    }
  }
}

// Create a singleton instance
const tokenService = new TokenService();

export default tokenService;
