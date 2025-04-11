import dotenv from "dotenv";
import mongoose from "mongoose";
import { keys } from "../config/keys";
import chalk from "chalk";

// Load environment variables
dotenv.config();

const { database } = keys;

const setupDB = async (): Promise<void> => {
  try {
    // Validate MongoDB URL
    const mongoUri = database.url;
    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", mongoUri ? "Found" : "Not found");

    if (!mongoUri) {
      throw new Error(
        "MongoDB URL is not defined in environment variables. Please check your .env file."
      );
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");

    // Set up connection event listeners before connecting
    mongoose.connection.on("connected", () => {
      console.log(
        `${chalk.green("✓")} ${chalk.blue("MongoDB Connected Successfully!")}`
      );
      console.log(`${chalk.blue("Database:")} ${mongoose.connection.name}`);
      console.log(`${chalk.blue("Host:")} ${mongoose.connection.host}`);
    });

    mongoose.connection.on("error", (err) => {
      console.error(`${chalk.red("✗")} MongoDB connection error:`, err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log(`${chalk.yellow("⚠")} MongoDB disconnected`);
    });

    // Handle process termination
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log(
          `${chalk.yellow("⚠")} MongoDB connection closed through app termination`
        );
        process.exit(0);
      } catch (err) {
        console.error(
          `${chalk.red("✗")} Error closing MongoDB connection:`,
          err
        );
        process.exit(1);
      }
    });

    // Attempt to connect
    await mongoose.connect(mongoUri);

    // Verify connection
    if (mongoose.connection.readyState === 1) {
      console.log(
        `${chalk.green("✓")} ${chalk.blue("MongoDB Connection Verified!")}`
      );
    } else {
      throw new Error("MongoDB connection failed to establish");
    }
  } catch (error) {
    console.error(
      `${chalk.red("✗")} Error connecting to MongoDB:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
};

export default setupDB;
