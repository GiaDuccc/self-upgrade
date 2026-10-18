import express from 'express';
import { userController } from '~/controllers/userController';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { userValidation } from '~/validations/userValidation';

const Router = express.Router();

Router.route('/profile')
  .get(authMiddleware.isAuthorizedClient, userController.getProfile)
  .put(
    authMiddleware.isAuthorizedClient,
    userValidation.updateProfile,
    userController.updateProfile
  );

export const userRouter = Router;

