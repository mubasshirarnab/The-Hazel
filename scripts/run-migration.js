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
      ALTER TABLE tbl_products MODIFY COLUMN product_code varchar(32) NOT NULL
    `);
    console.log('✓ Modified product_code');
    
    await connection.execute(`
      ALTER TABLE tbl_products MODIFY COLUMN sku varchar(100) NOT NULL
    `);
    console.log('✓ Modified sku');
    
    await connection.execute(`
      ALTER TABLE tbl_product_variants MODIFY COLUMN variant_code varchar(32) NOT NULL
    `);
    console.log('✓ Modified variant_code');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration();
