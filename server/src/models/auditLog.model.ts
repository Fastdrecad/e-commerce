import mongoose, { Schema, Document } from "mongoose";

export enum AuditActionType {
  USER_CREATE = "USER_CREATE",
  USER_UPDATE = "USER_UPDATE",
  USER_DELETE = "USER_DELETE",
  USER_RESTORE = "USER_RESTORE",
  USER_ROLE_CHANGE = "USER_ROLE_CHANGE",
  LOGIN_ATTEMPT = "LOGIN_ATTEMPT",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  PASSWORD_RESET = "PASSWORD_RESET",
  ADMIN_ACTION = "ADMIN_ACTION"
}

export interface AuditLogDocument extends Document {
  action: AuditActionType;
  performedBy: mongoose.Types.ObjectId | string;
  targetResource: string;
  details: string;
  metadata: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    action: {
      type: String,
      required: true,
      enum: Object.values(AuditActionType)
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    targetResource: {
      type: String,
      required: true
    },
    details: {
      type: String,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    ip: {
      type: String
    },
    userAgent: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexing for better query performance
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ targetResource: 1 });
auditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<AuditLogDocument>(
  "AuditLog",
  auditLogSchema
);
