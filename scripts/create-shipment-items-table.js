const mysql = require('mysql2/promise');

async function createTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hazel_erp',
  });

  try {
    console.log('Creating tbl_shipment_items table...');
    
    await connection.execute(`
      CREATE TABLE tbl_shipment_items (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        shipment_id INT UNSIGNED NOT NULL,
        purchase_order_item_id BIGINT UNSIGNED NOT NULL,
        variant_id INT UNSIGNED NOT NULL,
        quantity_shipped INT NOT NULL DEFAULT 0,
        quantity_received INT NOT NULL DEFAULT 0,
        carton_number VARCHAR(50) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_shipment_items_shipment (shipment_id),
        KEY idx_shipment_items_po_item (purchase_order_item_id),
        KEY idx_shipment_items_variant (variant_id),
        CONSTRAINT fk_shipment_items_shipment FOREIGN KEY (shipment_id) REFERENCES tbl_shipments (id) ON UPDATE CASCADE,
        CONSTRAINT fk_shipment_items_po_item FOREIGN KEY (purchase_order_item_id) REFERENCES tbl_purchase_order_items (id) ON UPDATE CASCADE,
        CONSTRAINT fk_shipment_items_variant FOREIGN KEY (variant_id) REFERENCES tbl_product_variants (id) ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✓ Table created successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createTable();
