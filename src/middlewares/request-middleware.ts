import { RequestHandler, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { BadRequest } from '../errors';
import { logger } from '../logger';

/**
 * Extracts the error message from a Joi validation error.
 *
 * @param {Joi.ValidationError} error - The validation error.
 * @returns {string} The error message(s) from the validation error.
 */
const getMessageFromJoiError = (error: Joi.ValidationError): string => {
  if (error.details && error.details.length > 0) {
    return error.details.map((detail) => `${detail.message}`).join('\n');
  }
  return error.message || 'Validation error occurred';
};

interface HandlerOptions {
  validation?: {
    body?: Joi.ObjectSchema;
  };
}

/**
 * Middleware function to handle request validation.
 *
 * @param {RequestHandler} handler - Request handler function to execute.
 * @param {HandlerOptions} options - Options object for validation.
 * @returns {RequestHandler} Express middleware function.
 */
export const relogRequestHandler = (
  handler: RequestHandler,
  options?: HandlerOptions,
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.info(req.url);

    if (options?.validation?.body) {
      const { error } = options.validation.body.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        return next(new BadRequest(getMessageFromJoiError(error)));
      }
    }

    try {
      await handler(req, res, next);
    } catch (err) {
      logger.error('Error in request handler', { error: err });
      next(err);
    }
  };
};
