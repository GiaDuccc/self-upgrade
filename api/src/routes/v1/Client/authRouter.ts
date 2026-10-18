import express from 'express';
import { authController } from '~/controllers/authController';
import { authValidation } from '~/validations/authValidation';

const Router = express.Router();

Router.route('/signUp').post(authValidation.signUp, authController.signUp);

Router.route('/verifyEmail').post(
  authValidation.verifyEmail,
  authController.verifyEmail
);

Router.route('/resendVerification').post(authController.resendVerification);

Router.route('/signInClient').post(
  authValidation.signInClient,
  authController.signInClient
);

Router.route('/refreshTokenClient').put(authController.refreshTokenClient);

Router.route('/signOutClient').delete(authController.signOutClient);

export const authRouter = Router;

