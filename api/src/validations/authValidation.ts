import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';
import {
  EMAIL_RULE,
  EMAIL_RULE_MESSAGE,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE,
} from '~/utils/validators';

const signUp = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const condition = Joi.object({
    email: Joi.string()
      .required()
      .pattern(EMAIL_RULE)
      .message(EMAIL_RULE_MESSAGE)
      .trim()
      .lowercase(),
    password: Joi.string()
      .required()
      .pattern(PASSWORD_RULE)
      .message(PASSWORD_RULE_MESSAGE),
  });

  try {
    await condition.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(
      new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        error instanceof Error ? error.message : 'Dữ liệu đăng ký không hợp lệ'
      )
    );
  }
};

const verifyEmail = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const condition = Joi.object({
    email: Joi.string()
      .required()
      .pattern(EMAIL_RULE)
      .message(EMAIL_RULE_MESSAGE)
      .trim()
      .lowercase(),
    code: Joi.string().optional().allow(''),
    token: Joi.string().optional().allow(''),
  });

  try {
    await condition.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(
      new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        error instanceof Error ? error.message : 'Dữ liệu xác thực không hợp lệ'
      )
    );
  }
};

const signInClient = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const condition = Joi.object({
    email: Joi.string()
      .required()
      .pattern(EMAIL_RULE)
      .message(EMAIL_RULE_MESSAGE)
      .trim()
      .lowercase(),
    password: Joi.string().required(),
  });

  try {
    await condition.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(
      new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        error instanceof Error ? error.message : 'Dữ liệu đăng nhập không hợp lệ'
      )
    );
  }
};

export const authValidation = {
  signUp,
  verifyEmail,
  signInClient,
};

