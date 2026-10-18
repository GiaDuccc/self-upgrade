import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const updateProfile = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const condition = Joi.object({
    name: Joi.string().allow('').max(80).optional(),
    age: Joi.alternatives()
      .try(Joi.number().min(5).max(120), Joi.string().allow(''))
      .optional(),
    heightCm: Joi.alternatives()
      .try(Joi.number().min(50).max(260), Joi.string().allow(''))
      .optional(),
    weightKg: Joi.alternatives()
      .try(Joi.number().min(15).max(300), Joi.string().allow(''))
      .optional(),
    occupation: Joi.string().optional(),
    primaryGoal: Joi.string().optional(),
    physicalState: Joi.string().optional(),
    mentalState: Joi.string().optional(),
    emotionalState: Joi.string().optional(),
    coachingStyle: Joi.string().optional(),
  });

  try {
    await condition.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true,
    });
    next();
  } catch (error) {
    next(
      new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        error instanceof Error ? error.message : 'Thông tin cá nhân không hợp lệ'
      )
    );
  }
};

export const userValidation = {
  updateProfile,
};

