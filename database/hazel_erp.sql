-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 12, 2026 at 05:13 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hazel_erp`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_adjust_inventory` (IN `p_variant_id` INT, IN `p_warehouse_id` INT, IN `p_adjustment_type` VARCHAR(20), IN `p_quantity` INT, IN `p_reason` VARCHAR(255), IN `p_created_by` VARCHAR(100))   BEGIN
    DECLARE v_adjustment_code VARCHAR(32);
    DECLARE v_current_stock INT;
    DECLARE v_new_stock INT;

    CALL sp_generate_business_code('inventory_adjustments', 'ADJ', @generated_code);
    SET v_adjustment_code = @generated_code;

    SELECT COALESCE(current_stock, 0) INTO v_current_stock FROM tbl_inventory WHERE variant_id = p_variant_id AND warehouse_id = p_warehouse_id;

    IF p_adjustment_type = 'increase' THEN
        SET v_new_stock = v_current_stock + p_quantity;
    ELSE
        SET v_new_stock = v_current_stock - p_quantity;
    END IF;

    INSERT INTO tbl_inventory_adjustments(adjustment_code, variant_id, warehouse_id, adjustment_type, quantity, reason, created_by)
    VALUES (v_adjustment_code, p_variant_id, p_warehouse_id, p_adjustment_type, p_quantity, p_reason, p_created_by);

    INSERT INTO tbl_inventory (variant_id, warehouse_id, current_stock, reserved_stock, returned_stock, damaged_stock, total_purchased, total_sold, unit_cost, inventory_value, created_by)
    VALUES (p_variant_id, p_warehouse_id, 0, 0, 0, 0, 0, 0, 0.00, 0.00, p_created_by)
    ON DUPLICATE KEY UPDATE id = id;

    UPDATE tbl_inventory
       SET current_stock = v_new_stock,
           updated_at = CURRENT_TIMESTAMP,
           updated_by = p_created_by
     WHERE variant_id = p_variant_id AND warehouse_id = p_warehouse_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_allocate_product_costs` (IN `p_expense_id` BIGINT, IN `p_allocation_method_code` VARCHAR(50), IN `p_target_type` VARCHAR(30), IN `p_target_id` INT, IN `p_quantity_basis` DECIMAL(14,2), IN `p_value_basis` DECIMAL(14,2), IN `p_allocation_amount` DECIMAL(14,2), IN `p_notes` TEXT)   BEGIN
    DECLARE v_method_id INT UNSIGNED;
    SELECT id INTO v_method_id FROM tbl_allocation_methods WHERE method_code = p_allocation_method_code LIMIT 1;

    INSERT INTO tbl_expense_allocations(
        expense_id, allocation_method_id, target_type, target_id, quantity_basis, value_basis, allocation_amount, notes
    ) VALUES (
        p_expense_id, v_method_id, p_target_type, p_target_id, p_quantity_basis, p_value_basis, p_allocation_amount, p_notes
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_cancel_order` (IN `p_order_id` INT)   BEGIN
    DECLARE v_order_type VARCHAR(20);
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_variant_id INT UNSIGNED;
    DECLARE v_quantity INT;
    DECLARE cur CURSOR FOR
        SELECT variant_id, quantity
          FROM tbl_order_items
         WHERE order_id = p_order_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    SELECT order_type INTO v_order_type FROM tbl_orders WHERE id = p_order_id;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_variant_id, v_quantity;
        IF done THEN
            LEAVE read_loop;
        END IF;

        IF v_order_type = 'preorder' THEN
            UPDATE tbl_inventory
               SET reserved_stock = GREATEST(reserved_stock - v_quantity, 0),
                   updated_at = CURRENT_TIMESTAMP
             WHERE variant_id = v_variant_id AND warehouse_id = (SELECT id FROM tbl_warehouses WHERE warehouse_code = 'WH001' LIMIT 1);
        ELSE
            UPDATE tbl_inventory
               SET current_stock = current_stock + v_quantity,
                   updated_at = CURRENT_TIMESTAMP
             WHERE variant_id = v_variant_id AND warehouse_id = (SELECT id FROM tbl_warehouses WHERE warehouse_code = 'WH001' LIMIT 1);
        END IF;
    END LOOP;
    CLOSE cur;

    UPDATE tbl_orders
       SET order_status_id = (SELECT id FROM tbl_order_statuses WHERE status_code = 'cancelled' LIMIT 1),
           payment_status_id = (SELECT id FROM tbl_payment_statuses WHERE status_code = 'refunded' LIMIT 1),
           updated_at = CURRENT_TIMESTAMP
     WHERE id = p_order_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_complete_order` (IN `p_order_id` INT)   BEGIN
    DECLARE v_order_type VARCHAR(20);
    DECLARE v_order_status_id INT;
    DECLARE v_payment_status_id INT;
    DECLARE v_delivery_status_id INT;
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

    INSERT INTO tbl_financial_transactions(transaction_code, transaction_type, related_table, related_id, entry_date, amount, description)
    VALUES (CONCAT('TXN', LPAD((SELECT IFNULL(MAX(id), 0) + 1 FROM tbl_financial_transactions), 8, '0')), 'income', 'orders', p_order_id, CURDATE(), (SELECT grand_total FROM tbl_orders WHERE id = p_order_id), 'Order revenue');

    INSERT INTO tbl_cash_flow(cash_flow_code, entry_date, entry_type, amount, currency, source_type, source_id, description)
    VALUES (CONCAT('CF', LPAD((SELECT IFNULL(MAX(id), 0) + 1 FROM tbl_cash_flow), 8, '0')), CURDATE(), 'inflow', (SELECT grand_total FROM tbl_orders WHERE id = p_order_id), 'BDT', 'orders', p_order_id, 'Order collection');
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_create_order` (IN `p_customer_id` INT, IN `p_order_type` VARCHAR(20), IN `p_order_date` DATE, IN `p_items_json` JSON, IN `p_notes` TEXT, OUT `p_order_id` INT, OUT `p_order_number` VARCHAR(32))   BEGIN
    DECLARE v_order_status_id INT;
    DECLARE v_payment_status_id INT;
    DECLARE v_delivery_status_id INT;
    DECLARE v_refund_status_id INT;
    DECLARE v_return_status_id INT;
    DECLARE v_subtotal DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_discount_total DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_grand_total DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_item_count INT DEFAULT 0;
    DECLARE v_item_idx INT DEFAULT 0;
    DECLARE v_variant_id INT;
    DECLARE v_quantity INT;
    DECLARE v_selling_price DECIMAL(12,2);
    DECLARE v_discount_amount DECIMAL(12,2);
    DECLARE v_reserved_qty INT;
    DECLARE v_current_cost DECIMAL(12,2);

    SELECT id INTO v_order_status_id FROM tbl_order_statuses WHERE status_code = 'pending' LIMIT 1;
    SELECT id INTO v_payment_status_id FROM tbl_payment_statuses WHERE status_code = 'unpaid' LIMIT 1;
    SELECT id INTO v_delivery_status_id FROM tbl_delivery_statuses WHERE status_code = 'pending' LIMIT 1;
    SELECT id INTO v_refund_status_id FROM tbl_refund_statuses WHERE status_code = 'none' LIMIT 1;
    SELECT id INTO v_return_status_id FROM tbl_return_statuses WHERE status_code = 'none' LIMIT 1;

    INSERT INTO tbl_orders(
        customer_id, order_date, order_type, order_status_id, payment_status_id, delivery_status_id,
        refund_status_id, return_status_id, subtotal, discount_total, shipping_amount, grand_total,
        paid_amount, outstanding_amount, currency, notes, created_by
    ) VALUES (
        p_customer_id, p_order_date, p_order_type, v_order_status_id, v_payment_status_id, v_delivery_status_id,
        v_refund_status_id, v_return_status_id, 0.00, 0.00, 0.00, 0.00,
        0.00, 0.00, 'BDT', p_notes, 'system'
    );

    SET p_order_id = LAST_INSERT_ID();
    CALL sp_generate_business_code('orders', 'ORD', @generated_code);
    SET p_order_number = @generated_code;
    UPDATE tbl_orders SET order_number = p_order_number WHERE id = p_order_id;

    SET v_item_count = JSON_LENGTH(p_items_json);
    SET v_item_idx = 0;

    WHILE v_item_idx < v_item_count DO
        SET v_variant_id = CAST(JSON_EXTRACT(p_items_json, CONCAT('$[', v_item_idx, '].variant_id')) AS UNSIGNED);
        SET v_quantity = CAST(JSON_EXTRACT(p_items_json, CONCAT('$[', v_item_idx, '].quantity')) AS UNSIGNED);
        SET v_selling_price = CAST(JSON_EXTRACT(p_items_json, CONCAT('$[', v_item_idx, '].selling_price')) AS DECIMAL(12,2));
        SET v_discount_amount = COALESCE(CAST(JSON_EXTRACT(p_items_json, CONCAT('$[', v_item_idx, '].discount_amount')) AS DECIMAL(12,2)), 0.00);
        SET v_reserved_qty = CASE WHEN p_order_type = 'preorder' THEN v_quantity ELSE 0 END;

        SELECT COALESCE(current_cost, 0.00) INTO v_current_cost
          FROM tbl_product_variants
         WHERE id = v_variant_id;

        INSERT INTO tbl_order_items(order_id, variant_id, quantity, reserved_quantity, selling_price, discount_amount, actual_cost_at_sale)
        VALUES (p_order_id, v_variant_id, v_quantity, v_reserved_qty, v_selling_price, v_discount_amount, v_current_cost * v_quantity);

        SET v_item_idx = v_item_idx + 1;
    END WHILE;

    SELECT SUM((selling_price - discount_amount) * quantity)
      INTO v_subtotal
      FROM tbl_order_items
     WHERE order_id = p_order_id;

    SET v_discount_total = (SELECT COALESCE(SUM(discount_amount * quantity), 0.00) FROM tbl_order_items WHERE order_id = p_order_id);
    SET v_grand_total = v_subtotal - v_discount_total;

    UPDATE tbl_orders
       SET subtotal = v_subtotal,
           discount_total = v_discount_total,
           grand_total = v_grand_total,
           outstanding_amount = v_grand_total - paid_amount
     WHERE id = p_order_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_generate_business_code` (IN `p_entity_name` VARCHAR(64), IN `p_prefix` VARCHAR(16), OUT `p_code` VARCHAR(64))   BEGIN
    DECLARE v_next_number INT UNSIGNED DEFAULT 0;
    DECLARE v_digit_length TINYINT UNSIGNED DEFAULT 6;

    START TRANSACTION;
    INSERT INTO tbl_sequences(entity_name, prefix, last_number, digit_length)
    VALUES (p_entity_name, p_prefix, 0, v_digit_length)
    ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

    SELECT last_number + 1, digit_length
      INTO v_next_number, v_digit_length
      FROM tbl_sequences
     WHERE entity_name = p_entity_name
     FOR UPDATE;

    UPDATE tbl_sequences
       SET last_number = v_next_number,
           updated_at = CURRENT_TIMESTAMP
     WHERE entity_name = p_entity_name;

    COMMIT;

    SET p_code = CONCAT(p_prefix, LPAD(v_next_number, v_digit_length, '0'));
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_receive_shipment` (IN `p_shipment_id` INT, IN `p_purchase_order_id` INT)   BEGIN
    DECLARE v_shipment_cost DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_total_qty INT DEFAULT 0;
    DECLARE v_item_id BIGINT UNSIGNED;
    DECLARE v_variant_id INT UNSIGNED;
    DECLARE v_quantity INT;
    DECLARE v_unit_cost DECIMAL(12,2);
    DECLARE v_unit_landed_cost DECIMAL(12,2);
    DECLARE v_received_qty INT;
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
               line_total_bdt = v_received_qty * v_unit_landed_cost,
               updated_at = CURRENT_TIMESTAMP
         WHERE id = v_item_id;

        INSERT INTO tbl_inventory_transactions(transaction_code, transaction_type_id, variant_id, warehouse_id, quantity, unit_cost, reference_type, reference_id, notes, created_by)
        SELECT
            CONCAT('INV', LPAD(LAST_INSERT_ID(), 8, '0')),
            t.id,
            v_variant_id,
            (SELECT warehouse_id FROM tbl_purchase_orders WHERE id = p_purchase_order_id),
            v_received_qty,
            v_unit_landed_cost,
            'purchase_order',
            p_purchase_order_id,
            'Shipment received',
            'system'
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_refresh_profit_loss` ()   BEGIN
    INSERT INTO tbl_profit_loss(period_start, period_end, revenue, cogs, gross_profit, expenses, net_profit)
    VALUES (
        DATE_FORMAT(CURDATE(), '%Y-%m-01'),
        LAST_DAY(CURDATE()),
        (SELECT COALESCE(SUM(amount), 0.00) FROM tbl_income WHERE entry_date BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE())),
        (SELECT COALESCE(SUM(amount), 0.00) FROM tbl_expenses WHERE expense_date BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE())),
        (SELECT COALESCE(SUM(amount), 0.00) FROM tbl_income WHERE entry_date BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE())) - (SELECT COALESCE(SUM(amount), 0.00) FROM tbl_expenses WHERE expense_date BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE())),
        (SELECT COALESCE(SUM(amount), 0.00) FROM tbl_expenses WHERE expense_date BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE())),
        (SELECT COALESCE(SUM(amount), 0.00) FROM tbl_income WHERE entry_date BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE())) - (SELECT COALESCE(SUM(amount), 0.00) FROM tbl_expenses WHERE expense_date BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE()))
    )
    ON DUPLICATE KEY UPDATE
        revenue = VALUES(revenue),
        cogs = VALUES(cogs),
        gross_profit = VALUES(gross_profit),
        expenses = VALUES(expenses),
        net_profit = VALUES(net_profit),
        updated_at = CURRENT_TIMESTAMP;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_return_order` (IN `p_order_id` INT, IN `p_return_reason` VARCHAR(255))   BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_variant_id INT UNSIGNED;
    DECLARE v_quantity INT;
    DECLARE cur CURSOR FOR
        SELECT variant_id, quantity
          FROM tbl_order_items
         WHERE order_id = p_order_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_variant_id, v_quantity;
        IF done THEN
            LEAVE read_loop;
        END IF;

        UPDATE tbl_inventory
           SET current_stock = current_stock + v_quantity,
               returned_stock = returned_stock + v_quantity,
               updated_at = CURRENT_TIMESTAMP
         WHERE variant_id = v_variant_id AND warehouse_id = (SELECT id FROM tbl_warehouses WHERE warehouse_code = 'WH001' LIMIT 1);
    END LOOP;
    CLOSE cur;

    UPDATE tbl_orders
       SET return_status_id = (SELECT id FROM tbl_return_statuses WHERE status_code = 'completed' LIMIT 1),
           refund_status_id = (SELECT id FROM tbl_refund_statuses WHERE status_code = 'completed' LIMIT 1),
           updated_at = CURRENT_TIMESTAMP
     WHERE id = p_order_id;

    INSERT INTO tbl_order_returns(return_code, order_id, return_date, return_reason, return_status_id, total_refund_amount, notes)
    VALUES (
        CONCAT('RTN', LPAD((SELECT IFNULL(MAX(id), 0) + 1 FROM tbl_order_returns), 8, '0')),
        p_order_id,
        CURDATE(),
        p_return_reason,
        (SELECT id FROM tbl_return_statuses WHERE status_code = 'completed' LIMIT 1),
        (SELECT grand_total FROM tbl_orders WHERE id = p_order_id),
        'Returned goods processed'
    );
