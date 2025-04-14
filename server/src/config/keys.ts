import dotenv from "dotenv";
import path from "path";

// Load environment variables once
dotenv.config({ path: path.join(process.cwd(), ".env") });

// Environment determination
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Database configuration
 */
interface DatabaseConfig {
  readonly url: string;
  readonly options: {
    readonly useNewUrlParser: boolean;
    readonly useUnifiedTopology: boolean;
    readonly autoIndex: boolean;
  };
}

/**
 * Application config
 */
interface AppConfig {
  readonly name: string;
  readonly apiURL: string;
  readonly clientURL: string;
  readonly port: number;
  readonly env: string;
}

/**
 * JWT config
 */
interface JwtConfig {
  readonly secret: string;
  readonly accessTokenLife: string;
  readonly refreshTokenLife: string;
}

/**
 * Email configuration
 */
interface EmailConfig {
  readonly user: string;
  readonly pass: string;
  readonly host: string;
  readonly port: number;
  readonly from: string;
}

/**
 * Third-party service configurations
 */
interface MailchimpConfig {
  readonly key: string;
  readonly listKey: string;
}

interface MailgunConfig {
  readonly key: string;
  readonly domain: string;
  readonly sender: string;
}

interface PaypalConfig {
  readonly clientId: string;
  readonly secret: string;
  readonly apiUrl: string;
  readonly sandbox: boolean;
}

interface CloudinaryConfig {
  readonly cloudName: string;
  readonly apiKey: string;
  readonly apiSecret: string;
}

/**
 * Main configuration interface
 */
interface Config {
  readonly app: AppConfig;
  readonly database: DatabaseConfig;
  readonly jwt: JwtConfig;
  readonly email: EmailConfig;
  readonly mailchimp: MailchimpConfig;
  readonly mailgun: MailgunConfig;
  readonly paypal: PaypalConfig;
  readonly cloudinary: CloudinaryConfig;
}

/**
 * Validate that required environment variables exist
 * @param name Variable name
 * @param fallback Optional fallback value
 * @returns The environment variable or fallback
 * @throws Error if the variable is not defined and no fallback is provided
 */
function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;

  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }

  return value;
}

/**
 * Application configuration
 */
const keys: Config = {
  app: {
    name: "goddess-within",
    env: NODE_ENV,
    apiURL: requireEnv(
      "BASE_API_URL",
      NODE_ENV === "development" ? "http://localhost:8080" : undefined
    ),
    clientURL: requireEnv(
      "CLIENT_URL",
      NODE_ENV === "development" ? "http://localhost:8080" : undefined
    ),
    port: parseInt(process.env.PORT || "8080", 10)
  },
  database: {
    url: requireEnv("MONGO_URI"),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: NODE_ENV !== "production" // Disable in production for performance
    }
  },
  jwt: {
    secret: requireEnv("JWT_SECRET"),
    accessTokenLife: process.env.JWT_ACCESS_TOKEN_LIFE || "15m", // Short lived
    refreshTokenLife: process.env.JWT_REFRESH_TOKEN_LIFE || "7d" // Longer lived
  },
  email: {
    user: requireEnv(
      "EMAIL_USER",
      NODE_ENV === "development" ? "test@example.com" : undefined
    ),
    pass: requireEnv(
      "EMAIL_PASS",
      NODE_ENV === "development" ? "password" : undefined
    ),
    host: requireEnv(
      "EMAIL_HOST",
      NODE_ENV === "development" ? "smtp.example.com" : undefined
    ),
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    from: process.env.EMAIL_FROM || "noreply@goddess-within.com"
  },
  mailchimp: {
    key: process.env.MAILCHIMP_KEY || "",
    listKey: process.env.MAILCHIMP_LIST_KEY || ""
  },
  mailgun: {
    key: process.env.MAILGUN_KEY || "",
    domain: process.env.MAILGUN_DOMAIN || "",
    sender: process.env.MAILGUN_EMAIL_SENDER || "noreply@goddess-within.com"
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || "",
    secret: process.env.PAYPAL_APP_SECRET || "",
    apiUrl:
      process.env.PAYPAL_API_URL ||
      (NODE_ENV === "production"
        ? "https://api.paypal.com"
        : "https://api.sandbox.paypal.com"),
    sandbox: NODE_ENV !== "production"
  },
  cloudinary: {
    cloudName: process.env.CLOUD_NAME || "",
    apiKey: process.env.API_KEY || "",
    apiSecret: process.env.API_SECRET || ""
  }
};

// Freeze the config object to prevent modifications
Object.freeze(keys);
Object.keys(keys).forEach((key) => {
  if (typeof (keys as any)[key] === "object" && (keys as any)[key] !== null) {
    Object.freeze((keys as any)[key]);
  }
});

export { keys };

// Export a validation function to check service-specific config
export function validateServiceConfig(service: keyof Config): boolean {
  const config = keys[service];

  // Check if all properties have non-empty values
  return Object.values(config).every((val) => {
    if (typeof val === "string") return val.trim() !== "";
    if (typeof val === "object") return val !== null;
    return true;
  });
}
