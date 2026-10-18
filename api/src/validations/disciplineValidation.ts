import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const setTaskLevel = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const condition = Joi.object({
    dateKey: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required(),
    taskId: Joi.string().required(),
    levelKey: Joi.string()
      .valid('PERFECT', 'GOOD', 'BAD', 'NONE')
      .required(),
  });

  try {
    await condition.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(
      new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        error instanceof Error ? error.message : 'Dữ liệu chấm điểm không hợp lệ'
      )
    );
  }
};

const updateNote = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const condition = Joi.object({
    dateKey: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required(),
    note: Joi.string().allow('').max(5000).required(),
  });

  try {
    await condition.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(
      new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        error instanceof Error ? error.message : 'Dữ liệu ghi chú không hợp lệ'
      )
    );
  }
};

export const disciplineValidation = {
  setTaskLevel,
  updateNote,
};

