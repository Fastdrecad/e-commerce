import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

// Middleware for request validation
export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parsing request data against the schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      return next(); // If validation passes, proceed to the next middleware/route handler
    } catch (error) {
      if (error instanceof ZodError) {
        // Send back the validation errors in a structured response
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors // Extract detailed error information from Zod's validation
        });
      }
      return res.status(400).json({ message: "Validation failed" });
    }
  };
};
