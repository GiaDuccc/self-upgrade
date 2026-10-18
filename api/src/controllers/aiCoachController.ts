import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { aiCoachService } from '~/services/aiCoachService';

const getCoachingMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded!._id;
    const result = await aiCoachService.getCoachingMessage(userId, req.body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const aiCoachController = {
  getCoachingMessage,
};

