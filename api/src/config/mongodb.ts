/* eslint-disable no-console */
import { MongoClient, ServerApiVersion, Db } from 'mongodb';
import { env } from './environment';

let selfUpgradeDatabaseInstance: Db | null = null;

const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export const CONNECT_DB = async (): Promise<void> => {
  await mongoClientInstance.connect();
  selfUpgradeDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME);
  console.log(`Kết nối thành công tới MongoDB Database: ${env.DATABASE_NAME}`);
};

export const CLOSE_DB = async (): Promise<void> => {
  console.log('Đang đóng kết nối MongoDB...');
  await mongoClientInstance.close();
};

export const GET_DB = (): Db => {
  if (!selfUpgradeDatabaseInstance) {
    throw new Error('Must connect to Database first!');
  }
  return selfUpgradeDatabaseInstance;
};

