const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Parse .env manually without requiring external dotenv package
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

async function run() {
  loadEnv();
  console.log('--- Connecting to Cloud Database ---');
  
  const host = process.env.DB_HOST;
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'defaultdb';

  if (!host || !user || !password) {
    console.error('Error: Please set DB_HOST, DB_USER, DB_PASSWORD in your .env file first!');
    process.exit(1);
  }

  console.log(`Connecting to ${host}:${port} (${database}) as ${user}...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });

  console.log('✓ Successfully connected to Cloud Database!');
  console.log('Executing database setup script...');

  const sqlFile = path.join(__dirname, 'complete_setup.sql');
  let sql = fs.readFileSync(sqlFile, 'utf8');

  // Replace USE test; with USE <current database>;
  sql = sql.replace(/USE test;/g, `USE \`${database}\`;`);

  await connection.query(sql);

  console.log('\n=========================================================');
  console.log('✓ All tables, views, stored procedures, and admin user created successfully!');
  console.log('✓ Default Admin Login: admin@hazel.com / hazel@admin2024');
  console.log('=========================================================\n');

  await connection.end();
}

run().catch(err => {
  console.error('\nDatabase setup failed:', err.message);
  process.exit(1);
});
