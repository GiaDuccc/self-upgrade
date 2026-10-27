import exitHook from 'async-exit-hook';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { corsOptions } from '~/config/cors';
import { env } from '~/config/environment';
import { CLOSE_DB, CONNECT_DB } from '~/config/mongodb';
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware';
import { apiLimiter } from '~/middlewares/rateLimitMiddleware';
import { APIs_V1 } from '~/routes/v1';

const START_SERVER = () => {
  const app = express();

  // Bật trust proxy cho môi trường chạy sau reverse proxy (như Render, Nginx)
  app.set('trust proxy', 1);

  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.use(cookieParser());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '5mb' }));
  app.use(apiLimiter);

  app.use('/v1', APIs_V1);

  app.use(errorHandlingMiddleware);

  const port = Number(process.env.PORT) || Number(env.LOCAL_DEV_APP_PORT) || 2004;

  const server = app.listen(port, () => {
    console.log(
      `3. [Self Upgrade API] Hi ${env.AUTHOR}, Back-end Server is running successfully on port ${port} (/v1)`
    );
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Cổng ${port} đang bận, đang thử kết nối lại sau 500ms...`);
      setTimeout(() => {
        server.close();
        server.listen(port);
      }, 500);
    } else {
      console.error('Server error:', err);
    }
  });

  exitHook(() => {
    console.log('4. Server is shutting down...');
    server.close();
    CLOSE_DB();
  });
};

(async () => {
  try {
    console.log('1. Connecting to MongoDB Cloud Atlas...');
    await CONNECT_DB();
    console.log('2. Connected to MongoDB Cloud Atlas!');
    START_SERVER();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
})();

