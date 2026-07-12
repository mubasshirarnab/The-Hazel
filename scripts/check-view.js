const mysql = require('mysql2/promise');

async function checkView() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hazel_erp',
  });

  try {
    console.log('Checking vw_customer_analytics view...');
    const [rows] = await connection.query(`
      SHOW CREATE VIEW vw_customer_analytics
    `);
    console.log('View definition:');
    console.log(rows[0]['Create View']);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkView();
