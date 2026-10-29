import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '~/config/environment';
import { DEFAULT_USER_PROFILE } from '~/config/settings';
import { disciplineModel } from '~/models/disciplineModel';
import { userModel } from '~/models/userModel';
import ApiError from '~/utils/ApiError';
import { pickUser } from '~/utils/formatters';
import { JwtProvider } from '~/utils/token';

const generateSixDigitCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const EMAIL_FAILED_MESSAGE =
  'Tài khoản đã được tạo nhưng hệ thống chưa gửi được email xác nhận. Vui lòng bấm "Gửi lại mã" sau ít phút!';

const sendVerificationEmail = async (
  email: string,
  verifyCode: string,
  verifyToken: string
): Promise<boolean> => {
  const websiteBaseUrl =
    env.BUILD_MODE === 'production'
      ? env.WEBSITE_DOMAIN_PRODUCTION
      : env.WEBSITE_DOMAIN_DEVELOPMENT;

  const verifyUrl = `${websiteBaseUrl}/verify-email?email=${encodeURIComponent(
    email
  )}&token=${verifyToken}`;

  console.log('====================================================');
  console.log(`[EMAIL VERIFICATION] To: ${email}`);
  console.log(`[OTP CODE]: ${verifyCode}`);
  console.log(`[VERIFY LINK]: ${verifyUrl}`);
  console.log('====================================================');

  const emailHtml = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #FAF7F2; color: #222220; padding: 32px; border-radius: 14px; border: 2px solid #222220;">
      <h2 style="margin: 0 0 12px; color: #222220; font-size: 22px;">Chào mừng đến với Self Upgrade!</h2>
      <p style="color: #5C5A55; font-size: 15px; line-height: 1.6;">
        Cảm ơn bạn đã đăng ký tài khoản rèn luyện kỷ luật cá nhân (<strong>${email}</strong>). Vui lòng sử dụng mã OTP 6 chữ số dưới đây để kích hoạt tài khoản:
      </p>
      <div style="margin: 24px 0; padding: 18px; background: #FFFDF9; border-radius: 10px; text-align: center; letter-spacing: 8px; font-size: 28px; font-weight: 800; color: #222220; border: 2px dashed #222220;">
        ${verifyCode}
      </div>
      <p style="color: #5C5A55; font-size: 14px; line-height: 1.6;">
        Hoặc nhấn trực tiếp vào nút bên dưới để xác nhận ngay:
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 28px; background: #222220; color: #FAF7F2; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 15px;">
          Xác nhận Email ngay
        </a>
      </div>
      <p style="color: #8E8B82; font-size: 12px; margin-top: 24px; border-top: 1px solid #D6D1C7; padding-top: 16px;">
        Mã xác nhận có hiệu lực trong vòng 15 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
      </p>
    </div>
  `;

  const subject = `[Self Upgrade] Mã xác nhận (${verifyCode}) kích hoạt tài khoản của bạn`;

  // 1. Google Apps Script Webhook (HTTPS Cổng 443 - Miễn phí 100%, gửi bằng chính Gmail, không cần mua domain, không bao giờ bị Render chặn)
  if (env.GOOGLE_SCRIPT_MAIL_URL && env.GOOGLE_SCRIPT_MAIL_URL.trim() !== '') {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(env.GOOGLE_SCRIPT_MAIL_URL.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject,
          html: emailHtml,
        }),
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        console.log(`[Google Script Webhook] Đã gửi email xác nhận thành công tới: ${email}`);
        return true;
      }
      console.warn(`[Google Script Webhook Warning] HTTP ${res.status}`);
    } catch (gsError) {
      console.warn('[Google Script Webhook Warning] Lỗi khi gọi Google Script:', gsError);
    }
  }

  // 2. Brevo HTTP API (HTTPS 443). Lưu ý: Brevo hiện tại yêu cầu xác thực tên miền riêng (DKIM/DMARC)
  const brevoApiKey = env.BREVO_API_KEY.trim();
  const brevoSender = (env.BREVO_SENDER_EMAIL || env.SMTP_USER).trim();
  if (brevoApiKey && brevoSender) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Self Upgrade', email: brevoSender },
          to: [{ email }],
          subject,
          htmlContent: emailHtml,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        console.log(`[Brevo API] Đã gửi email xác nhận thành công tới: ${email}`);
        return true;
      }
      console.warn(`[Brevo API Warning] HTTP ${res.status}:`, await res.text());
    } catch (brevoError) {
      console.warn('[Brevo API Warning] Không thể gửi qua Brevo:', brevoError);
    }
  }

  // 2. Resend REST API (HTTPS 443). Lưu ý: với sender onboarding@resend.dev,
  //    Resend CHỈ cho gửi tới email chủ tài khoản. Muốn gửi cho mọi người phải verify domain.
  if (env.RESEND_API_KEY && env.RESEND_API_KEY.trim() !== '') {
    try {
      const resend = new Resend(env.RESEND_API_KEY.trim());
      const { data, error } = await resend.emails.send({
        from: env.ADMIN_SENDER_EMAIL || 'Self Upgrade <onboarding@resend.dev>',
        to: email,
        subject,
        html: emailHtml,
      });

      if (data && !error) {
        console.log(`[Resend API] Đã gửi email xác nhận thành công tới: ${email}`);
        return true;
      }
      console.warn('[Resend API Warning] Resend từ chối gửi:', error?.message || error);
    } catch (resendError) {
      console.warn('[Resend API Warning] Không thể gửi qua Resend:', resendError);
    }
  }

  // 3. Fallback Gmail SMTP (chỉ hoạt động ở Local / Render gói trả phí.
  //    Render Free CHẶN toàn bộ cổng SMTP 25/465/587 -> sẽ timeout sau 7s)
  const smtpUser = env.SMTP_USER.trim();
  const smtpPass = env.SMTP_PASS.replace(/\s+/g, '').trim();

  if (!smtpUser || !smtpPass) {
    console.warn(
      '[Email Warning] Chưa cấu hình SMTP_PASS hoặc RESEND_API_KEY. Vui lòng cấu hình để gửi email!'
    );
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL trực tiếp
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      family: 4, // Bắt buộc dùng IPv4, khắc phục 100% lỗi timeout DNS IPv6 trên Render Linux
      connectionTimeout: 7000, // Timeout 7s, tránh treo request
      greetingTimeout: 5000,
      socketTimeout: 8000,
    } as any);

    await transporter.sendMail({
      from: `"Self Upgrade" <${smtpUser}>`,
      to: email,
      subject: `[Self Upgrade] Mã xác nhận (${verifyCode}) kích hoạt tài khoản của bạn`,
      html: emailHtml,
    });

    console.log(`[Nodemailer] Đã gửi email xác nhận thành công qua Gmail SMTP tới: ${email}`);
    return true;
  } catch (error) {
    console.error('[Nodemailer Error] Không thể gửi email qua Gmail SMTP:', error);
    return false;
  }
};

const signUp = async (reqBody: { email: string; password: string }) => {
  const email = reqBody.email.trim().toLowerCase();
  const existingUser = await userModel.findOneByEmail(email);

  const verifyCode = generateSixDigitCode();
  const verifyToken = crypto.randomUUID();
  const verifyCodeExpires = Date.now() + 15 * 60 * 1000;
  const hashedPassword = bcryptjs.hashSync(reqBody.password, 10);

  if (existingUser) {
    if (existingUser.isVerified) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Email này đã được đăng ký! Vui lòng đăng nhập.'
      );
    }

    const updatedUser = await userModel.update(existingUser._id!, {
      password: hashedPassword,
      verifyCode,
      verifyToken,
      verifyCodeExpires,
    });

    const emailSent = await sendVerificationEmail(email, verifyCode, verifyToken);

    return {
      user: pickUser(updatedUser),
      emailSent,
      devVerifyCode: !emailSent || env.BUILD_MODE === 'dev' ? verifyCode : undefined,
      message: emailSent
        ? 'Tài khoản chưa xác thực đã được cập nhật. Vui lòng kiểm tra email để lấy mã xác nhận!'
        : 'Tài khoản đã tạo thành công! (Do máy chủ chưa gửi được mail, bạn có thể dùng mã kích hoạt trực tiếp bên dưới).',
    };
  }

  const newUserPayload = {
    email,
    password: hashedPassword,
    role: 'client',
    isVerified: false,
    verifyToken,
    verifyCode,
    verifyCodeExpires,
    refreshToken: null,
    isProfileSetup: false,
    profile: { ...DEFAULT_USER_PROFILE },
  };

  const created = await userModel.createNew(newUserPayload);
  const getNewUser = await userModel.findOneById(created.insertedId);

  await disciplineModel.findOrCreateByUserId(created.insertedId);

  const emailSent = await sendVerificationEmail(email, verifyCode, verifyToken);

  return {
    user: pickUser(getNewUser),
    emailSent,
    devVerifyCode: !emailSent || env.BUILD_MODE === 'dev' ? verifyCode : undefined,
    message: emailSent
      ? 'Đăng ký thành công! Vui lòng kiểm tra hộp thư email để nhập mã xác nhận 6 số.'
      : 'Tài khoản đã tạo thành công! (Do máy chủ chưa gửi được mail, bạn có thể dùng mã kích hoạt trực tiếp bên dưới).',
  };
};

const verifyEmail = async (reqBody: {
  email: string;
  code?: string;
  token?: string;
}) => {
  const email = reqBody.email.trim().toLowerCase();
  const user = await userModel.findOneByEmail(email);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tài khoản với email này!');
  }

  if (user.isVerified) {
    return {
      user: pickUser(user),
      message: 'Tài khoản của bạn đã được xác thực trước đó. Bạn có thể đăng nhập ngay!',
    };
  }

  const codeMatch =
    reqBody.code &&
    user.verifyCode &&
    reqBody.code.trim() === user.verifyCode.trim();
  const tokenMatch =
    reqBody.token &&
    user.verifyToken &&
    reqBody.token.trim() === user.verifyToken.trim();

  if (!codeMatch && !tokenMatch) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Mã xác nhận hoặc đường dẫn xác thực không chính xác!'
    );
  }

  if (
    user.verifyCodeExpires &&
    Date.now() > user.verifyCodeExpires &&
    !tokenMatch
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Mã xác nhận đã hết hạn! Vui lòng bấm gửi lại mã mới.'
    );
  }

  const updatedUser = await userModel.update(user._id!, {
    isVerified: true,
    verifyCode: null,
    verifyToken: null,
    verifyCodeExpires: null,
  });

  return {
    user: pickUser(updatedUser),
    message: 'Xác thực email thành công! Hãy đăng nhập để thiết lập thông tin cá nhân.',
  };
};

const resendVerification = async (reqBody: { email: string }) => {
  const email = reqBody.email.trim().toLowerCase();
  const user = await userModel.findOneByEmail(email);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tài khoản với email này!');
  }

  if (user.isVerified) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Tài khoản này đã được xác thực!');
  }

  const verifyCode = generateSixDigitCode();
  const verifyToken = crypto.randomUUID();
  const verifyCodeExpires = Date.now() + 15 * 60 * 1000;

  await userModel.update(user._id!, {
    verifyCode,
    verifyToken,
    verifyCodeExpires,
  });

  const emailSent = await sendVerificationEmail(email, verifyCode, verifyToken);

  return {
    emailSent,
    devVerifyCode: !emailSent || env.BUILD_MODE === 'dev' ? verifyCode : undefined,
    message: emailSent
      ? 'Đã gửi lại mã xác nhận mới tới email của bạn!'
      : 'Đã tạo mã xác nhận mới! (Do máy chủ chưa gửi được mail, bạn có thể dùng mã kích hoạt trực tiếp bên dưới).',
  };
};

const signInClient = async (reqBody: { email: string; password: string }) => {
  const email = reqBody.email.trim().toLowerCase();
  const user = await userModel.findOneByEmail(email);

  if (!user) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Email hoặc mật khẩu không chính xác!'
    );
  }

  const isPasswordValid = bcryptjs.compareSync(reqBody.password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Email hoặc mật khẩu không chính xác!'
    );
  }

  if (!user.isVerified) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Tài khoản chưa được xác nhận email! Vui lòng xác thực email trước khi đăng nhập.'
    );
  }

  const userInfo = {
    _id: user._id!.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = JwtProvider.generateToken(
    userInfo,
    env.ACCESS_TOKEN_SECRET_SIGNATURE_CLIENT,
    env.ACCESS_TOKEN_LIFE
  );

  const refreshToken = JwtProvider.generateToken(
    userInfo,
    env.REFRESH_TOKEN_SECRET_SIGNATURE_CLIENT,
    env.REFRESH_TOKEN_LIFE
  );

  const updatedUser = await userModel.update(user._id!, { refreshToken });

  await disciplineModel.findOrCreateByUserId(user._id!);

  return {
    user: pickUser(updatedUser),
    accessToken,
    refreshToken,
  };
};

const refreshTokenClient = async (clientRefreshToken: string) => {
  if (!clientRefreshToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Không tìm thấy Refresh Token trong cookie!');
  }

  let decoded;
  try {
    decoded = JwtProvider.verifyToken(
      clientRefreshToken,
      env.REFRESH_TOKEN_SECRET_SIGNATURE_CLIENT
    );
  } catch {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Refresh Token đã hết hạn hoặc không hợp lệ! Vui lòng đăng nhập lại.'
    );
  }

  const user = await userModel.findOneById(decoded._id);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tài khoản không tồn tại hoặc đã bị xóa!');
  }

  const userInfo = {
    _id: user._id!.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = JwtProvider.generateToken(
    userInfo,
    env.ACCESS_TOKEN_SECRET_SIGNATURE_CLIENT,
    env.ACCESS_TOKEN_LIFE
  );

  return {
    accessToken,
    user: pickUser(user),
  };
};

const signOutClient = async (userId?: string) => {
  if (userId) {
    await userModel.update(userId, { refreshToken: null });
  }
  return { message: 'Đăng xuất thành công!' };
};

export const authService = {
  signUp,
  verifyEmail,
  resendVerification,
  signInClient,
  refreshTokenClient,
  signOutClient,
};

