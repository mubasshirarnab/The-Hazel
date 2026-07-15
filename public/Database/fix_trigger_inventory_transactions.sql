DELIMITER $$

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS trg_inventory_transactions_after_insert$$

-- Recreate the trigger without updating the same table
-- The batch_id should be set before inserting into tbl_inventory_transactions
CREATE TRIGGER `trg_inventory_transactions_after_insert` AFTER INSERT ON `tbl_inventory_transactions` FOR EACH ROW BEGIN
    DECLARE v_next_id INT;
    -- Only create batch if batch_id is NULL and quantity > 0
    IF NEW.batch_id IS NULL AND NEW.quantity > 0 THEN
        SELECT IFNULL(MAX(id), 0) + 1 INTO v_next_id FROM tbl_inventory_batches;
        INSERT INTO tbl_inventory_batches (
            batch_number, variant_id, warehouse_id, received_quantity, available_quantity, reserved_quantity, sold_quantity, returned_quantity, damaged_quantity,
            landed_cost_per_unit, true_cost_per_unit, batch_status, received_date, created_by
        ) VALUES (
            CONCAT('BAT', LPAD(v_next_id, 8, '0')),
            NEW.variant_id,
            NEW.warehouse_id,
            NEW.quantity,
            NEW.quantity,
            0,
            0,
            0,
            0,
            NEW.unit_cost,
            NEW.unit_cost,
            'received',
            CURDATE(),
            NEW.created_by
        );
        -- Cannot update tbl_inventory_transactions here due to MySQL restriction
        -- The batch_id should be set BEFORE inserting into tbl_inventory_transactions
    END IF;
END$$

DELIMITER ;
