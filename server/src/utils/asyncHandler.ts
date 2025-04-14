import { Request, Response, NextFunction } from "express";

/**
 * Utility function to wrap async route handlers with error handling
 * Supports generic request types for custom request interfaces
 *
 * Usage example:
 *
 * ```
 * // With standard Request
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find({});
 *   res.json(users);
 * }));
 *
 * // With custom AuthRequest
 * router.get('/profile', asyncHandler<AuthRequest>(async (req, res) => {
 *   // req.user is available
 *   res.json(req.user);
 * }));
 * ```
 *
 * @param fn The async route handler function
 * @returns A wrapped function that forwards errors to Express error handler
 */
export const asyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
): ((req: T, res: Response, next: NextFunction) => void) => {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
