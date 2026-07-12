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
    DECLARE v_order_status_id INT;
    DECLARE v_payment_status_id INT;
    DECLARE v_delivery_status_id INT;
    DECLARE v_txn_id BIGINT;
    DECLARE v_cf_id BIGINT;
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_item_id BIGINT UNSIGNED;
    DECLARE v_variant_id INT UNSIGNED;
    DECLARE v_quantity INT;
    DECLARE v_actual_cost DECIMAL(12,2);
    DECLARE cur CURSOR FOR
        SELECT id, variant_id, quantity, actual_cost_at_sale
          FROM tbl_order_items
         WHERE order_id = p_order_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    SELECT order_type INTO v_order_type FROM tbl_orders WHERE id = p_order_id;
    SELECT id INTO v_order_status_id FROM tbl_order_statuses WHERE status_code = 'delivered' LIMIT 1;
    SELECT id INTO v_payment_status_id FROM tbl_payment_statuses WHERE status_code = 'paid' LIMIT 1;
    SELECT id INTO v_delivery_status_id FROM tbl_delivery_statuses WHERE status_code = 'delivered' LIMIT 1;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_item_id, v_variant_id, v_quantity, v_actual_cost;
        IF done THEN
            LEAVE read_loop;
        END IF;

        IF v_order_type = 'preorder' THEN
            UPDATE tbl_inventory
               SET reserved_stock = GREATEST(reserved_stock - v_quantity, 0),
                   total_sold = total_sold + v_quantity,
                   inventory_value = current_stock * unit_cost,
                   updated_at = CURRENT_TIMESTAMP
             WHERE variant_id = v_variant_id AND warehouse_id = (SELECT id FROM tbl_warehouses WHERE warehouse_code = 'WH001' LIMIT 1);
        ELSE
            UPDATE tbl_inventory
               SET current_stock = GREATEST(current_stock - v_quantity, 0),
                   total_sold = total_sold + v_quantity,
                   inventory_value = current_stock * unit_cost,
                   updated_at = CURRENT_TIMESTAMP
             WHERE variant_id = v_variant_id AND warehouse_id = (SELECT id FROM tbl_warehouses WHERE warehouse_code = 'WH001' LIMIT 1);
        END IF;

        INSERT INTO tbl_inventory_transactions(transaction_code, transaction_type_id, variant_id, warehouse_id, quantity, unit_cost, reference_type, reference_id, notes, created_by)
        SELECT
            CONCAT('INV', LPAD(LAST_INSERT_ID(), 8, '0')),
            t.id,
            v_variant_id,
            (SELECT id FROM tbl_warehouses WHERE warehouse_code = 'WH001' LIMIT 1),
            CASE WHEN v_order_type = 'preorder' THEN -v_quantity ELSE -v_quantity END,
            v_actual_cost,
            'order',
            p_order_id,
            'Order completed',
            'system'
        FROM tbl_inventory_transaction_types t
        WHERE t.transaction_code = 'outbound';
    END LOOP;
    CLOSE cur;

    UPDATE tbl_orders
       SET order_status_id = v_order_status_id,
           payment_status_id = v_payment_status_id,
           delivery_status_id = v_delivery_status_id,
           outstanding_amount = GREATEST(grand_total - paid_amount, 0),
           updated_at = CURRENT_TIMESTAMP
     WHERE id = p_order_id;

    INSERT INTO tbl_income(income_code, source_type, source_id, entry_date, amount, description, created_by)
    SELECT CONCAT('INC', LPAD(LAST_INSERT_ID(), 8, '0')), 'order', p_order_id, CURDATE(), grand_total, 'Order income', 'system'
    FROM tbl_orders
    WHERE id = p_order_id;

    -- Get next IDs before inserting
    SELECT IFNULL(MAX(id), 0) + 1 INTO v_txn_id FROM tbl_financial_transactions;
    SELECT IFNULL(MAX(id), 0) + 1 INTO v_cf_id FROM tbl_cash_flow;

    INSERT INTO tbl_financial_transactions(transaction_code, transaction_type, related_table, related_id, entry_date, amount, description)
    VALUES (CONCAT('TXN', LPAD(v_txn_id, 8, '0')), 'income', 'orders', p_order_id, CURDATE(), (SELECT grand_total FROM tbl_orders WHERE id = p_order_id), 'Order revenue');

    INSERT INTO tbl_cash_flow(cash_flow_code, entry_date, entry_type, amount, currency, source_type, source_id, description)
    VALUES (CONCAT('CF', LPAD(v_cf_id, 8, '0')), CURDATE(), 'inflow', (SELECT grand_total FROM tbl_orders WHERE id = p_order_id), 'BDT', 'orders', p_order_id, 'Order collection');
END`;
    
    await connection.query(procedureSQL);
    console.log('✓ Created fixed procedure');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

fixSP();
