import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model";
import { ROLES, EMAIL_PROVIDER } from "../constants";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config({
  path: path.resolve(process.cwd(), ".env")
});

// Check if MONGO_URI is available
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not defined in the .env file!");
  process.exit(1);
}

const createAdminUser = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Successfully connected to database.");

    const existingAdmin = await User.findOne({ role: ROLES.Admin });
    if (existingAdmin) {
      console.log("Admin user already exists:");
      console.log(`- Email: ${existingAdmin.email}`);
      console.log(
        `- Name: ${existingAdmin.firstName} ${existingAdmin.lastName}`
      );
      await mongoose.disconnect();
      return process.exit(0);
    }

    // Default values for admin user
    const defaultEmail = "admin@example.com";
    const defaultPassword = "Admin123!";

    // Get data from env variables if they exist
    const email = process.env.ADMIN_EMAIL || defaultEmail;
    const password = process.env.ADMIN_PASSWORD || defaultPassword;
    const firstName = process.env.ADMIN_FIRST_NAME || "Admin";
    const lastName = process.env.ADMIN_LAST_NAME || "User";

    console.log("Creating admin user...");
    await User.create({
      firstName,
      lastName,
      email,
      password,
      provider: EMAIL_PROVIDER.Email,
      role: ROLES.Admin,
      isEmailVerified: true
    });

    console.log("Admin user successfully created:");
    console.log(`- Email: ${email}`);
    console.log(
      `- Password: ${password === defaultPassword ? defaultPassword + " (default)" : "******* (from env variable)"}`
    );
    console.log(`- Name: ${firstName} ${lastName}`);
    console.log("\nYou can log in with these credentials.");

    if (password === defaultPassword) {
      console.log(
        "\nIMPORTANT: Change the default password after first login!"
      );
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
createAdminUser();
