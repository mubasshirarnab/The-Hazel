const mysql = require('mysql2/promise');

async function checkSP() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hazel_erp',
  });

  try {
    console.log('Checking sp_receive_shipment procedure...');
    const [rows] = await connection.query(`
      SHOW CREATE PROCEDURE sp_receive_shipment
    `);
    console.log('Procedure definition:');
    console.log(rows[0]['Create Procedure']);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkSP();
