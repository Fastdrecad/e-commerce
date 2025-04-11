import mongoose, {
  Schema,
  Document,
  Model,
  CallbackError,
  Types
} from "mongoose";
import bcrypt from "bcryptjs";
import { EMAIL_PROVIDER, ROLES } from "../constants";
import crypto from "crypto";

// Define the base user interface
export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  provider: string;
  wishlist: Types.ObjectId[];
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  role: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the user methods
export interface IUserMethods {
  isPasswordResetTokenValid(): boolean;
  updateLastLogin(): Promise<void>;
  matchPassword(enteredPassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
}

// Define the user document type (combination of IUser, Document and methods)
export interface UserDocument extends Document, IUser, IUserMethods {}

// Create the schema
const userSchema = new Schema<UserDocument>(
  {
    firstName: {
      type: String,
      required: [true, "Please tell us your first name"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters long"],
      maxlength: [50, "First name cannot exceed 50 characters"]
    },
    lastName: {
      type: String,
      required: [true, "Please tell us your last name"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters long"],
      maxlength: [50, "Last name cannot exceed 50 characters"]
    },
    email: {
      type: String,
      required: function (this: UserDocument) {
        return this.provider === EMAIL_PROVIDER.Email;
      },
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters long"],
      select: false
    },
    provider: {
      type: String,
      required: true,
      default: EMAIL_PROVIDER.Email,
      enum: Object.values(EMAIL_PROVIDER)
    },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    googleId: {
      type: String,
      sparse: true
    },
    facebookId: {
      type: String,
      sparse: true
    },
    appleId: {
      type: String,
      sparse: true
    },
    role: {
      type: String,
      default: ROLES.Member,
      enum: Object.values(ROLES)
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    lastLoginAt: {
      type: Date
    },
    passwordChangedAt: {
      type: Date
    },
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Check if password reset token is valid
userSchema.methods.isPasswordResetTokenValid = function (
  this: UserDocument
): boolean {
  if (!this.passwordResetExpires) return false;
  return this.passwordResetExpires > new Date();
};

// Update last login timestamp
userSchema.methods.updateLastLogin = async function (
  this: UserDocument
): Promise<void> {
  this.lastLoginAt = new Date();
  await this.save();
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (
  this: UserDocument,
  enteredPassword: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }
    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Error matching password");
  }
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (
  this: UserDocument,
  JWTTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function (
  this: UserDocument
): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return resetToken;
};

// Check for duplicate email
userSchema.pre(
  "save",
  async function (this: UserDocument, next: (err?: CallbackError) => void) {
    if (this.provider === EMAIL_PROVIDER.Email) {
      const existingUser = await User.exists({
        email: this.email,
        _id: { $ne: this._id }
      });

      if (existingUser) {
        return next(new Error("Email already in use"));
      }
    }
    next();
  }
);

// Encrypt password using bcrypt
userSchema.pre(
  "save",
  async function (this: UserDocument, next: (err?: CallbackError) => void) {
    try {
      if (!this.isModified("password")) {
        return next();
      }

      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(this.password)) {
        throw new Error(
          "Password must be at least 8 characters long, contain one uppercase letter, and one symbol."
        );
      }

      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      this.passwordChangedAt = new Date();
      next();
    } catch (error) {
      console.error("Error encrypting password:", error);
      next(error as CallbackError);
    }
  }
);

// Add indexes
userSchema.index({ email: 1 }, { unique: true });

// Export the model with proper typing
export const User = mongoose.model<UserDocument>("User", userSchema);
