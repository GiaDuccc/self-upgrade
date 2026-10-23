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
  const { dateKey, mode, changeSignal } = req.body || {};
  console.log(`\n🤖 [AI Coach BE] Nhận request mới | User: ${userId} | Mode: ${mode || 'feedback'} | Date: ${dateKey || 'today'} | Signal: "${changeSignal || ''}"`);

  // 1. Nếu user đã có request AI Coach đang xử lý dở trước đó -> hủy ngay lập tức
  if (userActiveCoachingControllers.has(userId)) {
    console.log(`⚡ [AI Coach BE] Hủy request dở trước đó của user ${userId} do có lượt tích mới!`);
    const prevCtrl = userActiveCoachingControllers.get(userId);
    prevCtrl?.abort();
    userActiveCoachingControllers.delete(userId);
  }

  const currentCtrl = new AbortController();
  userActiveCoachingControllers.set(userId, currentCtrl);

  // 2. Lắng nghe trên res (KHÔNG dùng req.on('close') vì trên Node 20 req.on('close') bắn ngay khi đọc xong body JSON!)
  res.on('close', () => {
    if (!res.writableEnded) {
      console.log(`🛑 [AI Coach BE] Client ngắt kết nối HTTP (abort) | User: ${userId}`);
      currentCtrl.abort();
      if (userActiveCoachingControllers.get(userId) === currentCtrl) {
        userActiveCoachingControllers.delete(userId);
      }
    }
  });

  try {
    const t0 = Date.now();
    const result = await aiCoachService.getCoachingMessage(
      userId,
      req.body,
      currentCtrl.signal
    );

    if (userActiveCoachingControllers.get(userId) === currentCtrl) {
      userActiveCoachingControllers.delete(userId);
    }

    if (currentCtrl.signal.aborted || res.writableEnded) {
      console.log(`🛑 [AI Coach BE] Request cũ đã bị hủy, kết thúc phiên cũ.`);
      if (!res.writableEnded) {
        res.status(StatusCodes.OK).json({ message: '', cancelled: true });
      }
      return;
    }

    const duration = Date.now() - t0;
    if (result?.isTimeout) {
      console.warn(`⏱️ [AI Coach BE] Trả về lỗi Timeout sau ${duration}ms: "${result.message}"`);
    } else if (result?.error) {
      console.warn(`⚠️ [AI Coach BE] Trả về thông báo lỗi sau ${duration}ms: "${result.message}"`);
    } else {
      console.log(`✅ [AI Coach BE] Phản hồi thành công (${duration}ms): "${result?.message?.slice(0, 80)}..."`);
    }
    res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    if (userActiveCoachingControllers.get(userId) === currentCtrl) {
      userActiveCoachingControllers.delete(userId);
    }
    if (currentCtrl.signal.aborted || error?.name === 'AbortError') {
      console.log(`🛑 [AI Coach BE] Request bị hủy an toàn (AbortError).`);
      if (!res.writableEnded) {
        res.status(StatusCodes.OK).json({ message: '', cancelled: true });
      }
      return;
    }
    console.error(`❌ [AI Coach BE] Lỗi xử lý AI Coach:`, error);
    if (!res.writableEnded) {
      const errMsg = error?.message || 'Lỗi máy chủ khi gọi AI Coach';
      res.status(StatusCodes.OK).json({
        message: `⚠️ Lỗi AI Coach: ${errMsg}`,
        error: errMsg,
        isTimeout: false,
      });
    }
  }
};

export const aiCoachController = {
  getCoachingMessage,
};

