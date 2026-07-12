const mysql = require('mysql2/promise');

async function checkOrdersSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hazel_erp',
  });

  try {
    console.log('Checking tbl_orders schema...');
    const [rows] = await connection.query(`
      SHOW CREATE TABLE tbl_orders
    `);
    console.log('Table definition:');
    console.log(rows[0]['Create Table']);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkOrdersSchema();
