const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hazel_erp',
  });

  try {
    console.log('Running migration...');
    
    await connection.execute(`
      ALTER TABLE tbl_customers MODIFY COLUMN customer_code varchar(32) NOT NULL
    `);
    console.log('✓ Modified customer_code');
    
    await connection.execute(`
      ALTER TABLE tbl_purchase_orders MODIFY COLUMN purchase_order_number varchar(32) NOT NULL
    `);
    console.log('✓ Modified purchase_order_number');
    
    await connection.execute(`
      ALTER TABLE tbl_shipments MODIFY COLUMN shipment_number varchar(32) NOT NULL
    `);
    console.log('✓ Modified shipment_number');
    
    await connection.execute(`
      ALTER TABLE tbl_expenses MODIFY COLUMN expense_code varchar(32) NOT NULL
    `);
    console.log('✓ Modified expense_code');
    
    await connection.execute(`
      ALTER TABLE tbl_marketing_campaigns MODIFY COLUMN campaign_code varchar(32) NOT NULL
    `);
    console.log('✓ Modified campaign_code');
    
    await connection.execute(`
      ALTER TABLE tbl_cash_flow MODIFY COLUMN cash_flow_code varchar(32) NOT NULL
    `);
    console.log('✓ Modified cash_flow_code');
    
    await connection.execute(`
      ALTER TABLE tbl_stock_reservations MODIFY COLUMN reservation_number varchar(32) NOT NULL
    `);
    console.log('✓ Modified reservation_number');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration();
