-- =====================================================================
-- The Hazel ERP — Migration 0002: System Refactor
-- Run this file against hazel_erp database AFTER taking a full backup.
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- STEP 1: DROP all removed-section tables
DROP TABLE IF EXISTS tbl_collection_products;
DROP TABLE IF EXISTS tbl_collections;
DROP TABLE IF EXISTS tbl_marketing_campaigns;
DROP TABLE IF EXISTS tbl_marketing_platforms;
DROP TABLE IF EXISTS tbl_shipment_cost_allocations;
DROP TABLE IF EXISTS tbl_shipment_items;
DROP TABLE IF EXISTS tbl_shipment_purchase_orders;
DROP TABLE IF EXISTS tbl_shipments;
DROP TABLE IF EXISTS tbl_shipment_statuses;
DROP TABLE IF EXISTS tbl_purchase_order_items;
DROP TABLE IF EXISTS tbl_purchase_orders;
DROP TABLE IF EXISTS tbl_purchase_order_statuses;
DROP TABLE IF EXISTS tbl_suppliers;
DROP TABLE IF EXISTS tbl_friends;
DROP TABLE IF EXISTS tbl_product_cost_ledger;
DROP TABLE IF EXISTS tbl_expense_allocations;
DROP TABLE IF EXISTS tbl_expense_categories;
DROP TABLE IF EXISTS tbl_allocation_methods;
DROP TABLE IF EXISTS tbl_cost_components;
DROP TABLE IF EXISTS tbl_order_returns;
DROP TABLE IF EXISTS tbl_refund_statuses;
DROP TABLE IF EXISTS tbl_return_statuses;
DROP TABLE IF EXISTS tbl_income;
DROP TABLE IF EXISTS tbl_payments;
DROP TABLE IF EXISTS tbl_cash_flow;
DROP TABLE IF EXISTS tbl_profit_loss;
DROP TABLE IF EXISTS tbl_customers;

-- STEP 2: Modify tbl_products
ALTER TABLE tbl_products
  CHANGE COLUMN `notes` `product_description` TEXT;

ALTER TABLE tbl_products
  ADD COLUMN `total_weight`      DECIMAL(10,3)  DEFAULT NULL,
  ADD COLUMN `quantity`          INT            DEFAULT NULL,
  ADD COLUMN `shipping_route`    VARCHAR(500)   DEFAULT NULL,
  ADD COLUMN `shipping_rate`     DECIMAL(10,2)  DEFAULT NULL,
  ADD COLUMN `shipping_cost`     DECIMAL(14,2)  DEFAULT NULL,
  ADD COLUMN `other_import_cost` DECIMAL(14,2)  DEFAULT NULL,
  ADD COLUMN `total_cost`        DECIMAL(14,2)  DEFAULT NULL,
  ADD COLUMN `unit_cost`         DECIMAL(12,2)  DEFAULT NULL,
  ADD COLUMN `unit_weight`       DECIMAL(10,3)  DEFAULT NULL;

-- STEP 3: Modify tbl_product_variants
ALTER TABLE tbl_product_variants
  ADD COLUMN `rmb_price` DECIMAL(12,4) DEFAULT NULL,
  ADD COLUMN `rmb_rate`  DECIMAL(10,4) DEFAULT NULL;

-- STEP 4: Modify tbl_inventory
ALTER TABLE tbl_inventory
  DROP COLUMN IF EXISTS `returned_stock`,
  DROP COLUMN IF EXISTS `damaged_stock`;

-- STEP 5: Modify tbl_orders
ALTER TABLE tbl_orders
  ADD COLUMN `customer_name`  VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN `contact`        VARCHAR(100) DEFAULT NULL,
  ADD COLUMN `address`        TEXT         DEFAULT NULL,
  ADD COLUMN `payment_method` VARCHAR(100) DEFAULT NULL;

ALTER TABLE tbl_orders
  DROP COLUMN IF EXISTS `customer_id`,
  DROP COLUMN IF EXISTS `refund_status_id`,
  DROP COLUMN IF EXISTS `return_status_id`,
  DROP COLUMN IF EXISTS `payment_preference`;

-- STEP 6: Redesign tbl_expenses
ALTER TABLE tbl_expenses
  DROP COLUMN IF EXISTS `expense_code`,
  DROP COLUMN IF EXISTS `expense_category_id`,
  DROP COLUMN IF EXISTS `campaign_id`,
  DROP COLUMN IF EXISTS `cost_component_id`,
  DROP COLUMN IF EXISTS `expense_name`,
  DROP COLUMN IF EXISTS `currency`,
  DROP COLUMN IF EXISTS `exchange_rate`,
  DROP COLUMN IF EXISTS `reference_type`,
  DROP COLUMN IF EXISTS `reference_id`,
  DROP COLUMN IF EXISTS `expense_status`,
  DROP COLUMN IF EXISTS `deleted_at`,
  DROP COLUMN IF EXISTS `updated_by`,
  DROP COLUMN IF EXISTS `created_by`;

ALTER TABLE tbl_expenses
  ADD COLUMN `description`     TEXT         DEFAULT NULL,
  ADD COLUMN `product_related` TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN `product_id`      INT          DEFAULT NULL,
  ADD COLUMN `platform`        VARCHAR(150) DEFAULT NULL;

-- STEP 7: Drop old stored procedures
DROP PROCEDURE IF EXISTS sp_receive_shipment;
DROP PROCEDURE IF EXISTS sp_return_order;
DROP PROCEDURE IF EXISTS sp_allocate_product_costs;
DROP PROCEDURE IF EXISTS sp_refresh_profit_loss;

-- STEP 8: Drop obsolete views
DROP VIEW IF EXISTS vw_profit_loss_summary;
DROP VIEW IF EXISTS vw_monthly_revenue;
DROP VIEW IF EXISTS vw_monthly_profit;
DROP VIEW IF EXISTS vw_best_selling_products;
DROP VIEW IF EXISTS vw_best_selling_colors;
DROP VIEW IF EXISTS vw_true_product_cost;
DROP VIEW IF EXISTS vw_cost_allocation_summary;

-- STEP 9: Recreate vw_inventory_value without dead columns
DROP VIEW IF EXISTS vw_inventory_value;

SET FOREIGN_KEY_CHECKS = 1;
