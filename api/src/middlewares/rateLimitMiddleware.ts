import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau ít phút!',
  },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: 'Bạn đã thao tác xác thực quá nhanh, vui lòng thử lại sau 1 phút!',
  },
});

