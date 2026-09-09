const mysql = require('mysql2/promise');

async function fixSP() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hazel_erp',
  });

  try {
    console.log('Fixing sp_complete_order procedure...');
    
    // Drop the old procedure
    await connection.query(`DROP PROCEDURE IF EXISTS sp_complete_order`);
    console.log('✓ Dropped old procedure');
    
    // Create the fixed procedure
    const procedureSQL = `
CREATE PROCEDURE sp_complete_order(IN p_order_id INT)
BEGIN
    DECLARE v_order_type VARCHAR(20);
    DECLARE v_order_status_id INT DEFAULT 5;
    DECLARE v_payment_status_id INT DEFAULT 3;
    DECLARE v_delivery_status_id INT DEFAULT 3;

    SELECT order_type INTO v_order_type FROM tbl_orders WHERE id = p_order_id LIMIT 1;
    SELECT id INTO v_order_status_id FROM tbl_order_statuses WHERE status_code = 'delivered' LIMIT 1;
    SELECT id INTO v_payment_status_id FROM tbl_payment_statuses WHERE status_code = 'paid' LIMIT 1;
    SELECT id INTO v_delivery_status_id FROM tbl_delivery_statuses WHERE status_code = 'delivered' LIMIT 1;

    -- If preorder: deduct current_stock, release reservations and update total_sold
    IF v_order_type = 'preorder' THEN
        UPDATE tbl_inventory i
        INNER JOIN tbl_order_items oi ON oi.variant_id = i.variant_id
        SET i.current_stock = GREATEST(0, i.current_stock - oi.quantity),
            i.total_sold    = i.total_sold + oi.quantity,
            i.inventory_value = GREATEST(0, i.current_stock - oi.quantity) * i.unit_cost,
            i.updated_at    = CURRENT_TIMESTAMP
        WHERE oi.order_id = p_order_id;

        UPDATE tbl_stock_reservations
           SET reservation_status = 'released',
               released_quantity  = reserved_quantity,
               released_date      = NOW()
         WHERE order_id = p_order_id AND reservation_status = 'reserved';
    END IF;

    -- Update order status, payment status, delivery status and amounts
    UPDATE tbl_orders
       SET order_status_id    = COALESCE(v_order_status_id, 5),
           payment_status_id  = COALESCE(v_payment_status_id, 3),
           delivery_status_id = COALESCE(v_delivery_status_id, 3),
           paid_amount        = grand_total,
           outstanding_amount = 0.00,
           updated_at         = CURRENT_TIMESTAMP
     WHERE id = p_order_id;
END`;
    
    await connection.query(procedureSQL);
    console.log('✓ Created fixed procedure sp_complete_order');

    // Also fix sp_adjust_inventory
    console.log('Fixing sp_adjust_inventory procedure...');
    await connection.query(`DROP PROCEDURE IF EXISTS sp_adjust_inventory`);
    const adjustSQL = `
CREATE PROCEDURE sp_adjust_inventory(
    IN p_variant_id INT,
    IN p_warehouse_id INT,
    IN p_adjustment_type VARCHAR(20),
    IN p_quantity INT,
    IN p_reason VARCHAR(255),
    IN p_created_by VARCHAR(100)
)
BEGIN
    DECLARE v_current_stock INT DEFAULT 0;
    DECLARE v_new_stock INT DEFAULT 0;
    DECLARE v_unit_cost DECIMAL(12,2) DEFAULT 0.00;

    SELECT COALESCE(current_stock, 0), COALESCE(unit_cost, 0.00)
      INTO v_current_stock, v_unit_cost
      FROM tbl_inventory
     WHERE variant_id = p_variant_id AND warehouse_id = p_warehouse_id
     LIMIT 1;

    IF p_adjustment_type = 'increase' THEN
        SET v_new_stock = v_current_stock + p_quantity;
    ELSE
        SET v_new_stock = GREATEST(0, v_current_stock - p_quantity);
    END IF;

    INSERT INTO tbl_inventory (
      variant_id, warehouse_id, current_stock, reserved_stock,
      total_purchased, total_sold, unit_cost, inventory_value, created_by
    ) VALUES (
      p_variant_id, p_warehouse_id, v_new_stock, 0,
      0, 0, v_unit_cost, v_new_stock * v_unit_cost, p_created_by
    )
    ON DUPLICATE KEY UPDATE
      current_stock = v_new_stock,
      inventory_value = v_new_stock * unit_cost,
      updated_at = CURRENT_TIMESTAMP,
      updated_by = p_created_by;
END`;
    await connection.query(adjustSQL);
    console.log('✓ Created fixed procedure sp_adjust_inventory');
    
    console.log('All procedures fixed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

fixSP();
