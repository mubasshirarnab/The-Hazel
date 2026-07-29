import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema';

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'hazel_erp';

// Global singleton to prevent pool re-creation on Next.js hot reloads in dev mode.
// Without this, every HMR cycle creates a new pool, exhausting MySQL's max_connections.
declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined;
}

const poolConnection =
  global.__mysqlPool ??
  mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__mysqlPool = poolConnection;
}

export const db = drizzle(poolConnection, { schema, mode: 'default' });
export { poolConnection };
export default db;