END$$

--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_calculate_true_product_cost` (`p_product_id` INT) RETURNS DECIMAL(14,2) READS SQL DATA BEGIN
    DECLARE v_purchase DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_import DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_shipping DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_photoshoot DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_advertising DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_pr DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_packaging DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_misc DECIMAL(14,2) DEFAULT 0.00;

    SELECT COALESCE(SUM(CASE WHEN expense_type = 'Product Purchase' THEN ea.allocation_amount ELSE 0 END), 0.00)
      INTO v_purchase
      FROM tbl_expense_allocations ea
      JOIN tbl_expenses e ON e.id = ea.expense_id
     WHERE ea.target_type = 'product' AND ea.target_id = p_product_id;

    SELECT COALESCE(SUM(CASE WHEN expense_type = 'China Delivery' THEN ea.allocation_amount ELSE 0 END), 0.00)
      INTO v_import
      FROM tbl_expense_allocations ea
      JOIN tbl_expenses e ON e.id = ea.expense_id
     WHERE ea.target_type = 'product' AND ea.target_id = p_product_id;

    SELECT COALESCE(SUM(CASE WHEN expense_type = 'International Shipping' THEN ea.allocation_amount ELSE 0 END), 0.00)
      INTO v_shipping
      FROM tbl_expense_allocations ea
      JOIN tbl_expenses e ON e.id = ea.expense_id
     WHERE ea.target_type = 'product' AND ea.target_id = p_product_id;

    SELECT COALESCE(SUM(CASE WHEN expense_type = 'Photoshoot' THEN ea.allocation_amount ELSE 0 END), 0.00)
      INTO v_photoshoot
      FROM tbl_expense_allocations ea
      JOIN tbl_expenses e ON e.id = ea.expense_id
     WHERE ea.target_type = 'product' AND ea.target_id = p_product_id;

    SELECT COALESCE(SUM(CASE WHEN expense_type IN ('Advertising','Facebook Ads','Instagram Ads','Influencer Marketing') THEN ea.allocation_amount ELSE 0 END), 0.00)
      INTO v_advertising
      FROM tbl_expense_allocations ea
      JOIN tbl_expenses e ON e.id = ea.expense_id
     WHERE ea.target_type = 'product' AND ea.target_id = p_product_id;

    SELECT COALESCE(SUM(CASE WHEN expense_type = 'PR' THEN ea.allocation_amount ELSE 0 END), 0.00)
      INTO v_pr
      FROM tbl_expense_allocations ea
      JOIN tbl_expenses e ON e.id = ea.expense_id
     WHERE ea.target_type = 'product' AND ea.target_id = p_product_id;

    SELECT COALESCE(SUM(CASE WHEN expense_type = 'Packaging' THEN ea.allocation_amount ELSE 0 END), 0.00)
      INTO v_packaging
      FROM tbl_expense_allocations ea
      JOIN tbl_expenses e ON e.id = ea.expense_id
     WHERE ea.target_type = 'product' AND ea.target_id = p_product_id;

    SELECT COALESCE(SUM(CASE WHEN expense_type = 'Miscellaneous' THEN ea.allocation_amount ELSE 0 END), 0.00)
      INTO v_misc
      FROM tbl_expense_allocations ea
      JOIN tbl_expenses e ON e.id = ea.expense_id
     WHERE ea.target_type = 'product' AND ea.target_id = p_product_id;

    RETURN v_purchase + v_import + v_shipping + v_photoshoot + v_advertising + v_pr + v_packaging + v_misc;
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `fn_get_available_stock` (`p_variant_id` INT, `p_warehouse_id` INT) RETURNS INT(11) READS SQL DATA BEGIN
    DECLARE v_available INT DEFAULT 0;
    SELECT COALESCE(current_stock - reserved_stock, 0)
      INTO v_available
      FROM tbl_inventory
     WHERE variant_id = p_variant_id AND warehouse_id = p_warehouse_id;
    RETURN v_available;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_allocation_methods`
--

