const mysql = require('mysql2/promise');

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hazel_erp',
  });

  try {
    const [rows] = await connection.execute(`
      SHOW CREATE TABLE tbl_products
    `);
    console.log('Current tbl_products schema:');
    console.log(rows[0]['Create Table']);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkSchema();
