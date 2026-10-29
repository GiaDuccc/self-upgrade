import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import ms from 'ms';
import { authService } from '~/services/authService';
import { env } from '~/config/environment';
import { JwtProvider } from '~/utils/token';

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

const isSecureRequest = (req: Request): boolean => {
  const origin = req.headers.origin || '';
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
    return false;
  }
  return (
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    origin.startsWith('https://') ||
    env.BUILD_MODE === 'production' ||
    process.env.NODE_ENV === 'production'
  );
};

const getCookieOptions = (req: Request) => {
  const isHttps = isSecureRequest(req);

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? ('none' as const) : ('lax' as const),
    path: '/',
    maxAge: ms('14 days'),
  };
};

const getClearCookieOptions = (req: Request) => {
  const isHttps = isSecureRequest(req);

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? ('none' as const) : ('lax' as const),
    path: '/',
  };
};

const signInClient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.signInClient(req.body);

    res.cookie('refreshTokenClient', result.refreshToken, getCookieOptions(req));

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
    let userId = req.jwtDecoded?._id;
    if (!userId) {
      const clientRefreshToken = req.cookies?.refreshTokenClient;
      if (clientRefreshToken) {
        try {
          const decoded = JwtProvider.verifyToken(
            clientRefreshToken,
            env.REFRESH_TOKEN_SECRET_SIGNATURE_CLIENT
          );
          userId = decoded._id;
        } catch {}
      }
    }

    await authService.signOutClient(userId);
    res.clearCookie('refreshTokenClient', getClearCookieOptions(req));
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

