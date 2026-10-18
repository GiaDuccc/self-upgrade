import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import ms from 'ms';
import { authService } from '~/services/authService';

const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.signUp(req.body);
    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.verifyEmail(req.body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.resendVerification(req.body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const signInClient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.signInClient(req.body);

    res.cookie('refreshTokenClient', result.refreshToken, {
      httpOnly: true,
      secure: false, // localhost
      sameSite: 'lax',
      maxAge: ms('14 days'),
    });

    res.status(StatusCodes.OK).json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const refreshTokenClient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clientRefreshToken = req.cookies?.refreshTokenClient;
    const result = await authService.refreshTokenClient(clientRefreshToken);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const signOutClient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.jwtDecoded?._id;
    await authService.signOutClient(userId);
    res.clearCookie('refreshTokenClient');
    res.status(StatusCodes.OK).json({ loggedOut: true });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  signUp,
  verifyEmail,
  resendVerification,
  signInClient,
  refreshTokenClient,
  signOutClient,
};

