export const ROLES = {
  Admin: "admin",
  Member: "member",
  Seller: "seller",
  Support: "support",
  Editor: "editor"
} as const;

export const EMAIL_PROVIDER = {
  Email: "email",
  Google: "google",
  Facebook: "facebook",
  Apple: "apple"
} as const;

export const TOKEN_TYPES = {
  EMAIL_VERIFICATION: "email_verification",
  PASSWORD_RESET: "password_reset",
  REFRESH: "refresh"
} as const;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};
