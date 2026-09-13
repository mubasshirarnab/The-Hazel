DELIMITER $$

-- 1. Drop the problematic trigger completely
DROP TRIGGER IF EXISTS trg_inventory_transactions_after_insert$$

-- 2. Update sp_complete_order to generate batch_id before inserting
DROP PROCEDURE IF EXISTS sp_complete_order$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_complete_order` (IN `p_order_id` INT)   
BEGIN
    DECLARE v_order_type VARCHAR(20);
    DECLARE v_order_status_id INT;
    DECLARE v_payment_status_id INT;
    DECLARE v_delivery_status_id INT;
    DECLARE v_order_item_id BIGINT UNSIGNED;
    DECLARE v_variant_id INT UNSIGNED;
    DECLARE v_quantity INT;
    DECLARE v_actual_cost DECIMAL(12,2);
    DECLARE v_transaction_code VARCHAR(20);
    DECLARE v_batch_id INT;
    DECLARE done INT DEFAULT FALSE;
    DECLARE cur CURSOR FOR
        SELECT id, variant_id, quantity, actual_cost
        FROM tbl_order_items
        WHERE order_id = p_order_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    SELECT order_type, order_status_id, payment_status_id, delivery_status_id
    INTO v_order_type, v_order_status_id, v_payment_status_id, v_delivery_status_id
    FROM tbl_orders
    WHERE id = p_order_id;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_order_item_id, v_variant_id, v_quantity, v_actual_cost;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Generate transaction code using sequence
        CALL sp_generate_business_code('inventory_transactions', 'INV', v_transaction_code);

        -- Generate batch_id for outbound transactions (optional, can be NULL)
        -- For outbound, we typically don't create batches, so batch_id remains NULL

        INSERT INTO tbl_inventory_transactions(transaction_code, transaction_type_id, variant_id, warehouse_id, quantity, unit_cost, reference_type, reference_id, notes, created_by, batch_id)
        SELECT
            v_transaction_code,
            t.id,
            v_variant_id,
            (SELECT id FROM tbl_warehouses WHERE warehouse_code = 'WH001' LIMIT 1),
            CASE WHEN v_order_type = 'preorder' THEN -v_quantity ELSE -v_quantity END,
            v_actual_cost,
            'order',
            p_order_id,
            'Order completed',
            'system',
            NULL  -- batch_id is NULL for outbound transactions
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

    -- Generate income code using sequence
    CALL sp_generate_business_code('income', 'INC', v_transaction_code);
    
    INSERT INTO tbl_income(income_code, source_type, source_id, entry_date, amount, description, created_by)
    SELECT v_transaction_code, 'order', p_order_id, CURDATE(), grand_total, 'Order income', 'system'
    FROM tbl_orders
    WHERE id = p_order_id;
END$$

-- 3. Update sp_receive_shipment to generate batch_id before inserting
DROP PROCEDURE IF EXISTS sp_receive_shipment$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_receive_shipment` (IN `p_shipment_id` INT, IN `p_purchase_order_id` INT)   
BEGIN
    DECLARE v_shipment_cost DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_total_qty INT DEFAULT 0;
    DECLARE v_item_id BIGINT UNSIGNED;
    DECLARE v_variant_id INT UNSIGNED;
    DECLARE v_quantity INT;
    DECLARE v_unit_cost DECIMAL(12,2);
    DECLARE v_unit_landed_cost DECIMAL(12,2);
    DECLARE v_received_qty INT;
    DECLARE v_transaction_code VARCHAR(20);
    DECLARE v_batch_id INT;
    DECLARE v_next_batch_id INT;
    DECLARE done INT DEFAULT FALSE;
    DECLARE cur CURSOR FOR
        SELECT id, variant_id, quantity, unit_purchase_price_bdt
        FROM tbl_purchase_order_items
        WHERE purchase_order_id = p_purchase_order_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    SELECT shipping_cost INTO v_shipment_cost FROM tbl_shipments WHERE id = p_shipment_id;
    SELECT SUM(quantity) INTO v_total_qty FROM tbl_purchase_order_items WHERE purchase_order_id = p_purchase_order_id;
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_item_id, v_variant_id, v_quantity, v_unit_cost;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET v_received_qty = v_quantity;
        SET v_unit_landed_cost = v_unit_cost + (CASE WHEN v_total_qty > 0 THEN (v_shipment_cost * v_quantity) / v_total_qty ELSE 0 END);
        UPDATE tbl_purchase_order_items
           SET received_quantity = v_received_qty,
               unit_landed_cost_bdt = v_unit_landed_cost,
               line_total_bdt = v_received_qty * v_unit_cost,
               updated_at = CURRENT_TIMESTAMP
         WHERE id = v_item_id;

        -- Generate batch_id BEFORE inserting into inventory_transactions
        SELECT IFNULL(MAX(id), 0) + 1 INTO v_next_batch_id FROM tbl_inventory_batches;
        INSERT INTO tbl_inventory_batches (
            batch_number, variant_id, warehouse_id, received_quantity, available_quantity, reserved_quantity, sold_quantity, returned_quantity, damaged_quantity,
            landed_cost_per_unit, true_cost_per_unit, batch_status, received_date, created_by
        ) VALUES (
            CONCAT('BAT', LPAD(v_next_batch_id, 8, '0')),
            v_variant_id,
            (SELECT warehouse_id FROM tbl_purchase_orders WHERE id = p_purchase_order_id),
            v_received_qty,
            v_received_qty,
            0,
            0,
            0,
            0,
            v_unit_landed_cost,
            v_unit_landed_cost,
            'received',
            CURDATE(),
            'system'
        );
        SET v_batch_id = LAST_INSERT_ID();

        -- Generate transaction code using sequence
        CALL sp_generate_business_code('inventory_transactions', 'INV', v_transaction_code);

        INSERT INTO tbl_inventory_transactions(transaction_code, transaction_type_id, variant_id, warehouse_id, quantity, unit_cost, reference_type, reference_id, notes, created_by, batch_id)
        SELECT
            v_transaction_code,
            t.id,
            v_variant_id,
            (SELECT warehouse_id FROM tbl_purchase_orders WHERE id = p_purchase_order_id),
            v_received_qty,
            v_unit_landed_cost,
            'purchase_order',
            p_purchase_order_id,
            'Shipment received',
            'system',
            v_batch_id  -- batch_id is set BEFORE inserting
        FROM tbl_inventory_transaction_types t
        WHERE t.transaction_code = 'inbound';

        INSERT INTO tbl_shipment_cost_allocations(shipment_id, variant_id, allocation_amount_bdt, allocation_basis_quantity, created_at)
        VALUES (p_shipment_id, v_variant_id, (CASE WHEN v_total_qty > 0 THEN (v_shipment_cost * v_quantity) / v_total_qty ELSE 0 END), v_quantity, CURRENT_TIMESTAMP);

        UPDATE tbl_inventory
           SET current_stock = current_stock + v_received_qty,
               total_purchased = total_purchased + v_received_qty,
               unit_cost = v_unit_landed_cost,
               inventory_value = (current_stock + v_received_qty) * v_unit_landed_cost,
               updated_at = CURRENT_TIMESTAMP
         WHERE variant_id = v_variant_id AND warehouse_id = (SELECT warehouse_id FROM tbl_purchase_orders WHERE id = p_purchase_order_id);

        UPDATE tbl_product_variants
           SET purchase_price_bdt = v_unit_landed_cost,
               current_cost = v_unit_landed_cost,
               updated_at = CURRENT_TIMESTAMP
         WHERE id = v_variant_id;
    END LOOP;

    CLOSE cur;

    UPDATE tbl_shipments
       SET status_id = (SELECT id FROM tbl_shipment_statuses WHERE status_code = 'arrived' LIMIT 1),
           updated_at = CURRENT_TIMESTAMP
     WHERE id = p_shipment_id;

    UPDATE tbl_purchase_orders
       SET status_id = (SELECT id FROM tbl_purchase_order_statuses WHERE status_code = 'received' LIMIT 1),
           updated_at = CURRENT_TIMESTAMP
     WHERE id = p_purchase_order_id;
END$$

DELIMITER ;
