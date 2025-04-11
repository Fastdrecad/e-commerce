import { Schema, model, Document, Types } from "mongoose";

export interface IToken extends Document {
  user: Types.ObjectId;
  token: string;
  type: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    token: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for better performance
tokenSchema.index({ token: 1 });
tokenSchema.index({ user: 1, type: 1 });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup

export const Token = model<IToken>("Token", tokenSchema);
