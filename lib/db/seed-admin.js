const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const connectionConfig = process.env.DATABASE_URL
    ? { uri: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hazel_erp',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      };

  const connection = await mysql.createConnection(connectionConfig);

  try {
    const [rows] = await connection.query(
      'SELECT * FROM tbl_users WHERE email = ?',
      ['admin@hazel.com']
    );

    if (rows.length > 0) {
      console.log('Admin user already exists.');
      return;
    }

    // Call stored procedure to generate user code
    await connection.query("CALL sp_generate_business_code('users', 'USR', @user_code)");
    const [result] = await connection.query("SELECT @user_code AS user_code");
    const userCode = result[0]?.user_code || 'USR000001';

    const passwordHash = await bcrypt.hash('hazel@admin2024', 10);

    await connection.query(
      `INSERT INTO tbl_users (user_code, name, email, password_hash, role, is_active, created_by)
       VALUES (?, ?, ?, ?, 'admin', 1, 'system')`,
      [userCode, 'Administrator', 'admin@hazel.com', passwordHash]
    );

    console.log(`Successfully created admin user: ${userCode} (admin@hazel.com / hazel@admin2024)`);
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await connection.end();
  }
}

main();
