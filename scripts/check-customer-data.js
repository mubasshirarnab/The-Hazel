const mysql = require('mysql2/promise');

async function checkCustomerData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hazel_erp',
  });

  try {
    console.log('Checking customer data...');
    const [rows] = await connection.query(`
      SELECT v.*, c.address, c.district, c.payment_preference
       FROM vw_customer_analytics v
       INNER JOIN tbl_customers c ON c.id = v.id
       WHERE c.deleted_at IS NULL
       ORDER BY v.lifetime_spend DESC
       LIMIT 5
    `);
    console.log('Sample customer data:');
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkCustomerData();
