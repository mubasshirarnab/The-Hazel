const mysql = require('mysql2/promise');

async function listTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hazel_erp',
  });

  try {
    console.log('Listing all tables...');
    const [rows] = await connection.query(`
      SHOW TABLES
    `);
    console.log('Tables:');
    rows.forEach((row, i) => {
      console.log(`${i + 1}. ${Object.values(row)[0]}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

listTables();
