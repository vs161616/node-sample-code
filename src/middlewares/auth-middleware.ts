import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedRequest } from '../errors';
import { logger } from '../logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({
  path: '.env',
});

// Extract the secret key from environment variables
const SECRET = process.env.SECRET as string;

/**
 * Middleware function to handle JWT authentication.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) {
    logger.info('Auth token is not supplied');
    return next(new UnauthorizedRequest('Auth token is not supplied'));
  }

  try {
    if (process.env.NODE_ENV !== 'test') {
      await jwt.verify(token, SECRET);
    }
    next();
  } catch (err) {
    logger.info('Token Validation Failed');
    return next(new UnauthorizedRequest());
  }
};
