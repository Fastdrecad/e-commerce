# Goddess Within E-commerce Server

A modern, TypeScript-based Express.js server for the Goddess Within e-commerce platform.

## Features

- 🚀 Built with TypeScript for type safety
- 🔐 Robust JWT-based authentication with refresh tokens
- 🌐 Social authentication (Google, Facebook, Apple)
- ✉️ Email verification system
- 🔑 Password reset functionality
- 📝 Input validation using express-validator and Zod
- 🗄️ MongoDB with Mongoose ODM
- 🔒 Enhanced security features (helmet, cors, rate limiting)
- 🎯 RESTful API design
- 📦 Modern ES modules
- 🔍 Comprehensive error handling
- 👑 Role-based access control

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:

   ```env
   PORT=8080
   MONGODB_URI=
   JWT_SECRET=
   NODE_ENV=development

   # Email Configuration
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@example.com
   EMAIL_PASS=your-email-password

   # Frontend URL (for email verification links)
   CLIENT_URL=http://localhost:3000


   # Optional flags
   SKIP_EMAIL_SEND=true # Development only - skip sending emails
   ```

4. Build the TypeScript code:

   ```bash
   npm run build
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Authentication and Security

The server implements a comprehensive authentication system with these security features:

- **JWT Authentication**

  - Access tokens (short-lived)
  - Refresh tokens (long-lived)
  - Token fingerprinting
  - Secure token rotation

- **User Registration and Verification**

  - Email verification
  - Strong password requirements
  - Password hashing

- **Multi-provider Authentication**

  - Email/password
  - Google
  - Facebook
  - Apple

- **Security Measures**
  - Rate limiting for login attempts
  - CSRF protection
  - CORS configuration
  - Helmet security headers
  - Input validation and sanitization
  - Consistent timing responses to prevent timing attacks
  - Session invalidation on critical account changes

## Error Handling

The server uses a centralized error handling mechanism. All errors are processed through the `errorHandler` middleware, which formats the error response consistently.
