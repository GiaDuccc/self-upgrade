import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { aiCoachService } from '~/services/aiCoachService';

// Quản lý controller hủy cho từng user để chống xếp hàng / ra nhiều câu liên tục
const userActiveCoachingControllers = new Map<string, AbortController>();

const getCoachingMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.jwtDecoded!._id;

  // 1. Nếu user đã có request AI Coach đang xử lý dở trước đó -> hủy ngay lập tức
  if (userActiveCoachingControllers.has(userId)) {
    const prevCtrl = userActiveCoachingControllers.get(userId);
    prevCtrl?.abort();
    userActiveCoachingControllers.delete(userId);
  }

  const currentCtrl = new AbortController();
  userActiveCoachingControllers.set(userId, currentCtrl);

  // 2. Lắng nghe nếu client ngắt kết nối giữa chừng (do frontend abort)
  req.on('close', () => {
    if (!res.writableEnded) {
      currentCtrl.abort();
      userActiveCoachingControllers.delete(userId);
    }
  });

  try {
    const result = await aiCoachService.getCoachingMessage(
      userId,
      req.body,
      currentCtrl.signal
    );

    if (currentCtrl.signal.aborted || req.destroyed) {
      return;
    }

    userActiveCoachingControllers.delete(userId);
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    userActiveCoachingControllers.delete(userId);
    if (currentCtrl.signal.aborted || error?.name === 'AbortError') {
      return;
    }
    next(error);
  }
};

export const aiCoachController = {
  getCoachingMessage,
};

