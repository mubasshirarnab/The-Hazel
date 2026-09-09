-- =====================================================================
-- The Hazel ERP — Migration 0003: Create tbl_inventory_transactions
-- Run this file against hazel_erp database AFTER taking a full backup.
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Create the table
CREATE TABLE IF NOT EXISTS `tbl_inventory_transactions` (
  `id`                  BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_code`    VARCHAR(32)         NOT NULL,
  `transaction_type_id` INT(10) UNSIGNED    NOT NULL,
  `variant_id`          INT(10) UNSIGNED    NOT NULL,
  `batch_id`            BIGINT(20) UNSIGNED DEFAULT NULL,
  `warehouse_id`        INT(10) UNSIGNED    NOT NULL,
  `quantity`            INT(11)             NOT NULL,
  `unit_cost`           DECIMAL(12,2)       NOT NULL DEFAULT 0.00,
  `reference_type`      VARCHAR(50)         DEFAULT NULL,
  `reference_id`        INT(10) UNSIGNED    DEFAULT NULL,
  `notes`               TEXT                DEFAULT NULL,
  `created_at`          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by`          VARCHAR(100)        DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inventory_transactions_code` (`transaction_code`),
  KEY `idx_inventory_transactions_variant`   (`variant_id`),
  KEY `idx_inventory_transactions_warehouse` (`warehouse_id`),
  KEY `idx_inventory_transactions_type`      (`transaction_type_id`),
  KEY `idx_inventory_transactions_created_at`(`created_at`),
  KEY `idx_inventory_transactions_batch`     (`batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Foreign keys
ALTER TABLE `tbl_inventory_transactions`
  ADD CONSTRAINT `fk_inventory_transactions_batch`
    FOREIGN KEY (`batch_id`)        REFERENCES `tbl_inventory_batches` (`id`)              ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_transactions_type`
    FOREIGN KEY (`transaction_type_id`) REFERENCES `tbl_inventory_transaction_types` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_transactions_variant`
    FOREIGN KEY (`variant_id`)      REFERENCES `tbl_product_variants` (`id`)               ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_transactions_warehouse`
    FOREIGN KEY (`warehouse_id`)    REFERENCES `tbl_warehouses` (`id`)                     ON UPDATE CASCADE;

-- Trigger: auto-create an inventory batch on stock-in transactions.
-- NOTE: MySQL forbids updating the same table inside an AFTER INSERT trigger,
--       so batch_id is NOT back-filled here. The stored procedure
--       sp_adjust_inventory must insert with batch_id already resolved,
--       or a second UPDATE statement must be issued by the caller.
DROP TRIGGER IF EXISTS `trg_inventory_transactions_after_insert`;

DELIMITER $$
CREATE TRIGGER `trg_inventory_transactions_after_insert`
AFTER INSERT ON `tbl_inventory_transactions`
FOR EACH ROW
BEGIN
  IF NEW.batch_id IS NULL AND NEW.quantity > 0 THEN
    INSERT INTO tbl_inventory_batches (
      batch_number, variant_id, warehouse_id,
      received_quantity, available_quantity, reserved_quantity,
      sold_quantity, returned_quantity, damaged_quantity,
      landed_cost_per_unit, true_cost_per_unit,
      batch_status, received_date, created_by
    ) VALUES (
      CONCAT('BAT', LPAD((SELECT IFNULL(MAX(id), 0) + 1 FROM tbl_inventory_batches b), 8, '0')),
      NEW.variant_id,
      NEW.warehouse_id,
      NEW.quantity,
      NEW.quantity,
      0, 0, 0, 0,
      NEW.unit_cost,
      NEW.unit_cost,
      'received',
      CURDATE(),
      NEW.created_by
    );
  END IF;
END$$
DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;
