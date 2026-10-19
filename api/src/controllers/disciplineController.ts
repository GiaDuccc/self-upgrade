import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { disciplineService } from '~/services/disciplineService';
import { getTodayInfo } from '~/utils/statsCalculator';

const getMonthData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded!._id;
    const today = getTodayInfo();
    const year = Number(req.query.year) || today.year;
    const month = Number(req.query.month) || today.month;

    const result = await disciplineService.getMonthData(userId, year, month);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const getDayData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded!._id;
    const dateKey = String(req.params.dateKey || getTodayInfo().dateKey);
    const result = await disciplineService.getDayData(userId, dateKey);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const setTaskLevel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded!._id;
    const result = await disciplineService.setTaskLevel(userId, req.body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const markAllLevel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded!._id;
    const result = await disciplineService.markAllLevel(userId, req.body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const clearDay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded!._id;
    const result = await disciplineService.clearDay(userId, req.body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const updateNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded!._id;
    const result = await disciplineService.updateNote(userId, req.body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const saveDayCalories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded!._id;
    const result = await disciplineService.saveDayCalories(userId, req.body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const saveTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded!._id;
    const result = await disciplineService.saveTask(userId, req.body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded!._id;
    const result = await disciplineService.deleteTask(userId, req.body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const exportData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded!._id;
    const result = await disciplineService.exportData(userId);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const importData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded!._id;
    const result = await disciplineService.importData(userId, req.body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const disciplineController = {
  getMonthData,
  getDayData,
  setTaskLevel,
  markAllLevel,
  clearDay,
  updateNote,
  saveDayCalories,
  saveTask,
  deleteTask,
  exportData,
  importData,
};

