import nodemailer from "nodemailer";
import { keys, validateServiceConfig } from "../config/keys";

/**
 * Email message interface
 */
interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Email service class to handle all email functionality
 */
class EmailService {
  private transporter!: nodemailer.Transporter;
  private initialized: boolean = false;

  constructor() {
    // Initialize only if configuration is valid
    if (validateServiceConfig("email")) {
      try {
        console.log("Initializing email service with config:", {
          host: keys.email.host,
          port: keys.email.port,
          user: keys.email.user,
          from: keys.email.from
        });

        this.transporter = nodemailer.createTransport({
          host: keys.email.host,
          port: keys.email.port,
          secure: keys.email.port === 465, // true for 465, false for other ports
          auth: {
            user: keys.email.user,
            pass: keys.email.pass
          },
          tls: {
            // Do not fail on invalid certificates
            rejectUnauthorized: false
          }
        });

        // Verify the connection
        this.transporter.verify((error, success) => {
          if (error) {
            console.error("Email service verification failed:", error);
          } else {
            console.log("Email service is ready to send emails");
          }
        });

        this.initialized = true;
      } catch (error) {
        console.error("Failed to initialize email service:", error);
        this.initialized = false;
      }
    } else {
      console.error("Email service configuration is invalid");
    }
  }

  /**
   * Check if email service is properly initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Send an email
   * @param message The email message to send
   * @returns Promise resolving to the message info
   */
  async sendEmail(message: EmailMessage): Promise<any> {
    // For development environment with email sending skipped
    if (
      keys.app.env === "development" &&
      process.env.SKIP_EMAIL_SEND === "true"
    ) {
      console.log(
        "================ EMAIL NOT SENT IN DEV MODE ================"
      );
      console.log("To:", message.to);
      console.log("Subject:", message.subject);
      console.log("Text:", message.text || "No text content");
      console.log("HTML:", message.html || "No HTML content");
      console.log(
        "============================================================"
      );
      return { messageId: "dev-mode-no-email-sent" };
    }

    if (!this.initialized) {
      console.error("Email service is not initialized");
      throw new Error("Email service is not initialized");
    }

    // Set default from address if not provided
    const emailMessage = {
      ...message,
      from: message.from || `"Goddess Within" <${keys.email.from}>`
    };

    try {
      console.log("Attempting to send email to:", message.to);
      const result = await this.transporter.sendMail(emailMessage);
      console.log("Email sent successfully:", result);
      return result;
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  }

  /**
   * Send a verification email
   * @param to Recipient email
   * @param token Verification token
   * @returns Promise resolving to the message info
   */
  async sendVerificationEmail(to: string, token: string): Promise<any> {
    const verificationUrl = `${keys.app.clientURL}/verify-email/${token}`;

    return this.sendEmail({
      to,
      subject: "Verify Your Email",
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
  }

  /**
   * Send a password reset email
   * @param to Recipient email
   * @param token Reset token
   * @returns Promise resolving to the message info
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<any> {
    const resetUrl = `${keys.app.clientURL}/reset-password/${token}`;

    return this.sendEmail({
      to,
      subject: "Password Reset Request",
      text: `Click this link to reset your password: ${resetUrl}`,
      html: `
        <div>
          <h2>Password Reset</h2>
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
  }
}

// Create a singleton instance
const emailService = new EmailService();

export default emailService;
