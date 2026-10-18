import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { env } from '~/config/environment';
import ApiError from '~/utils/ApiError';

export const errorHandlingMiddleware = (
  err: ApiError & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (!err.statusCode) {
    err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }

  const responseError: Record<string, unknown> = {
    statusCode: err.statusCode,
    message: err.message || StatusCodes[err.statusCode],
    stack: err.stack,
  };

  if (env.BUILD_MODE !== 'dev') {
    delete responseError.stack;
  }

  res.status(err.statusCode).json(responseError);
};

