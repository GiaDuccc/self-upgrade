import express from 'express';
import { aiCoachController } from '~/controllers/aiCoachController';
import { authMiddleware } from '~/middlewares/authMiddleware';

const Router = express.Router();

Router.route('/message').post(
  authMiddleware.isAuthorizedClient,
  aiCoachController.getCoachingMessage
);

export const aiCoachRouter = Router;

