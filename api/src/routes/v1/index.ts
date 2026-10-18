import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { aiCoachRouter } from '~/routes/v1/Client/aiCoachRouter';
import { authRouter } from '~/routes/v1/Client/authRouter';
import { disciplineRouter } from '~/routes/v1/Client/disciplineRouter';
import { userRouter } from '~/routes/v1/Client/userRouter';

const Router = express.Router();

Router.get('/status', (_req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'OK',
    message: 'Self Upgrade API v1 is ready!',
  });
});

Router.use('/auth', authRouter);
Router.use('/users', userRouter);
Router.use('/disciplines', disciplineRouter);
Router.use('/ai-coach', aiCoachRouter);

export const APIs_V1 = Router;

