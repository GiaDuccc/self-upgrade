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
    gender: Joi.string().valid('MALE', 'FEMALE').optional(),
    age: Joi.alternatives()
      .try(Joi.number().min(5).max(120), Joi.string().allow(''))
      .optional(),
    heightCm: Joi.alternatives()
      .try(Joi.number().min(50).max(260), Joi.string().allow(''))
      .optional(),
    weightKg: Joi.alternatives()
      .try(Joi.number().min(15).max(300), Joi.string().allow(''))
      .optional(),
    sleepTargetHours: Joi.alternatives()
      .try(Joi.number().min(1).max(24), Joi.string().allow(''))
      .optional(),
    physicalState: Joi.string().optional(),
    mentalState: Joi.string().optional(),
    emotionalState: Joi.string().optional(),
    focusGoal: Joi.string().optional(),
    coachingStyle: Joi.string().optional(),
    personalMotto: Joi.string().allow('').max(300).optional(),
    workoutGoal: Joi.string().allow('').optional(),
    workoutLevel: Joi.string().allow('').optional(),
    macroMode: Joi.string().valid('AUTO', 'CUSTOM').optional(),
    targetCalories: Joi.alternatives()
      .try(Joi.number().min(0).max(15000), Joi.string().allow(''))
      .optional(),
    targetProtein: Joi.alternatives()
      .try(Joi.number().min(0).max(1000), Joi.string().allow(''))
      .optional(),
    targetCarb: Joi.alternatives()
      .try(Joi.number().min(0).max(2000), Joi.string().allow(''))
      .optional(),
    targetFat: Joi.alternatives()
      .try(Joi.number().min(0).max(1000), Joi.string().allow(''))
      .optional(),
    targetFiber: Joi.alternatives()
      .try(Joi.number().min(0).max(500), Joi.string().allow(''))
      .optional(),
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

