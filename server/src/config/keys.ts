import dotenv from "dotenv";

dotenv.config();
interface DatabaseConfig {
  url: string | undefined;
}

interface AppConfig {
  name: string;
  apiURL: string | undefined;
  clientURL: string | undefined;
}

interface JwtConfig {
  secret: string | undefined;
  tokenLife: string;
}

interface EmailConfig {
  user: string | undefined;
  pass: string | undefined;
  host: string | undefined;
  port: string | undefined;
}

interface MailchimpConfig {
  key: string | undefined;
  listKey: string | undefined;
}

interface MailgunConfig {
  key: string | undefined;
  domain: string | undefined;
  sender: string | undefined;
}

interface PaypalConfig {
  key: string | undefined;
  secret: string | undefined;
  apiUrl: string | undefined;
}

interface CloudinaryConfig {
  name: string | undefined;
  apiKey: string | undefined;
  apiSecret: string | undefined;
}

interface KeysConfig {
  app: AppConfig;
  port: string | number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  email: EmailConfig;
  mailchimp: MailchimpConfig;
  mailgun: MailgunConfig;
  paypal: PaypalConfig;
  cloudinary: CloudinaryConfig;
}

const keys: KeysConfig = {
  app: {
    name: "goddess-within",
    apiURL: process.env.BASE_API_URL,
    clientURL: process.env.CLIENT_URL
  },
  port: process.env.PORT || 3000,
  database: {
    url: process.env.MONGO_URI
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    tokenLife: "7d"
  },
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT
  },
  mailchimp: {
    key: process.env.MAILCHIMP_KEY,
    listKey: process.env.MAILCHIMP_LIST_KEY
  },
  mailgun: {
    key: process.env.MAILGUN_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    sender: process.env.MAILGUN_EMAIL_SENDER
  },
  paypal: {
    key: process.env.PAYPAL_CLIENT_ID,
    secret: process.env.PAYPAL_APP_SECRET,
    apiUrl: process.env.PAYPAL_API_URL
  },
  cloudinary: {
    name: process.env.CLOUD_NAME,
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET
  }
};

export { keys };
