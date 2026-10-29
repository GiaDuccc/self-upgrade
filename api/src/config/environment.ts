import 'dotenv/config';

export const env = {
  APP_HOST: process.env.APP_HOST || 'localhost',
  APP_PORT: Number(process.env.APP_PORT) || 2004,
  LOCAL_DEV_APP_HOST: process.env.APP_HOST || 'localhost',
  LOCAL_DEV_APP_PORT: Number(process.env.APP_PORT) || 2004,

  MONGODB_URI: process.env.MONGODB_URI || '',
  DATABASE_NAME: process.env.DATABASE_NAME || 'Self-upgrade',

  BUILD_MODE: process.env.BUILD_MODE || 'dev',
  AUTHOR: process.env.AUTHOR || 'GiaDuc',

  WEBSITE_DOMAIN_DEVELOPMENT:
    process.env.WEBSITE_DOMAIN_DEVELOPMENT || 'http://localhost:1904',
  WEBSITE_DOMAIN_DEV:
    process.env.WEBSITE_DOMAIN_DEVELOPMENT || 'http://localhost:1904',
  WEBSITE_DOMAIN_PRODUCTION:
    process.env.WEBSITE_DOMAIN_PRODUCTION || 'https://self-upgrade.giaduc.tech',

  GEMINI_API_KEY: (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '').trim(),
  GEMINI_NUTRITION_MODEL:
    process.env.GEMINI_NUTRITION_MODEL || 'gemini-3.5-flash-lite',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || '',
  GOOGLE_SCRIPT_MAIL_URL: process.env.GOOGLE_SCRIPT_MAIL_URL || '',
  ADMIN_SENDER_EMAIL:
    process.env.ADMIN_SENDER_EMAIL || 'Self Upgrade <onboarding@resend.dev>',

  JWT_ACCESS_SECRET_CLIENT:
    process.env.JWT_ACCESS_SECRET_CLIENT || 'default_access_secret_client',
  JWT_REFRESH_SECRET_CLIENT:
    process.env.JWT_REFRESH_SECRET_CLIENT || 'default_refresh_secret_client',
  ACCESS_TOKEN_SECRET_SIGNATURE_CLIENT:
    process.env.JWT_ACCESS_SECRET_CLIENT || 'default_access_secret_client',
  REFRESH_TOKEN_SECRET_SIGNATURE_CLIENT:
    process.env.JWT_REFRESH_SECRET_CLIENT || 'default_refresh_secret_client',
  ACCESS_TOKEN_LIFE: process.env.ACCESS_TOKEN_LIFE || '1d',
  REFRESH_TOKEN_LIFE: process.env.REFRESH_TOKEN_LIFE || '14 days',
};