CREATE TABLE `tbl_allocation_methods` (
  `id` int(10) UNSIGNED NOT NULL,
  `method_code` varchar(50) NOT NULL,
  `method_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_allocation_methods`
--

INSERT INTO `tbl_allocation_methods` (`id`, `method_code`, `method_name`, `is_active`) VALUES
(1, 'equal_distribution', 'Equal Distribution', 1),
(2, 'quantity_based', 'Quantity-Based', 1),
(3, 'purchase_value_based', 'Purchase Value-Based', 1),
(4, 'manual_allocation', 'Manual Allocation', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_cash_flow`
--

CREATE TABLE `tbl_cash_flow` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cash_flow_code` varchar(32) NOT NULL,
  `entry_date` date NOT NULL,
  `entry_type` varchar(20) NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `currency` char(3) NOT NULL DEFAULT 'BDT',
  `source_type` varchar(50) DEFAULT NULL,
  `source_id` int(10) UNSIGNED DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_categories`
--

CREATE TABLE `tbl_categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `category_code` varchar(50) NOT NULL,
  `category_name` varchar(150) NOT NULL,
  `parent_category_id` int(10) UNSIGNED DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_collections`
--

CREATE TABLE `tbl_collections` (
  `id` int(10) UNSIGNED NOT NULL,
  `collection_code` varchar(32) NOT NULL,
  `collection_name` varchar(150) NOT NULL,
  `collection_type_id` int(10) UNSIGNED DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_collection_products`
--

CREATE TABLE `tbl_collection_products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `collection_id` int(10) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_collection_types`
--

CREATE TABLE `tbl_collection_types` (
  `id` int(10) UNSIGNED NOT NULL,
  `type_code` varchar(50) NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_collection_types`
--

INSERT INTO `tbl_collection_types` (`id`, `type_code`, `type_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'seasonal', 'Seasonal', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11'),
(2, 'premium', 'Premium', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11'),
(3, 'occasion', 'Occasion', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_cost_components`
--

CREATE TABLE `tbl_cost_components` (
  `id` int(10) UNSIGNED NOT NULL,
  `component_code` varchar(50) NOT NULL,
  `component_name` varchar(150) NOT NULL,
  `component_group` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_cost_components`
--

INSERT INTO `tbl_cost_components` (`id`, `component_code`, `component_name`, `component_group`, `is_active`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 'purchase', 'Purchase', 'purchase', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11', NULL, NULL),
(2, 'import', 'Import', 'import', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11', NULL, NULL),
(3, 'shipping', 'Shipping', 'shipping', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11', NULL, NULL),
(4, 'packaging', 'Packaging', 'packaging', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11', NULL, NULL),
(5, 'photoshoot', 'Photoshoot', 'marketing', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11', NULL, NULL),
(6, 'advertising', 'Advertising', 'marketing', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11', NULL, NULL),
(7, 'facebook_ads', 'Facebook Ads', 'marketing', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11', NULL, NULL),
(8, 'instagram_ads', 'Instagram Ads', 'marketing', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11', NULL, NULL),
(9, 'pr', 'PR', 'marketing', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11', NULL, NULL),
(10, 'influencer', 'Influencer', 'marketing', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11', NULL, NULL),
(11, 'miscellaneous', 'Miscellaneous', 'miscellaneous', 1, '2026-07-12 21:10:11', '2026-07-12 21:10:11', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_couriers`
--

CREATE TABLE `tbl_couriers` (
  `id` int(10) UNSIGNED NOT NULL,
  `courier_code` varchar(50) NOT NULL,
  `courier_name` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_couriers`
--

INSERT INTO `tbl_couriers` (`id`, `courier_code`, `courier_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'pathao', 'Pathao', 1, '2026-07-12 21:10:12', '2026-07-12 21:10:12');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_courier_rates`
--

CREATE TABLE `tbl_courier_rates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `courier_id` int(10) UNSIGNED NOT NULL,
  `zone_code` varchar(50) NOT NULL,
  `base_rate` decimal(12,2) NOT NULL DEFAULT 0.00,
  `per_kg_rate` decimal(12,2) NOT NULL DEFAULT 0.00,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_courier_rates`
--

INSERT INTO `tbl_courier_rates` (`id`, `courier_id`, `zone_code`, `base_rate`, `per_kg_rate`, `effective_from`, `effective_to`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'default', 40.00, 20.00, '2026-01-01', NULL, 1, '2026-07-12 21:10:12', '2026-07-12 21:10:12');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_customers`
--

CREATE TABLE `tbl_customers` (
  `id` int(10) UNSIGNED NOT NULL,
  `customer_code` varchar(32) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `facebook_name` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `district` varchar(150) DEFAULT NULL,
  `payment_preference` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `tbl_customers`
--
DELIMITER $$
CREATE TRIGGER `trg_customers_before_insert` BEFORE INSERT ON `tbl_customers` FOR EACH ROW BEGIN
    IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
        CALL sp_generate_business_code('customers', 'CUS', @generated_code);
        SET NEW.customer_code = @generated_code;
    END IF;
    IF NEW.created_at IS NULL THEN
        SET NEW.created_at = CURRENT_TIMESTAMP;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_delivery_statuses`
--

CREATE TABLE `tbl_delivery_statuses` (
  `id` int(10) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_delivery_statuses`
--

INSERT INTO `tbl_delivery_statuses` (`id`, `status_code`, `status_name`, `is_active`) VALUES
(1, 'pending', 'Pending', 1),
(2, 'in_transit', 'In Transit', 1),
(3, 'delivered', 'Delivered', 1),
(4, 'failed', 'Failed', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_expenses`
--

CREATE TABLE `tbl_expenses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `expense_code` varchar(32) NOT NULL,
  `expense_category_id` int(10) UNSIGNED NOT NULL,
  `campaign_id` int(10) UNSIGNED DEFAULT NULL,
  `cost_component_id` int(10) UNSIGNED DEFAULT NULL,
  `expense_name` varchar(255) NOT NULL,
  `expense_type` varchar(100) NOT NULL,
  `expense_date` date NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `currency` char(3) NOT NULL DEFAULT 'BDT',
  `exchange_rate` decimal(12,4) NOT NULL DEFAULT 1.0000,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(10) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `expense_status` varchar(30) NOT NULL DEFAULT 'posted',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `tbl_expenses`
--
DELIMITER $$
CREATE TRIGGER `trg_expenses_before_insert` BEFORE INSERT ON `tbl_expenses` FOR EACH ROW BEGIN
    IF NEW.expense_code IS NULL OR NEW.expense_code = '' THEN
        CALL sp_generate_business_code('expenses', 'EXP', @generated_code);
        SET NEW.expense_code = @generated_code;
    END IF;
    IF NEW.created_at IS NULL THEN
        SET NEW.created_at = CURRENT_TIMESTAMP;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_expense_allocations`
--

CREATE TABLE `tbl_expense_allocations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `expense_id` bigint(20) UNSIGNED NOT NULL,
  `allocation_method_id` int(10) UNSIGNED NOT NULL,
  `target_type` varchar(30) NOT NULL,
  `target_id` int(10) UNSIGNED NOT NULL,
  `collection_id` int(10) UNSIGNED DEFAULT NULL,
  `quantity_basis` decimal(14,2) NOT NULL DEFAULT 0.00,
  `value_basis` decimal(14,2) NOT NULL DEFAULT 0.00,
  `allocation_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_expense_categories`
--

CREATE TABLE `tbl_expense_categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `category_code` varchar(50) NOT NULL,
  `category_name` varchar(150) NOT NULL,
  `parent_category_id` int(10) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_expense_categories`
--

INSERT INTO `tbl_expense_categories` (`id`, `category_code`, `category_name`, `parent_category_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'product_purchase', 'Product Purchase', NULL, 1, '2026-07-12 21:10:12', '2026-07-12 21:10:12'),
(2, 'china_delivery', 'China Delivery', NULL, 1, '2026-07-12 21:10:12', '2026-07-12 21:10:12'),
(3, 'international_shipping', 'International Shipping', NULL, 1, '2026-07-12 21:10:12', '2026-07-12 21:10:12'),
(4, 'marketing', 'Marketing', NULL, 1, '2026-07-12 21:10:12', '2026-07-12 21:10:12'),
(5, 'packaging', 'Packaging', NULL, 1, '2026-07-12 21:10:12', '2026-07-12 21:10:12'),
(6, 'miscellaneous', 'Miscellaneous', NULL, 1, '2026-07-12 21:10:12', '2026-07-12 21:10:12');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_financial_transactions`
--

CREATE TABLE `tbl_financial_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_code` varchar(32) NOT NULL,
  `transaction_type` varchar(30) NOT NULL,
  `related_table` varchar(100) DEFAULT NULL,
  `related_id` int(10) UNSIGNED DEFAULT NULL,
  `entry_date` date NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `currency` char(3) NOT NULL DEFAULT 'BDT',
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_friends`
--

CREATE TABLE `tbl_friends` (
  `id` int(10) UNSIGNED NOT NULL,
  `friend_code` varchar(32) NOT NULL,
  `friend_name` varchar(255) NOT NULL,
  `contact_name` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_income`
--

CREATE TABLE `tbl_income` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `income_code` varchar(32) NOT NULL,
  `source_type` varchar(50) NOT NULL,
  `source_id` int(10) UNSIGNED NOT NULL,
  `entry_date` date NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `currency` char(3) NOT NULL DEFAULT 'BDT',
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `tbl_income`
--
DELIMITER $$
CREATE TRIGGER `trg_income_before_insert` BEFORE INSERT ON `tbl_income` FOR EACH ROW BEGIN
    IF NEW.income_code IS NULL OR NEW.income_code = '' THEN
        CALL sp_generate_business_code('income', 'INC', @generated_code);
        SET NEW.income_code = @generated_code;
    END IF;
    IF NEW.created_at IS NULL THEN
        SET NEW.created_at = CURRENT_TIMESTAMP;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_inventory`
--

CREATE TABLE `tbl_inventory` (
  `id` int(10) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `warehouse_id` int(10) UNSIGNED NOT NULL,
  `current_stock` int(11) NOT NULL DEFAULT 0,
  `reserved_stock` int(11) NOT NULL DEFAULT 0,
  `returned_stock` int(11) NOT NULL DEFAULT 0,
  `damaged_stock` int(11) NOT NULL DEFAULT 0,
  `total_purchased` int(11) NOT NULL DEFAULT 0,
  `total_sold` int(11) NOT NULL DEFAULT 0,
  `unit_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `inventory_value` decimal(14,2) NOT NULL DEFAULT 0.00,
  `available_stock` int(11) GENERATED ALWAYS AS (`current_stock` - `reserved_stock`) STORED,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_inventory_adjustments`
--

CREATE TABLE `tbl_inventory_adjustments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `adjustment_code` varchar(32) NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `warehouse_id` int(10) UNSIGNED NOT NULL,
  `adjustment_type` varchar(20) NOT NULL,
  `quantity` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL
) ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_inventory_batches`
--

CREATE TABLE `tbl_inventory_batches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `batch_number` varchar(32) NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `purchase_order_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `shipment_id` int(10) UNSIGNED DEFAULT NULL,
  `warehouse_id` int(10) UNSIGNED NOT NULL,
  `received_quantity` int(11) NOT NULL DEFAULT 0,
  `available_quantity` int(11) NOT NULL DEFAULT 0,
  `reserved_quantity` int(11) NOT NULL DEFAULT 0,
  `sold_quantity` int(11) NOT NULL DEFAULT 0,
  `returned_quantity` int(11) NOT NULL DEFAULT 0,
  `damaged_quantity` int(11) NOT NULL DEFAULT 0,
  `landed_cost_per_unit` decimal(12,2) NOT NULL DEFAULT 0.00,
  `true_cost_per_unit` decimal(12,2) NOT NULL DEFAULT 0.00,
  `batch_status` varchar(30) NOT NULL DEFAULT 'received',
  `received_date` date NOT NULL,
  `manufacture_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Triggers `tbl_inventory_batches`
--
DELIMITER $$
CREATE TRIGGER `trg_inventory_batches_before_insert` BEFORE INSERT ON `tbl_inventory_batches` FOR EACH ROW BEGIN
    IF NEW.batch_number IS NULL OR NEW.batch_number = '' THEN
        SET NEW.batch_number = CONCAT('BAT', LPAD((SELECT IFNULL(MAX(id), 0) + 1 FROM tbl_inventory_batches), 8, '0'));
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_inventory_transactions`
--

CREATE TABLE `tbl_inventory_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_code` varchar(32) NOT NULL,
  `transaction_type_id` int(10) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `batch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(10) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `tbl_inventory_transactions`
--
DELIMITER $$
CREATE TRIGGER `trg_inventory_transactions_after_insert` AFTER INSERT ON `tbl_inventory_transactions` FOR EACH ROW BEGIN
    IF NEW.batch_id IS NULL AND NEW.quantity > 0 THEN
        INSERT INTO tbl_inventory_batches (
            batch_number, variant_id, warehouse_id, received_quantity, available_quantity, reserved_quantity, sold_quantity, returned_quantity, damaged_quantity,
            landed_cost_per_unit, true_cost_per_unit, batch_status, received_date, created_by
        ) VALUES (
            CONCAT('BAT', LPAD((SELECT IFNULL(MAX(id), 0) + 1 FROM tbl_inventory_batches), 8, '0')),
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
        UPDATE tbl_inventory_transactions
           SET batch_id = LAST_INSERT_ID()
         WHERE id = NEW.id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_inventory_transaction_types`
--

CREATE TABLE `tbl_inventory_transaction_types` (
  `id` int(10) UNSIGNED NOT NULL,
  `transaction_code` varchar(50) NOT NULL,
  `transaction_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_inventory_transaction_types`
--

INSERT INTO `tbl_inventory_transaction_types` (`id`, `transaction_code`, `transaction_name`, `is_active`, `created_at`) VALUES
(1, 'inbound', 'Inbound Stock', 1, '2026-07-12 21:10:12'),
(2, 'outbound', 'Outbound Stock', 1, '2026-07-12 21:10:12'),
(3, 'reserved', 'Inventory Reserved', 1, '2026-07-12 21:10:12'),
(4, 'released', 'Inventory Released', 1, '2026-07-12 21:10:12'),
(5, 'returned', 'Returned Stock', 1, '2026-07-12 21:10:12'),
(6, 'damaged', 'Damaged Stock', 1, '2026-07-12 21:10:12'),
(7, 'adjustment', 'Inventory Adjustment', 1, '2026-07-12 21:10:12');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_marketing_campaigns`
--

CREATE TABLE `tbl_marketing_campaigns` (
  `id` int(10) UNSIGNED NOT NULL,
  `campaign_code` varchar(32) NOT NULL,
  `campaign_name` varchar(255) NOT NULL,
  `platform_id` int(10) UNSIGNED NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `spend_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `revenue_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `orders_generated` int(11) NOT NULL DEFAULT 0,
  `roas` decimal(12,2) GENERATED ALWAYS AS (case when `spend_amount` > 0 then `revenue_amount` / `spend_amount` else 0 end) STORED,
  `campaign_status` varchar(30) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_marketing_platforms`
--

CREATE TABLE `tbl_marketing_platforms` (
  `id` int(10) UNSIGNED NOT NULL,
  `platform_code` varchar(50) NOT NULL,
  `platform_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_marketing_platforms`
--

INSERT INTO `tbl_marketing_platforms` (`id`, `platform_code`, `platform_name`, `is_active`) VALUES
(1, 'facebook', 'Facebook', 1),
(2, 'instagram', 'Instagram', 1),
(3, 'organic', 'Organic', 1),
(4, 'influencer', 'Influencer', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_orders`
--

CREATE TABLE `tbl_orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_number` varchar(32) NOT NULL,
  `customer_id` int(10) UNSIGNED NOT NULL,
  `order_date` date NOT NULL,
  `order_type` varchar(20) NOT NULL DEFAULT 'in_stock',
  `order_status_id` int(10) UNSIGNED NOT NULL,
  `payment_status_id` int(10) UNSIGNED NOT NULL,
  `delivery_status_id` int(10) UNSIGNED NOT NULL,
  `refund_status_id` int(10) UNSIGNED NOT NULL,
  `return_status_id` int(10) UNSIGNED NOT NULL,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `discount_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `shipping_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `outstanding_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `currency` char(3) NOT NULL DEFAULT 'BDT',
  `payment_preference` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_order_items`
--

CREATE TABLE `tbl_order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `inventory_batch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `reserved_quantity` int(11) NOT NULL DEFAULT 0,
  `selling_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `actual_cost_at_sale` decimal(12,2) NOT NULL DEFAULT 0.00,
  `profit_amount` decimal(12,2) GENERATED ALWAYS AS (`selling_price` - `discount_amount` - `actual_cost_at_sale`) STORED,
  `item_status` varchar(30) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_order_returns`
--

CREATE TABLE `tbl_order_returns` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `return_code` varchar(32) NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `return_date` date NOT NULL,
  `return_reason` varchar(255) DEFAULT NULL,
  `return_status_id` int(10) UNSIGNED NOT NULL,
  `total_refund_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_order_return_items`
--

CREATE TABLE `tbl_order_return_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `return_id` bigint(20) UNSIGNED NOT NULL,
  `order_item_id` bigint(20) UNSIGNED NOT NULL,
  `returned_quantity` int(11) NOT NULL,
  `refund_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_order_statuses`
--

CREATE TABLE `tbl_order_statuses` (
  `id` int(10) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_order_statuses`
--

INSERT INTO `tbl_order_statuses` (`id`, `status_code`, `status_name`, `is_active`) VALUES
(1, 'pending', 'Pending', 1),
(2, 'confirmed', 'Confirmed', 1),
(3, 'packed', 'Packed', 1),
(4, 'ready_for_delivery', 'Ready for Delivery', 1),
(5, 'delivered', 'Delivered', 1),
(6, 'cancelled', 'Cancelled', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_order_status_history`
--

CREATE TABLE `tbl_order_status_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `status_id` int(10) UNSIGNED NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `changed_by` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_payments`
--

CREATE TABLE `tbl_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_code` varchar(32) NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `payment_date` date NOT NULL,
  `payment_type` varchar(50) NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `currency` char(3) NOT NULL DEFAULT 'BDT',
  `payment_status` varchar(30) NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Triggers `tbl_payments`
--
DELIMITER $$
CREATE TRIGGER `trg_payments_before_insert` BEFORE INSERT ON `tbl_payments` FOR EACH ROW BEGIN
    IF NEW.payment_code IS NULL OR NEW.payment_code = '' THEN
        CALL sp_generate_business_code('payments', 'PAY', @generated_code);
        SET NEW.payment_code = @generated_code;
    END IF;
    IF NEW.created_at IS NULL THEN
        SET NEW.created_at = CURRENT_TIMESTAMP;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_payment_statuses`
--

CREATE TABLE `tbl_payment_statuses` (
  `id` int(10) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_payment_statuses`
--

INSERT INTO `tbl_payment_statuses` (`id`, `status_code`, `status_name`, `is_active`) VALUES
(1, 'unpaid', 'Unpaid', 1),
(2, 'partial', 'Partial', 1),
(3, 'paid', 'Paid', 1),
(4, 'refunded', 'Refunded', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_products`
--

CREATE TABLE `tbl_products` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_code` varchar(32) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `product_status` varchar(30) NOT NULL DEFAULT 'active',
  `purchase_link` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `tbl_products`
--
DELIMITER $$
CREATE TRIGGER `trg_products_before_insert` BEFORE INSERT ON `tbl_products` FOR EACH ROW BEGIN
    IF NEW.product_code IS NULL OR NEW.product_code = '' THEN
        CALL sp_generate_business_code('products', 'PRD', @generated_code);
        SET NEW.product_code = @generated_code;
    END IF;
    IF NEW.created_at IS NULL THEN
        SET NEW.created_at = CURRENT_TIMESTAMP;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_product_cost_history`
--

CREATE TABLE `tbl_product_cost_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `cost_date` date NOT NULL,
  `purchase_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `import_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `shipping_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `packaging_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `advertising_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `photoshoot_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `pr_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `influencer_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `miscellaneous_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `true_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ;

--
-- Triggers `tbl_product_cost_history`
--
DELIMITER $$
CREATE TRIGGER `trg_product_cost_history_no_delete` BEFORE DELETE ON `tbl_product_cost_history` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'tbl_product_cost_history is immutable';
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_product_cost_history_no_update` BEFORE UPDATE ON `tbl_product_cost_history` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'tbl_product_cost_history is immutable';
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_product_cost_ledger`
--

CREATE TABLE `tbl_product_cost_ledger` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ledger_code` varchar(32) NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `inventory_batch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `expense_id` bigint(20) UNSIGNED DEFAULT NULL,
  `cost_component_id` int(10) UNSIGNED NOT NULL,
  `allocation_method_id` int(10) UNSIGNED DEFAULT NULL,
  `allocated_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `cost_per_unit` decimal(12,2) NOT NULL DEFAULT 0.00,
  `effective_date` date NOT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(10) UNSIGNED DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ;

--
-- Triggers `tbl_product_cost_ledger`
--
DELIMITER $$
CREATE TRIGGER `trg_product_cost_ledger_after_insert` AFTER INSERT ON `tbl_product_cost_ledger` FOR EACH ROW BEGIN
    INSERT INTO tbl_product_cost_history (
        variant_id, cost_date, purchase_cost, import_cost, shipping_cost, packaging_cost, advertising_cost, photoshoot_cost, pr_cost, influencer_cost, miscellaneous_cost, true_cost
    )
    SELECT
        NEW.variant_id,
        NEW.effective_date,
        COALESCE(SUM(CASE WHEN cc.component_code = 'purchase' THEN pcl.allocated_amount ELSE 0 END), 0.00),
        COALESCE(SUM(CASE WHEN cc.component_code = 'import' THEN pcl.allocated_amount ELSE 0 END), 0.00),
        COALESCE(SUM(CASE WHEN cc.component_code = 'shipping' THEN pcl.allocated_amount ELSE 0 END), 0.00),
        COALESCE(SUM(CASE WHEN cc.component_code = 'packaging' THEN pcl.allocated_amount ELSE 0 END), 0.00),
        COALESCE(SUM(CASE WHEN cc.component_code = 'advertising' THEN pcl.allocated_amount ELSE 0 END), 0.00),
        COALESCE(SUM(CASE WHEN cc.component_code = 'photoshoot' THEN pcl.allocated_amount ELSE 0 END), 0.00),
        COALESCE(SUM(CASE WHEN cc.component_code = 'pr' THEN pcl.allocated_amount ELSE 0 END), 0.00),
        COALESCE(SUM(CASE WHEN cc.component_code = 'influencer' THEN pcl.allocated_amount ELSE 0 END), 0.00),
        COALESCE(SUM(CASE WHEN cc.component_code = 'miscellaneous' THEN pcl.allocated_amount ELSE 0 END), 0.00),
        COALESCE(SUM(pcl.allocated_amount), 0.00)
    FROM tbl_product_cost_ledger pcl
    JOIN tbl_cost_components cc ON cc.id = pcl.cost_component_id
    WHERE pcl.variant_id = NEW.variant_id
      AND pcl.effective_date <= NEW.effective_date;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_product_cost_ledger_no_delete` BEFORE DELETE ON `tbl_product_cost_ledger` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'tbl_product_cost_ledger is immutable';
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_product_cost_ledger_no_update` BEFORE UPDATE ON `tbl_product_cost_ledger` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'tbl_product_cost_ledger is immutable';
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_product_profit_snapshots`
--

CREATE TABLE `tbl_product_profit_snapshots` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `order_item_id` bigint(20) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `inventory_batch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `selling_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `true_product_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `profit` decimal(12,2) NOT NULL DEFAULT 0.00,
  `margin` decimal(12,4) NOT NULL DEFAULT 0.0000,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `customer_id` int(10) UNSIGNED NOT NULL,
  `completion_date` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ;

--
-- Triggers `tbl_product_profit_snapshots`
--
DELIMITER $$
CREATE TRIGGER `trg_product_profit_snapshots_no_delete` BEFORE DELETE ON `tbl_product_profit_snapshots` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'tbl_product_profit_snapshots is immutable';
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_product_profit_snapshots_no_update` BEFORE UPDATE ON `tbl_product_profit_snapshots` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'tbl_product_profit_snapshots is immutable';
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_product_variants`
--

CREATE TABLE `tbl_product_variants` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `variant_code` varchar(32) NOT NULL,
  `color_name` varchar(100) NOT NULL,
  `selling_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `purchase_price_bdt` decimal(12,2) NOT NULL DEFAULT 0.00,
  `current_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `costing_method` varchar(30) NOT NULL DEFAULT 'weighted_average',
  `variant_status` varchar(30) NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ;

--
-- Triggers `tbl_product_variants`
--
DELIMITER $$
CREATE TRIGGER `trg_product_variants_before_insert` BEFORE INSERT ON `tbl_product_variants` FOR EACH ROW BEGIN
    IF NEW.variant_code IS NULL OR NEW.variant_code = '' THEN
        CALL sp_generate_business_code('product_variants', 'VAR', @generated_code);
        SET NEW.variant_code = @generated_code;
    END IF;
    IF NEW.created_at IS NULL THEN
        SET NEW.created_at = CURRENT_TIMESTAMP;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_profit_loss`
--

CREATE TABLE `tbl_profit_loss` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `revenue` decimal(14,2) NOT NULL DEFAULT 0.00,
  `cogs` decimal(14,2) NOT NULL DEFAULT 0.00,
  `gross_profit` decimal(14,2) NOT NULL DEFAULT 0.00,
  `expenses` decimal(14,2) NOT NULL DEFAULT 0.00,
  `net_profit` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_purchase_orders`
--

CREATE TABLE `tbl_purchase_orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `purchase_order_number` varchar(32) NOT NULL,
  `supplier_id` int(10) UNSIGNED DEFAULT NULL,
  `friend_id` int(10) UNSIGNED DEFAULT NULL,
  `warehouse_id` int(10) UNSIGNED NOT NULL,
  `purchase_date` date NOT NULL,
  `friend_payment_date` date DEFAULT NULL,
  `historical_rmb_rate` decimal(12,4) NOT NULL DEFAULT 0.0000,
  `china_local_delivery_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status_id` int(10) UNSIGNED NOT NULL,
  `total_amount_bdt` decimal(14,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `tbl_purchase_orders`
--
DELIMITER $$
CREATE TRIGGER `trg_purchase_orders_before_insert` BEFORE INSERT ON `tbl_purchase_orders` FOR EACH ROW BEGIN
    IF NEW.purchase_order_number IS NULL OR NEW.purchase_order_number = '' THEN
        CALL sp_generate_business_code('purchase_orders', 'PO', @generated_code);
        SET NEW.purchase_order_number = @generated_code;
    END IF;
    IF NEW.created_at IS NULL THEN
        SET NEW.created_at = CURRENT_TIMESTAMP;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_purchase_order_items`
--

CREATE TABLE `tbl_purchase_order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `purchase_order_id` int(10) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_purchase_price_rmb` decimal(12,2) NOT NULL DEFAULT 0.00,
  `unit_purchase_price_bdt` decimal(12,2) NOT NULL DEFAULT 0.00,
  `received_quantity` int(11) NOT NULL DEFAULT 0,
  `unit_landed_cost_bdt` decimal(12,2) NOT NULL DEFAULT 0.00,
  `line_total_bdt` decimal(14,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_purchase_order_statuses`
--

CREATE TABLE `tbl_purchase_order_statuses` (
  `id` int(10) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_purchase_order_statuses`
--

INSERT INTO `tbl_purchase_order_statuses` (`id`, `status_code`, `status_name`, `is_active`) VALUES
(1, 'draft', 'Draft', 1),
(2, 'placed', 'Placed', 1),
(3, 'partially_received', 'Partially Received', 1),
(4, 'received', 'Received', 1),
(5, 'cancelled', 'Cancelled', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_refund_statuses`
--

CREATE TABLE `tbl_refund_statuses` (
  `id` int(10) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_refund_statuses`
--

INSERT INTO `tbl_refund_statuses` (`id`, `status_code`, `status_name`, `is_active`) VALUES
(1, 'none', 'None', 1),
(2, 'pending', 'Pending', 1),
(3, 'approved', 'Approved', 1),
(4, 'completed', 'Completed', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_return_statuses`
--

CREATE TABLE `tbl_return_statuses` (
  `id` int(10) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_return_statuses`
--

INSERT INTO `tbl_return_statuses` (`id`, `status_code`, `status_name`, `is_active`) VALUES
(1, 'none', 'None', 1),
(2, 'requested', 'Requested', 1),
(3, 'approved', 'Approved', 1),
(4, 'completed', 'Completed', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_sequences`
--

CREATE TABLE `tbl_sequences` (
  `entity_name` varchar(64) NOT NULL,
  `prefix` varchar(16) NOT NULL,
  `last_number` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `digit_length` tinyint(3) UNSIGNED NOT NULL DEFAULT 6,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_settings`
--

CREATE TABLE `tbl_settings` (
  `id` int(10) UNSIGNED NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` varchar(500) DEFAULT NULL,
  `setting_type` varchar(50) NOT NULL DEFAULT 'string',
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_settings`
--

INSERT INTO `tbl_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`) VALUES
(1, 'current_rmb_rate', '1.00', 'decimal', 'Current RMB rate', '2026-07-12 21:10:12', '2026-07-12 21:10:12', NULL, NULL, NULL),
(2, 'shipping_rate', '0.00', 'decimal', 'Default shipping rate', '2026-07-12 21:10:12', '2026-07-12 21:10:12', NULL, NULL, NULL),
(3, 'default_advance_percentage', '30.00', 'decimal', 'Default advance percentage', '2026-07-12 21:10:12', '2026-07-12 21:10:12', NULL, NULL, NULL),
(4, 'courier_charge', '0.00', 'decimal', 'Courier charge', '2026-07-12 21:10:12', '2026-07-12 21:10:12', NULL, NULL, NULL),
(5, 'tax_rate', '0.00', 'decimal', 'Tax rate', '2026-07-12 21:10:12', '2026-07-12 21:10:12', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_shipments`
--

CREATE TABLE `tbl_shipments` (
  `id` int(10) UNSIGNED NOT NULL,
  `shipment_number` varchar(32) NOT NULL,
  `departure_date` date DEFAULT NULL,
  `warehouse_arrival_date` date DEFAULT NULL,
  `bangladesh_arrival_date` date DEFAULT NULL,
  `weight_kg` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_rate_per_kg` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status_id` int(10) UNSIGNED NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `tbl_shipments`
--
DELIMITER $$
CREATE TRIGGER `trg_shipments_before_insert` BEFORE INSERT ON `tbl_shipments` FOR EACH ROW BEGIN
    IF NEW.shipment_number IS NULL OR NEW.shipment_number = '' THEN
        CALL sp_generate_business_code('shipments', 'SHP', @generated_code);
        SET NEW.shipment_number = @generated_code;
    END IF;
    IF NEW.created_at IS NULL THEN
        SET NEW.created_at = CURRENT_TIMESTAMP;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_shipment_cost_allocations`
--

CREATE TABLE `tbl_shipment_cost_allocations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shipment_id` int(10) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `allocation_amount_bdt` decimal(12,2) NOT NULL DEFAULT 0.00,
  `allocation_basis_quantity` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_shipment_purchase_orders`
--

CREATE TABLE `tbl_shipment_purchase_orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shipment_id` int(10) UNSIGNED NOT NULL,
  `purchase_order_id` int(10) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_shipment_statuses`
--

CREATE TABLE `tbl_shipment_statuses` (
  `id` int(10) UNSIGNED NOT NULL,
  `status_code` varchar(50) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_shipment_statuses`
--

INSERT INTO `tbl_shipment_statuses` (`id`, `status_code`, `status_name`, `is_active`) VALUES
(1, 'pending', 'Pending', 1),
(2, 'in_transit', 'In Transit', 1),
(3, 'arrived', 'Arrived', 1),
(4, 'completed', 'Completed', 1),
(5, 'cancelled', 'Cancelled', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_stock_reservations`
--

CREATE TABLE `tbl_stock_reservations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `reservation_number` varchar(32) NOT NULL,
  `order_id` int(10) UNSIGNED DEFAULT NULL,
  `order_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `inventory_batch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` int(10) UNSIGNED NOT NULL,
  `reserved_quantity` int(11) NOT NULL DEFAULT 0,
  `released_quantity` int(11) NOT NULL DEFAULT 0,
  `reservation_status` varchar(30) NOT NULL DEFAULT 'reserved',
  `created_date` datetime NOT NULL DEFAULT current_timestamp(),
  `released_date` datetime DEFAULT NULL,
  `reservation_reason` varchar(255) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Triggers `tbl_stock_reservations`
--
DELIMITER $$
CREATE TRIGGER `trg_stock_reservations_after_insert` AFTER INSERT ON `tbl_stock_reservations` FOR EACH ROW BEGIN
    IF NEW.reservation_status = 'reserved' THEN
        UPDATE tbl_inventory
           SET reserved_stock = reserved_stock + NEW.reserved_quantity,
               updated_at = CURRENT_TIMESTAMP
         WHERE variant_id = NEW.variant_id AND warehouse_id = NEW.warehouse_id;

        IF NEW.inventory_batch_id IS NOT NULL THEN
            UPDATE tbl_inventory_batches
               SET reserved_quantity = reserved_quantity + NEW.reserved_quantity,
                   available_quantity = GREATEST(available_quantity - NEW.reserved_quantity, 0),
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = NEW.inventory_batch_id;
        END IF;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_stock_reservations_after_update` AFTER UPDATE ON `tbl_stock_reservations` FOR EACH ROW BEGIN
    IF OLD.reservation_status = 'reserved' AND NEW.reservation_status IN ('released', 'cancelled', 'restored') THEN
        UPDATE tbl_inventory
           SET reserved_stock = GREATEST(reserved_stock - (OLD.reserved_quantity - OLD.released_quantity), 0),
               updated_at = CURRENT_TIMESTAMP
         WHERE variant_id = NEW.variant_id AND warehouse_id = NEW.warehouse_id;

        IF NEW.inventory_batch_id IS NOT NULL THEN
            UPDATE tbl_inventory_batches
               SET reserved_quantity = GREATEST(reserved_quantity - (OLD.reserved_quantity - OLD.released_quantity), 0),
                   available_quantity = available_quantity + (OLD.reserved_quantity - OLD.released_quantity),
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = NEW.inventory_batch_id;
        END IF;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_stock_transfers`
--

CREATE TABLE `tbl_stock_transfers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transfer_code` varchar(32) NOT NULL,
  `from_warehouse_id` int(10) UNSIGNED NOT NULL,
  `to_warehouse_id` int(10) UNSIGNED NOT NULL,
  `variant_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL,
  `transfer_status` varchar(30) NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_suppliers`
--

CREATE TABLE `tbl_suppliers` (
  `id` int(10) UNSIGNED NOT NULL,
  `supplier_code` varchar(32) NOT NULL,
  `supplier_name` varchar(255) NOT NULL,
  `contact_name` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_warehouses`
--

CREATE TABLE `tbl_warehouses` (
  `id` int(10) UNSIGNED NOT NULL,
  `warehouse_code` varchar(50) NOT NULL,
  `warehouse_name` varchar(150) NOT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'Bangladesh',
  `city` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_best_selling_colors`
-- (See below for the actual view)
--
CREATE TABLE `vw_best_selling_colors` (
`product_name` varchar(255)
,`color_name` varchar(100)
,`total_quantity_sold` decimal(32,0)
,`revenue` decimal(44,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_best_selling_products`
-- (See below for the actual view)
--
CREATE TABLE `vw_best_selling_products` (
`product_name` varchar(255)
,`total_quantity_sold` decimal(32,0)
,`revenue` decimal(44,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_campaign_performance`
-- (See below for the actual view)
--
CREATE TABLE `vw_campaign_performance` (
`campaign_id` int(10) unsigned
,`campaign_code` varchar(32)
,`campaign_name` varchar(255)
,`campaign_cost` decimal(36,2)
,`campaign_revenue` decimal(36,2)
,`campaign_profit` decimal(37,2)
,`roas` decimal(42,6)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_cash_flow`
-- (See below for the actual view)
--
CREATE TABLE `vw_cash_flow` (
`entry_date` date
,`entry_type` varchar(20)
,`total_amount` decimal(36,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_cost_allocation_summary`
-- (See below for the actual view)
--
CREATE TABLE `vw_cost_allocation_summary` (
`expense_code` varchar(32)
,`expense_name` varchar(255)
,`expense_type` varchar(100)
,`target_type` varchar(30)
,`target_id` int(10) unsigned
,`allocation_amount` decimal(14,2)
,`created_at` datetime
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_customer_analytics`
-- (See below for the actual view)
--
CREATE TABLE `vw_customer_analytics` (
`id` int(10) unsigned
,`customer_code` varchar(32)
,`customer_name` varchar(255)
,`phone` varchar(30)
,`facebook_name` varchar(255)
,`total_orders` bigint(21)
,`lifetime_spend` decimal(36,2)
,`average_order_value` decimal(40,6)
,`first_purchase` date
,`last_purchase` date
,`repeat_customer` varchar(6)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_inventory_value`
-- (See below for the actual view)
--
CREATE TABLE `vw_inventory_value` (
`variant_id` int(10) unsigned
,`product_id` int(10) unsigned
,`product_name` varchar(255)
,`color_name` varchar(100)
,`warehouse_id` int(10) unsigned
,`warehouse_name` varchar(150)
,`current_stock` int(11)
,`reserved_stock` int(11)
,`available_stock` int(11)
,`returned_stock` int(11)
,`damaged_stock` int(11)
,`unit_cost` decimal(12,2)
,`inventory_value` decimal(14,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_marketing_roas`
-- (See below for the actual view)
--
CREATE TABLE `vw_marketing_roas` (
`campaign_code` varchar(32)
,`campaign_name` varchar(255)
,`spend_amount` decimal(14,2)
,`revenue_amount` decimal(14,2)
,`orders_generated` int(11)
,`roas` decimal(12,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_monthly_profit`
-- (See below for the actual view)
--
CREATE TABLE `vw_monthly_profit` (
`profit_month` varchar(7)
,`revenue` decimal(36,2)
,`expenses` decimal(36,2)
,`profit` decimal(37,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_monthly_revenue`
-- (See below for the actual view)
--
CREATE TABLE `vw_monthly_revenue` (
`revenue_month` varchar(7)
,`revenue` decimal(36,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_product_cost_components`
-- (See below for the actual view)
--
CREATE TABLE `vw_product_cost_components` (
`variant_id` int(10) unsigned
,`product_id` int(10) unsigned
,`component_code` varchar(50)
,`component_name` varchar(150)
,`total_allocated_amount` decimal(36,2)
,`total_cost_per_unit` decimal(34,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_profit_loss_summary`
-- (See below for the actual view)
--
CREATE TABLE `vw_profit_loss_summary` (
`period_month` varchar(7)
,`revenue` decimal(36,2)
,`expenses` decimal(36,2)
,`net_profit` decimal(37,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_profit_per_customer`
-- (See below for the actual view)
--
CREATE TABLE `vw_profit_per_customer` (
`customer_id` int(10) unsigned
,`customer_code` varchar(32)
,`customer_name` varchar(255)
,`total_spend` decimal(36,2)
,`total_profit` decimal(34,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_profit_per_product`
-- (See below for the actual view)
--
CREATE TABLE `vw_profit_per_product` (
`product_id` int(10) unsigned
,`product_name` varchar(255)
,`total_profit` decimal(34,2)
,`total_quantity_sold` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_profit_per_shipment`
-- (See below for the actual view)
--
CREATE TABLE `vw_profit_per_shipment` (
`shipment_id` int(10) unsigned
,`shipment_number` varchar(32)
,`total_profit` decimal(34,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_sales_trend`
-- (See below for the actual view)
--
CREATE TABLE `vw_sales_trend` (
`sales_month` varchar(7)
,`sales` decimal(36,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_true_product_cost`
-- (See below for the actual view)
--
CREATE TABLE `vw_true_product_cost` (
`variant_id` int(10) unsigned
,`product_id` int(10) unsigned
,`product_name` varchar(255)
,`color_name` varchar(100)
,`purchase_cost` decimal(36,2)
,`import_cost` decimal(36,2)
,`shipping_cost` decimal(36,2)
,`packaging_cost` decimal(36,2)
,`advertising_cost` decimal(36,2)
,`photoshoot_cost` decimal(36,2)
,`pr_cost` decimal(36,2)
,`influencer_cost` decimal(36,2)
,`miscellaneous_cost` decimal(36,2)
,`true_product_cost` decimal(36,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_true_product_cost_report`
-- (See below for the actual view)
--
CREATE TABLE `vw_true_product_cost_report` (
`product_id` int(10) unsigned
,`product_code` varchar(32)
,`product_name` varchar(255)
,`sku` varchar(100)
,`purchase_cost` decimal(44,2)
,`true_product_cost` decimal(14,2)
);

-- --------------------------------------------------------

--
-- Structure for view `vw_best_selling_colors`
--
DROP TABLE IF EXISTS `vw_best_selling_colors`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_best_selling_colors`  AS SELECT `p`.`product_name` AS `product_name`, `v`.`color_name` AS `color_name`, sum(`oi`.`quantity`) AS `total_quantity_sold`, sum(`oi`.`selling_price` * `oi`.`quantity`) AS `revenue` FROM ((`tbl_order_items` `oi` join `tbl_product_variants` `v` on(`v`.`id` = `oi`.`variant_id`)) join `tbl_products` `p` on(`p`.`id` = `v`.`product_id`)) GROUP BY `p`.`product_name`, `v`.`color_name` ORDER BY sum(`oi`.`quantity`) DESC ;

-- --------------------------------------------------------

--
-- Structure for view `vw_best_selling_products`
--
DROP TABLE IF EXISTS `vw_best_selling_products`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_best_selling_products`  AS SELECT `p`.`product_name` AS `product_name`, sum(`oi`.`quantity`) AS `total_quantity_sold`, sum(`oi`.`selling_price` * `oi`.`quantity`) AS `revenue` FROM ((`tbl_order_items` `oi` join `tbl_product_variants` `v` on(`v`.`id` = `oi`.`variant_id`)) join `tbl_products` `p` on(`p`.`id` = `v`.`product_id`)) GROUP BY `p`.`product_name` ORDER BY sum(`oi`.`quantity`) DESC ;

-- --------------------------------------------------------

--
-- Structure for view `vw_campaign_performance`
--
DROP TABLE IF EXISTS `vw_campaign_performance`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_campaign_performance`  AS SELECT `mc`.`id` AS `campaign_id`, `mc`.`campaign_code` AS `campaign_code`, `mc`.`campaign_name` AS `campaign_name`, coalesce(sum(`e`.`amount`),0.00) AS `campaign_cost`, coalesce(sum(case when `i`.`source_type` = 'campaign' then `i`.`amount` else 0 end),0.00) AS `campaign_revenue`, coalesce(sum(case when `i`.`source_type` = 'campaign' then `i`.`amount` else 0 end),0.00) - coalesce(sum(`e`.`amount`),0.00) AS `campaign_profit`, CASE WHEN coalesce(sum(`e`.`amount`),0.00) > 0 THEN coalesce(sum(case when `i`.`source_type` = 'campaign' then `i`.`amount` else 0 end),0.00) / coalesce(sum(`e`.`amount`),0.00) ELSE 0.00 END AS `roas` FROM ((`tbl_marketing_campaigns` `mc` left join `tbl_expenses` `e` on(`e`.`campaign_id` = `mc`.`id`)) left join `tbl_income` `i` on(`i`.`source_type` = 'campaign' and `i`.`source_id` = `mc`.`id`)) GROUP BY `mc`.`id`, `mc`.`campaign_code`, `mc`.`campaign_name` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_cash_flow`
--
DROP TABLE IF EXISTS `vw_cash_flow`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_cash_flow`  AS SELECT `tbl_cash_flow`.`entry_date` AS `entry_date`, `tbl_cash_flow`.`entry_type` AS `entry_type`, sum(`tbl_cash_flow`.`amount`) AS `total_amount` FROM `tbl_cash_flow` GROUP BY `tbl_cash_flow`.`entry_date`, `tbl_cash_flow`.`entry_type` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_cost_allocation_summary`
--
DROP TABLE IF EXISTS `vw_cost_allocation_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_cost_allocation_summary`  AS SELECT `e`.`expense_code` AS `expense_code`, `e`.`expense_name` AS `expense_name`, `e`.`expense_type` AS `expense_type`, `ea`.`target_type` AS `target_type`, `ea`.`target_id` AS `target_id`, `ea`.`allocation_amount` AS `allocation_amount`, `ea`.`created_at` AS `created_at` FROM (`tbl_expenses` `e` join `tbl_expense_allocations` `ea` on(`ea`.`expense_id` = `e`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_customer_analytics`
--
DROP TABLE IF EXISTS `vw_customer_analytics`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_customer_analytics`  AS SELECT `c`.`id` AS `id`, `c`.`customer_code` AS `customer_code`, `c`.`customer_name` AS `customer_name`, `c`.`phone` AS `phone`, `c`.`facebook_name` AS `facebook_name`, count(distinct `o`.`id`) AS `total_orders`, coalesce(sum(`o`.`grand_total`),0.00) AS `lifetime_spend`, CASE WHEN count(distinct `o`.`id`) > 0 THEN coalesce(sum(`o`.`grand_total`),0.00) / count(distinct `o`.`id`) ELSE 0.00 END AS `average_order_value`, min(`o`.`order_date`) AS `first_purchase`, max(`o`.`order_date`) AS `last_purchase`, CASE WHEN count(distinct `o`.`id`) > 1 THEN 'Repeat' ELSE 'New' END AS `repeat_customer` FROM (`tbl_customers` `c` left join `tbl_orders` `o` on(`o`.`customer_id` = `c`.`id`)) GROUP BY `c`.`id`, `c`.`customer_code`, `c`.`customer_name`, `c`.`phone`, `c`.`facebook_name` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_inventory_value`
--
DROP TABLE IF EXISTS `vw_inventory_value`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_inventory_value`  AS SELECT `i`.`variant_id` AS `variant_id`, `v`.`product_id` AS `product_id`, `p`.`product_name` AS `product_name`, `v`.`color_name` AS `color_name`, `i`.`warehouse_id` AS `warehouse_id`, `w`.`warehouse_name` AS `warehouse_name`, `i`.`current_stock` AS `current_stock`, `i`.`reserved_stock` AS `reserved_stock`, `i`.`available_stock` AS `available_stock`, `i`.`returned_stock` AS `returned_stock`, `i`.`damaged_stock` AS `damaged_stock`, `i`.`unit_cost` AS `unit_cost`, `i`.`inventory_value` AS `inventory_value` FROM (((`tbl_inventory` `i` join `tbl_product_variants` `v` on(`v`.`id` = `i`.`variant_id`)) join `tbl_products` `p` on(`p`.`id` = `v`.`product_id`)) join `tbl_warehouses` `w` on(`w`.`id` = `i`.`warehouse_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_marketing_roas`
--
DROP TABLE IF EXISTS `vw_marketing_roas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_marketing_roas`  AS SELECT `m`.`campaign_code` AS `campaign_code`, `m`.`campaign_name` AS `campaign_name`, `m`.`spend_amount` AS `spend_amount`, `m`.`revenue_amount` AS `revenue_amount`, `m`.`orders_generated` AS `orders_generated`, `m`.`roas` AS `roas` FROM `tbl_marketing_campaigns` AS `m` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_monthly_profit`
--
DROP TABLE IF EXISTS `vw_monthly_profit`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_monthly_profit`  AS SELECT date_format(`tbl_income`.`entry_date`,'%Y-%m') AS `profit_month`, sum(case when `tbl_income`.`source_type` = 'order' then `tbl_income`.`amount` else 0 end) AS `revenue`, sum(case when `tbl_income`.`source_type` = 'expense' then `tbl_income`.`amount` else 0 end) AS `expenses`, sum(case when `tbl_income`.`source_type` = 'order' then `tbl_income`.`amount` else 0 end) - sum(case when `tbl_income`.`source_type` = 'expense' then `tbl_income`.`amount` else 0 end) AS `profit` FROM `tbl_income` GROUP BY date_format(`tbl_income`.`entry_date`,'%Y-%m') ;

-- --------------------------------------------------------

--
-- Structure for view `vw_monthly_revenue`
--
DROP TABLE IF EXISTS `vw_monthly_revenue`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_monthly_revenue`  AS SELECT date_format(`tbl_orders`.`order_date`,'%Y-%m') AS `revenue_month`, sum(`tbl_orders`.`grand_total`) AS `revenue` FROM `tbl_orders` WHERE `tbl_orders`.`deleted_at` is null GROUP BY date_format(`tbl_orders`.`order_date`,'%Y-%m') ;

-- --------------------------------------------------------

--
-- Structure for view `vw_product_cost_components`
--
DROP TABLE IF EXISTS `vw_product_cost_components`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_product_cost_components`  AS SELECT `pcl`.`variant_id` AS `variant_id`, `pv`.`product_id` AS `product_id`, `cc`.`component_code` AS `component_code`, `cc`.`component_name` AS `component_name`, sum(`pcl`.`allocated_amount`) AS `total_allocated_amount`, sum(`pcl`.`cost_per_unit`) AS `total_cost_per_unit` FROM ((`tbl_product_cost_ledger` `pcl` join `tbl_product_variants` `pv` on(`pv`.`id` = `pcl`.`variant_id`)) join `tbl_cost_components` `cc` on(`cc`.`id` = `pcl`.`cost_component_id`)) GROUP BY `pcl`.`variant_id`, `pv`.`product_id`, `cc`.`component_code`, `cc`.`component_name` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_profit_loss_summary`
--
DROP TABLE IF EXISTS `vw_profit_loss_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_profit_loss_summary`  AS SELECT date_format(`tbl_income`.`entry_date`,'%Y-%m') AS `period_month`, sum(case when `tbl_income`.`source_type` = 'order' then `tbl_income`.`amount` else 0 end) AS `revenue`, sum(case when `tbl_income`.`source_type` = 'expense' then `tbl_income`.`amount` else 0 end) AS `expenses`, sum(case when `tbl_income`.`source_type` = 'order' then `tbl_income`.`amount` else 0 end) - sum(case when `tbl_income`.`source_type` = 'expense' then `tbl_income`.`amount` else 0 end) AS `net_profit` FROM `tbl_income` GROUP BY date_format(`tbl_income`.`entry_date`,'%Y-%m') ;

-- --------------------------------------------------------

--
-- Structure for view `vw_profit_per_customer`
--
DROP TABLE IF EXISTS `vw_profit_per_customer`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_profit_per_customer`  AS SELECT `c`.`id` AS `customer_id`, `c`.`customer_code` AS `customer_code`, `c`.`customer_name` AS `customer_name`, sum(`o`.`grand_total`) AS `total_spend`, sum(coalesce(`oi`.`profit_amount`,0.00)) AS `total_profit` FROM ((`tbl_customers` `c` left join `tbl_orders` `o` on(`o`.`customer_id` = `c`.`id`)) left join `tbl_order_items` `oi` on(`oi`.`order_id` = `o`.`id`)) GROUP BY `c`.`id`, `c`.`customer_code`, `c`.`customer_name` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_profit_per_product`
--
DROP TABLE IF EXISTS `vw_profit_per_product`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_profit_per_product`  AS SELECT `p`.`id` AS `product_id`, `p`.`product_name` AS `product_name`, sum(`oi`.`profit_amount`) AS `total_profit`, sum(`oi`.`quantity`) AS `total_quantity_sold` FROM ((`tbl_order_items` `oi` join `tbl_product_variants` `v` on(`v`.`id` = `oi`.`variant_id`)) join `tbl_products` `p` on(`p`.`id` = `v`.`product_id`)) GROUP BY `p`.`id`, `p`.`product_name` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_profit_per_shipment`
--
DROP TABLE IF EXISTS `vw_profit_per_shipment`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_profit_per_shipment`  AS SELECT `s`.`id` AS `shipment_id`, `s`.`shipment_number` AS `shipment_number`, coalesce(sum(`oi`.`profit_amount`),0.00) AS `total_profit` FROM ((((`tbl_shipments` `s` left join `tbl_shipment_purchase_orders` `spo` on(`spo`.`shipment_id` = `s`.`id`)) left join `tbl_purchase_orders` `po` on(`po`.`id` = `spo`.`purchase_order_id`)) left join `tbl_purchase_order_items` `poi` on(`poi`.`purchase_order_id` = `po`.`id`)) left join `tbl_order_items` `oi` on(`oi`.`variant_id` = `poi`.`variant_id`)) GROUP BY `s`.`id`, `s`.`shipment_number` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_sales_trend`
--
DROP TABLE IF EXISTS `vw_sales_trend`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_sales_trend`  AS SELECT date_format(`tbl_orders`.`order_date`,'%Y-%m') AS `sales_month`, sum(`tbl_orders`.`grand_total`) AS `sales` FROM `tbl_orders` GROUP BY date_format(`tbl_orders`.`order_date`,'%Y-%m') ;

-- --------------------------------------------------------

--
-- Structure for view `vw_true_product_cost`
--
DROP TABLE IF EXISTS `vw_true_product_cost`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_true_product_cost`  AS SELECT `pv`.`id` AS `variant_id`, `pv`.`product_id` AS `product_id`, `p`.`product_name` AS `product_name`, `pv`.`color_name` AS `color_name`, coalesce(sum(case when `cc`.`component_code` = 'purchase' then `pcl`.`allocated_amount` else 0 end),0.00) AS `purchase_cost`, coalesce(sum(case when `cc`.`component_code` = 'import' then `pcl`.`allocated_amount` else 0 end),0.00) AS `import_cost`, coalesce(sum(case when `cc`.`component_code` = 'shipping' then `pcl`.`allocated_amount` else 0 end),0.00) AS `shipping_cost`, coalesce(sum(case when `cc`.`component_code` = 'packaging' then `pcl`.`allocated_amount` else 0 end),0.00) AS `packaging_cost`, coalesce(sum(case when `cc`.`component_code` = 'advertising' then `pcl`.`allocated_amount` else 0 end),0.00) AS `advertising_cost`, coalesce(sum(case when `cc`.`component_code` = 'photoshoot' then `pcl`.`allocated_amount` else 0 end),0.00) AS `photoshoot_cost`, coalesce(sum(case when `cc`.`component_code` = 'pr' then `pcl`.`allocated_amount` else 0 end),0.00) AS `pr_cost`, coalesce(sum(case when `cc`.`component_code` = 'influencer' then `pcl`.`allocated_amount` else 0 end),0.00) AS `influencer_cost`, coalesce(sum(case when `cc`.`component_code` = 'miscellaneous' then `pcl`.`allocated_amount` else 0 end),0.00) AS `miscellaneous_cost`, coalesce(sum(`pcl`.`allocated_amount`),0.00) AS `true_product_cost` FROM (((`tbl_product_variants` `pv` join `tbl_products` `p` on(`p`.`id` = `pv`.`product_id`)) left join `tbl_product_cost_ledger` `pcl` on(`pcl`.`variant_id` = `pv`.`id`)) left join `tbl_cost_components` `cc` on(`cc`.`id` = `pcl`.`cost_component_id`)) GROUP BY `pv`.`id`, `pv`.`product_id`, `p`.`product_name`, `pv`.`color_name` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_true_product_cost_report`
--
DROP TABLE IF EXISTS `vw_true_product_cost_report`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_true_product_cost_report`  AS SELECT `p`.`id` AS `product_id`, `p`.`product_code` AS `product_code`, `p`.`product_name` AS `product_name`, `p`.`sku` AS `sku`, (select coalesce(sum(`poi`.`unit_purchase_price_bdt` * `poi`.`quantity`),0.00) from (`tbl_purchase_order_items` `poi` join `tbl_product_variants` `pv` on(`pv`.`id` = `poi`.`variant_id`)) where `pv`.`product_id` = `p`.`id`) AS `purchase_cost`, `fn_calculate_true_product_cost`(`p`.`id`) AS `true_product_cost` FROM `tbl_products` AS `p` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_allocation_methods`
--
ALTER TABLE `tbl_allocation_methods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_allocation_methods_code` (`method_code`);

--
-- Indexes for table `tbl_cash_flow`
--
ALTER TABLE `tbl_cash_flow`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_cash_flow_code` (`cash_flow_code`),
  ADD KEY `idx_cash_flow_date` (`entry_date`);

--
-- Indexes for table `tbl_categories`
--
ALTER TABLE `tbl_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_categories_code` (`category_code`),
  ADD KEY `idx_categories_parent` (`parent_category_id`),
  ADD KEY `idx_categories_active` (`is_active`);

--
-- Indexes for table `tbl_collections`
--
ALTER TABLE `tbl_collections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_collections_code` (`collection_code`),
  ADD KEY `idx_collections_type` (`collection_type_id`),
  ADD KEY `idx_collections_active` (`is_active`),
  ADD KEY `idx_collections_deleted_at` (`deleted_at`);

--
-- Indexes for table `tbl_collection_products`
--
ALTER TABLE `tbl_collection_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_collection_products_pair` (`collection_id`,`variant_id`),
  ADD KEY `idx_collection_products_variant` (`variant_id`);

--
-- Indexes for table `tbl_collection_types`
--
ALTER TABLE `tbl_collection_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_collection_types_code` (`type_code`);

--
-- Indexes for table `tbl_cost_components`
--
ALTER TABLE `tbl_cost_components`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_cost_components_code` (`component_code`),
  ADD KEY `idx_cost_components_active` (`is_active`);

--
-- Indexes for table `tbl_couriers`
--
ALTER TABLE `tbl_couriers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_couriers_code` (`courier_code`);

--
-- Indexes for table `tbl_courier_rates`
--
ALTER TABLE `tbl_courier_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_courier_rates_courier` (`courier_id`),
  ADD KEY `idx_courier_rates_active` (`is_active`);

--
-- Indexes for table `tbl_customers`
--
ALTER TABLE `tbl_customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_customers_code` (`customer_code`),
  ADD KEY `idx_customers_phone` (`phone`),
  ADD KEY `idx_customers_deleted_at` (`deleted_at`);

--
-- Indexes for table `tbl_delivery_statuses`
--
ALTER TABLE `tbl_delivery_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_delivery_statuses_code` (`status_code`);

--
-- Indexes for table `tbl_expenses`
--
ALTER TABLE `tbl_expenses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_expenses_code` (`expense_code`),
  ADD KEY `idx_expenses_category` (`expense_category_id`),
  ADD KEY `idx_expenses_type` (`expense_type`),
  ADD KEY `idx_expenses_date` (`expense_date`),
  ADD KEY `idx_expenses_deleted_at` (`deleted_at`),
  ADD KEY `idx_expenses_campaign` (`campaign_id`),
  ADD KEY `idx_expenses_component` (`cost_component_id`);

--
-- Indexes for table `tbl_expense_allocations`
--
ALTER TABLE `tbl_expense_allocations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_expense_allocations_expense` (`expense_id`),
  ADD KEY `idx_expense_allocations_method` (`allocation_method_id`),
  ADD KEY `idx_expense_allocations_target` (`target_type`,`target_id`),
  ADD KEY `idx_expense_allocations_collection` (`collection_id`);

--
-- Indexes for table `tbl_expense_categories`
--
ALTER TABLE `tbl_expense_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_expense_categories_code` (`category_code`),
  ADD KEY `idx_expense_categories_parent` (`parent_category_id`);

--
-- Indexes for table `tbl_financial_transactions`
--
ALTER TABLE `tbl_financial_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_financial_transactions_code` (`transaction_code`),
  ADD KEY `idx_financial_transactions_type` (`transaction_type`),
  ADD KEY `idx_financial_transactions_date` (`entry_date`);

--
-- Indexes for table `tbl_friends`
--
ALTER TABLE `tbl_friends`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_friends_code` (`friend_code`),
  ADD KEY `idx_friends_deleted_at` (`deleted_at`);

--
-- Indexes for table `tbl_income`
--
ALTER TABLE `tbl_income`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_income_code` (`income_code`),
  ADD KEY `idx_income_source` (`source_type`,`source_id`),
  ADD KEY `idx_income_entry_date` (`entry_date`);

--
-- Indexes for table `tbl_inventory`
--
ALTER TABLE `tbl_inventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_inventory_variant_warehouse` (`variant_id`,`warehouse_id`),
  ADD KEY `idx_inventory_variant` (`variant_id`),
  ADD KEY `idx_inventory_warehouse` (`warehouse_id`),
  ADD KEY `idx_inventory_deleted_at` (`deleted_at`);

--
-- Indexes for table `tbl_inventory_adjustments`
--
ALTER TABLE `tbl_inventory_adjustments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_inventory_adjustment_code` (`adjustment_code`),
  ADD KEY `idx_inventory_adjustments_variant` (`variant_id`),
  ADD KEY `idx_inventory_adjustments_warehouse` (`warehouse_id`);

--
-- Indexes for table `tbl_inventory_batches`
--
ALTER TABLE `tbl_inventory_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_inventory_batches_number` (`batch_number`),
  ADD KEY `idx_inventory_batches_variant` (`variant_id`),
  ADD KEY `idx_inventory_batches_po_item` (`purchase_order_item_id`),
  ADD KEY `idx_inventory_batches_shipment` (`shipment_id`),
  ADD KEY `idx_inventory_batches_warehouse` (`warehouse_id`),
  ADD KEY `idx_inventory_batches_status` (`batch_status`),
  ADD KEY `idx_inventory_batches_received_date` (`received_date`);

--
-- Indexes for table `tbl_inventory_transactions`
--
ALTER TABLE `tbl_inventory_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_inventory_transactions_code` (`transaction_code`),
  ADD KEY `idx_inventory_transactions_variant` (`variant_id`),
  ADD KEY `idx_inventory_transactions_warehouse` (`warehouse_id`),
  ADD KEY `idx_inventory_transactions_type` (`transaction_type_id`),
  ADD KEY `idx_inventory_transactions_created_at` (`created_at`),
  ADD KEY `idx_inventory_transactions_batch` (`batch_id`);

--
-- Indexes for table `tbl_inventory_transaction_types`
--
ALTER TABLE `tbl_inventory_transaction_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_inventory_transaction_types_code` (`transaction_code`);

--
-- Indexes for table `tbl_marketing_campaigns`
--
ALTER TABLE `tbl_marketing_campaigns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_marketing_campaigns_code` (`campaign_code`),
  ADD KEY `idx_marketing_campaigns_platform` (`platform_id`),
  ADD KEY `idx_marketing_campaigns_deleted_at` (`deleted_at`);

--
-- Indexes for table `tbl_marketing_platforms`
--
ALTER TABLE `tbl_marketing_platforms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_marketing_platforms_code` (`platform_code`);

--
-- Indexes for table `tbl_orders`
--
ALTER TABLE `tbl_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_orders_number` (`order_number`),
  ADD KEY `idx_orders_customer` (`customer_id`),
  ADD KEY `idx_orders_status` (`order_status_id`),
  ADD KEY `idx_orders_payment_status` (`payment_status_id`),
  ADD KEY `idx_orders_delivery_status` (`delivery_status_id`),
  ADD KEY `idx_orders_refund_status` (`refund_status_id`),
  ADD KEY `idx_orders_return_status` (`return_status_id`),
  ADD KEY `idx_orders_deleted_at` (`deleted_at`);

--
-- Indexes for table `tbl_order_items`
--
ALTER TABLE `tbl_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order` (`order_id`),
  ADD KEY `idx_order_items_variant` (`variant_id`),
  ADD KEY `idx_order_items_status` (`item_status`),
  ADD KEY `idx_order_items_batch` (`inventory_batch_id`);

--
-- Indexes for table `tbl_order_returns`
--
ALTER TABLE `tbl_order_returns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_order_returns_code` (`return_code`),
  ADD KEY `idx_order_returns_order` (`order_id`),
  ADD KEY `idx_order_returns_status` (`return_status_id`);

--
-- Indexes for table `tbl_order_return_items`
--
ALTER TABLE `tbl_order_return_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_return_items_return` (`return_id`),
  ADD KEY `idx_order_return_items_item` (`order_item_id`);

--
-- Indexes for table `tbl_order_statuses`
--
ALTER TABLE `tbl_order_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_order_statuses_code` (`status_code`);

--
-- Indexes for table `tbl_order_status_history`
--
ALTER TABLE `tbl_order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_status_history_order` (`order_id`),
  ADD KEY `idx_order_status_history_status` (`status_id`);

--
-- Indexes for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_payments_code` (`payment_code`),
  ADD KEY `idx_payments_order` (`order_id`),
  ADD KEY `idx_payments_status` (`payment_status`);

--
-- Indexes for table `tbl_payment_statuses`
--
ALTER TABLE `tbl_payment_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_payment_statuses_code` (`status_code`);

--
-- Indexes for table `tbl_products`
--
ALTER TABLE `tbl_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_products_code` (`product_code`),
  ADD UNIQUE KEY `uk_products_sku` (`sku`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_status` (`product_status`),
  ADD KEY `idx_products_deleted_at` (`deleted_at`);

--
-- Indexes for table `tbl_product_cost_history`
--
ALTER TABLE `tbl_product_cost_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_cost_history_variant_date` (`variant_id`,`cost_date`);

--
-- Indexes for table `tbl_product_cost_ledger`
--
ALTER TABLE `tbl_product_cost_ledger`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_product_cost_ledger_code` (`ledger_code`),
  ADD KEY `idx_product_cost_ledger_variant` (`variant_id`),
  ADD KEY `idx_product_cost_ledger_batch` (`inventory_batch_id`),
  ADD KEY `idx_product_cost_ledger_expense` (`expense_id`),
  ADD KEY `idx_product_cost_ledger_component` (`cost_component_id`),
  ADD KEY `idx_product_cost_ledger_effective_date` (`effective_date`),
  ADD KEY `fk_cost_ledger_method` (`allocation_method_id`);

--
-- Indexes for table `tbl_product_profit_snapshots`
--
ALTER TABLE `tbl_product_profit_snapshots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_profit_snapshots_order` (`order_id`),
  ADD KEY `idx_profit_snapshots_item` (`order_item_id`),
  ADD KEY `idx_profit_snapshots_variant` (`variant_id`),
  ADD KEY `idx_profit_snapshots_batch` (`inventory_batch_id`),
  ADD KEY `idx_profit_snapshots_customer` (`customer_id`),
  ADD KEY `idx_profit_snapshots_completion` (`completion_date`);

--
-- Indexes for table `tbl_product_variants`
--
ALTER TABLE `tbl_product_variants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_variants_code` (`variant_code`),
  ADD KEY `idx_variants_product` (`product_id`),
  ADD KEY `idx_variants_status` (`variant_status`),
  ADD KEY `idx_variants_deleted_at` (`deleted_at`);

--
-- Indexes for table `tbl_profit_loss`
--
ALTER TABLE `tbl_profit_loss`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_profit_loss_period` (`period_start`,`period_end`);

--
-- Indexes for table `tbl_purchase_orders`
--
ALTER TABLE `tbl_purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_purchase_orders_number` (`purchase_order_number`),
  ADD KEY `idx_purchase_orders_supplier` (`supplier_id`),
  ADD KEY `idx_purchase_orders_friend` (`friend_id`),
  ADD KEY `idx_purchase_orders_warehouse` (`warehouse_id`),
  ADD KEY `idx_purchase_orders_status` (`status_id`),
  ADD KEY `idx_purchase_orders_deleted_at` (`deleted_at`);

--
-- Indexes for table `tbl_purchase_order_items`
--
ALTER TABLE `tbl_purchase_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_purchase_order_items_po` (`purchase_order_id`),
  ADD KEY `idx_purchase_order_items_variant` (`variant_id`);

--
-- Indexes for table `tbl_purchase_order_statuses`
--
ALTER TABLE `tbl_purchase_order_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_purchase_order_statuses_code` (`status_code`);

--
-- Indexes for table `tbl_refund_statuses`
--
ALTER TABLE `tbl_refund_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_refund_statuses_code` (`status_code`);

--
-- Indexes for table `tbl_return_statuses`
--
ALTER TABLE `tbl_return_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_return_statuses_code` (`status_code`);

--
-- Indexes for table `tbl_sequences`
--
ALTER TABLE `tbl_sequences`
  ADD PRIMARY KEY (`entity_name`);

--
-- Indexes for table `tbl_settings`
--
ALTER TABLE `tbl_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_settings_key` (`setting_key`),
  ADD KEY `idx_settings_deleted_at` (`deleted_at`);

--
-- Indexes for table `tbl_shipments`
--
ALTER TABLE `tbl_shipments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_shipments_number` (`shipment_number`),
  ADD KEY `idx_shipments_status` (`status_id`),
  ADD KEY `idx_shipments_deleted_at` (`deleted_at`);

--
-- Indexes for table `tbl_shipment_cost_allocations`
--
ALTER TABLE `tbl_shipment_cost_allocations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_shipment_cost_allocations_shipment` (`shipment_id`),
  ADD KEY `idx_shipment_cost_allocations_variant` (`variant_id`);

--
-- Indexes for table `tbl_shipment_purchase_orders`
--
ALTER TABLE `tbl_shipment_purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_shipment_purchase_orders_pair` (`shipment_id`,`purchase_order_id`),
  ADD KEY `idx_shipment_purchase_orders_po` (`purchase_order_id`);

--
-- Indexes for table `tbl_shipment_statuses`
--
ALTER TABLE `tbl_shipment_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_shipment_statuses_code` (`status_code`);

--
-- Indexes for table `tbl_stock_reservations`
--
ALTER TABLE `tbl_stock_reservations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_stock_reservations_number` (`reservation_number`),
  ADD KEY `idx_stock_reservations_order` (`order_id`),
  ADD KEY `idx_stock_reservations_item` (`order_item_id`),
  ADD KEY `idx_stock_reservations_variant` (`variant_id`),
  ADD KEY `idx_stock_reservations_batch` (`inventory_batch_id`),
  ADD KEY `idx_stock_reservations_warehouse` (`warehouse_id`),
  ADD KEY `idx_stock_reservations_status` (`reservation_status`);

--
-- Indexes for table `tbl_stock_transfers`
--
ALTER TABLE `tbl_stock_transfers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_stock_transfers_code` (`transfer_code`),
  ADD KEY `idx_stock_transfers_from` (`from_warehouse_id`),
  ADD KEY `idx_stock_transfers_to` (`to_warehouse_id`),
  ADD KEY `idx_stock_transfers_variant` (`variant_id`);

--
-- Indexes for table `tbl_suppliers`
--
ALTER TABLE `tbl_suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_suppliers_code` (`supplier_code`),
  ADD KEY `idx_suppliers_deleted_at` (`deleted_at`);

--
-- Indexes for table `tbl_warehouses`
--
ALTER TABLE `tbl_warehouses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_warehouses_code` (`warehouse_code`),
  ADD KEY `idx_warehouses_active` (`is_active`),
  ADD KEY `idx_warehouses_deleted_at` (`deleted_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_allocation_methods`
--
ALTER TABLE `tbl_allocation_methods`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_cash_flow`
--
ALTER TABLE `tbl_cash_flow`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_categories`
--
ALTER TABLE `tbl_categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_collections`
--
ALTER TABLE `tbl_collections`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_collection_products`
--
ALTER TABLE `tbl_collection_products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_collection_types`
--
ALTER TABLE `tbl_collection_types`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_cost_components`
--
ALTER TABLE `tbl_cost_components`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tbl_couriers`
--
ALTER TABLE `tbl_couriers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_courier_rates`
--
ALTER TABLE `tbl_courier_rates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_customers`
--
ALTER TABLE `tbl_customers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_delivery_statuses`
--
ALTER TABLE `tbl_delivery_statuses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_expenses`
--
ALTER TABLE `tbl_expenses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_expense_allocations`
--
ALTER TABLE `tbl_expense_allocations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_expense_categories`
--
ALTER TABLE `tbl_expense_categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tbl_financial_transactions`
--
ALTER TABLE `tbl_financial_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_friends`
--
ALTER TABLE `tbl_friends`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_income`
--
ALTER TABLE `tbl_income`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_inventory`
--
ALTER TABLE `tbl_inventory`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_inventory_adjustments`
--
ALTER TABLE `tbl_inventory_adjustments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_inventory_batches`
--
ALTER TABLE `tbl_inventory_batches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_inventory_transactions`
--
ALTER TABLE `tbl_inventory_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_inventory_transaction_types`
--
ALTER TABLE `tbl_inventory_transaction_types`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `tbl_marketing_campaigns`
--
ALTER TABLE `tbl_marketing_campaigns`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_marketing_platforms`
--
ALTER TABLE `tbl_marketing_platforms`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_orders`
--
ALTER TABLE `tbl_orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_order_items`
--
ALTER TABLE `tbl_order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_order_returns`
--
ALTER TABLE `tbl_order_returns`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_order_return_items`
--
ALTER TABLE `tbl_order_return_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_order_statuses`
--
ALTER TABLE `tbl_order_statuses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tbl_order_status_history`
--
ALTER TABLE `tbl_order_status_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_payment_statuses`
--
ALTER TABLE `tbl_payment_statuses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_products`
--
ALTER TABLE `tbl_products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_product_cost_history`
--
ALTER TABLE `tbl_product_cost_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_product_cost_ledger`
--
ALTER TABLE `tbl_product_cost_ledger`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_product_profit_snapshots`
--
ALTER TABLE `tbl_product_profit_snapshots`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_product_variants`
--
ALTER TABLE `tbl_product_variants`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_profit_loss`
--
ALTER TABLE `tbl_profit_loss`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_purchase_orders`
--
ALTER TABLE `tbl_purchase_orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_purchase_order_items`
--
ALTER TABLE `tbl_purchase_order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_purchase_order_statuses`
--
ALTER TABLE `tbl_purchase_order_statuses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_refund_statuses`
--
ALTER TABLE `tbl_refund_statuses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_return_statuses`
--
ALTER TABLE `tbl_return_statuses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_settings`
--
ALTER TABLE `tbl_settings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_shipments`
--
ALTER TABLE `tbl_shipments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_shipment_cost_allocations`
--
ALTER TABLE `tbl_shipment_cost_allocations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_shipment_purchase_orders`
--
ALTER TABLE `tbl_shipment_purchase_orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_shipment_statuses`
--
ALTER TABLE `tbl_shipment_statuses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_stock_reservations`
--
ALTER TABLE `tbl_stock_reservations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_stock_transfers`
--
ALTER TABLE `tbl_stock_transfers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_suppliers`
--
ALTER TABLE `tbl_suppliers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_warehouses`
--
ALTER TABLE `tbl_warehouses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_categories`
--
ALTER TABLE `tbl_categories`
  ADD CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_category_id`) REFERENCES `tbl_categories` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_collections`
--
ALTER TABLE `tbl_collections`
  ADD CONSTRAINT `fk_collections_type` FOREIGN KEY (`collection_type_id`) REFERENCES `tbl_collection_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tbl_collection_products`
--
ALTER TABLE `tbl_collection_products`
  ADD CONSTRAINT `fk_collection_products_collection` FOREIGN KEY (`collection_id`) REFERENCES `tbl_collections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_collection_products_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_courier_rates`
--
ALTER TABLE `tbl_courier_rates`
  ADD CONSTRAINT `fk_courier_rates_courier` FOREIGN KEY (`courier_id`) REFERENCES `tbl_couriers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_expenses`
--
ALTER TABLE `tbl_expenses`
  ADD CONSTRAINT `fk_expenses_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `tbl_marketing_campaigns` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expenses_category` FOREIGN KEY (`expense_category_id`) REFERENCES `tbl_expense_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expenses_component` FOREIGN KEY (`cost_component_id`) REFERENCES `tbl_cost_components` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tbl_expense_allocations`
--
ALTER TABLE `tbl_expense_allocations`
  ADD CONSTRAINT `fk_expense_allocations_collection` FOREIGN KEY (`collection_id`) REFERENCES `tbl_collections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_allocations_expense` FOREIGN KEY (`expense_id`) REFERENCES `tbl_expenses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_expense_allocations_method` FOREIGN KEY (`allocation_method_id`) REFERENCES `tbl_allocation_methods` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_expense_categories`
--
ALTER TABLE `tbl_expense_categories`
  ADD CONSTRAINT `fk_expense_categories_parent` FOREIGN KEY (`parent_category_id`) REFERENCES `tbl_expense_categories` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_inventory`
--
ALTER TABLE `tbl_inventory`
  ADD CONSTRAINT `fk_inventory_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `tbl_warehouses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_inventory_adjustments`
--
ALTER TABLE `tbl_inventory_adjustments`
  ADD CONSTRAINT `fk_inventory_adjustments_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_adjustments_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `tbl_warehouses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_inventory_batches`
--
ALTER TABLE `tbl_inventory_batches`
  ADD CONSTRAINT `fk_inventory_batches_po_item` FOREIGN KEY (`purchase_order_item_id`) REFERENCES `tbl_purchase_order_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_batches_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `tbl_shipments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_batches_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_batches_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `tbl_warehouses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_inventory_transactions`
--
ALTER TABLE `tbl_inventory_transactions`
  ADD CONSTRAINT `fk_inventory_transactions_batch` FOREIGN KEY (`batch_id`) REFERENCES `tbl_inventory_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_transactions_type` FOREIGN KEY (`transaction_type_id`) REFERENCES `tbl_inventory_transaction_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_transactions_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_transactions_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `tbl_warehouses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_marketing_campaigns`
--
ALTER TABLE `tbl_marketing_campaigns`
  ADD CONSTRAINT `fk_marketing_campaigns_platform` FOREIGN KEY (`platform_id`) REFERENCES `tbl_marketing_platforms` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_orders`
--
ALTER TABLE `tbl_orders`
  ADD CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `tbl_customers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_delivery_status` FOREIGN KEY (`delivery_status_id`) REFERENCES `tbl_delivery_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_payment_status` FOREIGN KEY (`payment_status_id`) REFERENCES `tbl_payment_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_refund_status` FOREIGN KEY (`refund_status_id`) REFERENCES `tbl_refund_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_return_status` FOREIGN KEY (`return_status_id`) REFERENCES `tbl_return_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_status` FOREIGN KEY (`order_status_id`) REFERENCES `tbl_order_statuses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_order_items`
--
ALTER TABLE `tbl_order_items`
  ADD CONSTRAINT `fk_order_items_batch` FOREIGN KEY (`inventory_batch_id`) REFERENCES `tbl_inventory_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `tbl_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_order_returns`
--
ALTER TABLE `tbl_order_returns`
  ADD CONSTRAINT `fk_order_returns_order` FOREIGN KEY (`order_id`) REFERENCES `tbl_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_returns_status` FOREIGN KEY (`return_status_id`) REFERENCES `tbl_return_statuses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_order_return_items`
--
ALTER TABLE `tbl_order_return_items`
  ADD CONSTRAINT `fk_order_return_items_item` FOREIGN KEY (`order_item_id`) REFERENCES `tbl_order_items` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_return_items_return` FOREIGN KEY (`return_id`) REFERENCES `tbl_order_returns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_order_status_history`
--
ALTER TABLE `tbl_order_status_history`
  ADD CONSTRAINT `fk_order_status_history_order` FOREIGN KEY (`order_id`) REFERENCES `tbl_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_status_history_status` FOREIGN KEY (`status_id`) REFERENCES `tbl_order_statuses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `tbl_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_products`
--
ALTER TABLE `tbl_products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `tbl_categories` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_product_cost_history`
--
ALTER TABLE `tbl_product_cost_history`
  ADD CONSTRAINT `fk_cost_history_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_product_cost_ledger`
--
ALTER TABLE `tbl_product_cost_ledger`
  ADD CONSTRAINT `fk_cost_ledger_batch` FOREIGN KEY (`inventory_batch_id`) REFERENCES `tbl_inventory_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cost_ledger_component` FOREIGN KEY (`cost_component_id`) REFERENCES `tbl_cost_components` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cost_ledger_expense` FOREIGN KEY (`expense_id`) REFERENCES `tbl_expenses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cost_ledger_method` FOREIGN KEY (`allocation_method_id`) REFERENCES `tbl_allocation_methods` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cost_ledger_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_product_profit_snapshots`
--
ALTER TABLE `tbl_product_profit_snapshots`
  ADD CONSTRAINT `fk_profit_snapshots_batch` FOREIGN KEY (`inventory_batch_id`) REFERENCES `tbl_inventory_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_profit_snapshots_customer` FOREIGN KEY (`customer_id`) REFERENCES `tbl_customers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_profit_snapshots_item` FOREIGN KEY (`order_item_id`) REFERENCES `tbl_order_items` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_profit_snapshots_order` FOREIGN KEY (`order_id`) REFERENCES `tbl_orders` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_profit_snapshots_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_product_variants`
--
ALTER TABLE `tbl_product_variants`
  ADD CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_purchase_orders`
--
ALTER TABLE `tbl_purchase_orders`
  ADD CONSTRAINT `fk_purchase_orders_friend` FOREIGN KEY (`friend_id`) REFERENCES `tbl_friends` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_purchase_orders_status` FOREIGN KEY (`status_id`) REFERENCES `tbl_purchase_order_statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_purchase_orders_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `tbl_suppliers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_purchase_orders_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `tbl_warehouses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_purchase_order_items`
--
ALTER TABLE `tbl_purchase_order_items`
  ADD CONSTRAINT `fk_purchase_order_items_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `tbl_purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_purchase_order_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_shipments`
--
ALTER TABLE `tbl_shipments`
  ADD CONSTRAINT `fk_shipments_status` FOREIGN KEY (`status_id`) REFERENCES `tbl_shipment_statuses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_shipment_cost_allocations`
--
ALTER TABLE `tbl_shipment_cost_allocations`
  ADD CONSTRAINT `fk_shipment_cost_allocations_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `tbl_shipments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_shipment_cost_allocations_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_shipment_purchase_orders`
--
ALTER TABLE `tbl_shipment_purchase_orders`
  ADD CONSTRAINT `fk_shipment_purchase_orders_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `tbl_purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_shipment_purchase_orders_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `tbl_shipments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_stock_reservations`
--
ALTER TABLE `tbl_stock_reservations`
  ADD CONSTRAINT `fk_stock_reservations_batch` FOREIGN KEY (`inventory_batch_id`) REFERENCES `tbl_inventory_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_reservations_item` FOREIGN KEY (`order_item_id`) REFERENCES `tbl_order_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_reservations_order` FOREIGN KEY (`order_id`) REFERENCES `tbl_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_reservations_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_reservations_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `tbl_warehouses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `tbl_stock_transfers`
--
ALTER TABLE `tbl_stock_transfers`
  ADD CONSTRAINT `fk_stock_transfers_from` FOREIGN KEY (`from_warehouse_id`) REFERENCES `tbl_warehouses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_transfers_to` FOREIGN KEY (`to_warehouse_id`) REFERENCES `tbl_warehouses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_transfers_variant` FOREIGN KEY (`variant_id`) REFERENCES `tbl_product_variants` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
