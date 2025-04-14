import express, { Express } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import path from "path";
import cookieParser from "cookie-parser";

import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { apiRoutes } from "./routes";
import setupDB from "./config/database";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env") });

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    // Allow credentials for cookie-based auth
    credentials: true,
    // Configure allowed origins based on environment
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL || "https://yourdomain.com"
        : ["http://localhost:3000", "http://localhost:5173"]
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use("/api", apiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Setup database connection
    await setupDB();

    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
