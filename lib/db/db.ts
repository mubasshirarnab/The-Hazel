import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema';

// Global singleton to prevent pool re-creation on Next.js hot reloads in dev mode.
// Without this, every HMR cycle creates a new pool, exhausting MySQL's max_connections.
declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined;
}

const getPoolConnection = (): mysql.Pool => {
  const isCloudDb =
    process.env.DB_SSL === 'true' ||
    Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1'));

  const poolOptions: mysql.PoolOptions = process.env.DATABASE_URL
    ? {
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ...(isCloudDb ? { ssl: { rejectUnauthorized: false } } : {}),
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hazel_erp',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
      };

  return mysql.createPool(poolOptions);
};

const poolConnection = global.__mysqlPool ?? getPoolConnection();

if (process.env.NODE_ENV !== 'production') {
  global.__mysqlPool = poolConnection;
}

export const db = drizzle(poolConnection, { schema, mode: 'default' });
export { poolConnection };
export default db;
