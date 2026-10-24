import express from 'express';
import { disciplineController } from '~/controllers/disciplineController';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { disciplineValidation } from '~/validations/disciplineValidation';

const Router = express.Router();

Router.use(authMiddleware.isAuthorizedClient);

Router.route('/month').get(disciplineController.getMonthData);

Router.route('/day/:dateKey').get(disciplineController.getDayData);

Router.route('/task-level').put(
  disciplineValidation.setTaskLevel,
  disciplineController.setTaskLevel
);

Router.route('/mark-all').put(disciplineController.markAllLevel);

Router.route('/clear-day').delete(disciplineController.clearDay);

Router.route('/note').put(
  disciplineValidation.updateNote,
  disciplineController.updateNote
);

Router.route('/day/calories').put(disciplineController.saveDayCalories);

Router.route('/day/workout').put(disciplineController.saveDayWorkout);

Router.route('/day/water').put(disciplineController.saveDayWater);

Router.route('/day/sleep').put(disciplineController.saveDaySleep);

Router.route('/task').post(disciplineController.saveTask);

Router.route('/task/delete').post(disciplineController.deleteTask);

Router.route('/export').get(disciplineController.exportData);

Router.route('/import').post(disciplineController.importData);

export const disciplineRouter = Router;

