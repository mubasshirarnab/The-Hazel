const mysql = require('mysql2/promise');

async function fixOrderNumber() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hazel_erp',
  });

  try {
    console.log('Adding default value to order_number...');
    
    // First, make it nullable to allow updating existing rows
    await connection.execute(`
      ALTER TABLE tbl_orders MODIFY COLUMN order_number varchar(32) NULL
    `);
    console.log('✓ Made order_number nullable');
    
    // Update any existing NULL values
    await connection.execute(`
      UPDATE tbl_orders SET order_number = CONCAT('ORD-', id) WHERE order_number IS NULL
    `);
    console.log('✓ Updated existing NULL values');
    
    // Add back NOT NULL with a default
    await connection.execute(`
      ALTER TABLE tbl_orders MODIFY COLUMN order_number varchar(32) NOT NULL DEFAULT ''
    `);
    console.log('✓ Added NOT NULL with default');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

fixOrderNumber();
