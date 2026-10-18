import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { env } from '~/config/environment';
import ApiError from '~/utils/ApiError';
import { JwtProvider } from '~/utils/token';

const isAuthorizedClient = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(
        new ApiError(
          StatusCodes.UNAUTHORIZED,
          'Bạn chưa đăng nhập! Vui lòng đăng nhập để tiếp tục.'
        )
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = JwtProvider.verifyToken(
      token,
      env.ACCESS_TOKEN_SECRET_SIGNATURE_CLIENT
    );

    if (decoded.role !== 'client' && decoded.role !== 'admin') {
      return next(
        new ApiError(
          StatusCodes.FORBIDDEN,
          'Bạn không có quyền truy cập tài nguyên này!'
        )
      );
    }

    req.jwtDecoded = decoded;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('jwt expired')) {
      return next(
        new ApiError(
          StatusCodes.UNAUTHORIZED,
          'Token đã hết hạn! Cần làm mới token.'
        )
      );
    }

    return next(
      new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Phiên đăng nhập không hợp lệ! Vui lòng đăng nhập lại.'
      )
    );
  }
};

export const authMiddleware = {
  isAuthorizedClient,
};
