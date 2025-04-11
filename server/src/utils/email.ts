import nodemailer from "nodemailer";
import { keys } from "../config/keys";

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  host: keys.email.host || "smtp.gmail.com",
  port: parseInt(keys.email.port as string) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: keys.email.user,
    pass: keys.email.pass
  },
  tls: {
    // Do not fail on invalid certificates
    rejectUnauthorized: false
  }
});

// Alternative transporter for testing purposes (outputs to console)
const devTransporter = {
  sendMail: async (options: any) => {
    console.log("================ EMAIL NOT SENT IN DEV MODE ================");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("Text:", options.text || "No text content");
    console.log("HTML:", options.html || "No HTML content");
    console.log("============================================================");
    return { messageId: "test-message-id" };
  }
};

// Choose the appropriate transporter based on environment
const emailTransporter =
  process.env.NODE_ENV === "development" &&
  process.env.SKIP_EMAIL_SEND === "true"
    ? devTransporter
    : transporter;

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await emailTransporter.sendMail({
      from: `"Goddess Within" <${keys.email.user}>`,
      ...options
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
