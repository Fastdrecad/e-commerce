import { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: `Route ${req.originalUrl} not found`,
  });
}; 