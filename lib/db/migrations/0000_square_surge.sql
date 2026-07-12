CREATE TABLE `tbl_allocation_methods` (
	`id` int NOT NULL,
	`method_code` varchar(50) NOT NULL,
	`method_name` varchar(100) NOT NULL,
	`is_active` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `tbl_allocation_methods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_cash_flow` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`cash_flow_code` varchar(32) NOT NULL DEFAULT '',
	`entry_date` date NOT NULL,
	`entry_type` varchar(20) NOT NULL,
	`amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`currency` char(3) NOT NULL DEFAULT 'BDT',
	`source_type` varchar(50),
	`source_id` int,
	`description` varchar(255),
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_cash_flow_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_cash_flow_cash_flow_code_unique` UNIQUE(`cash_flow_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_categories` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`category_code` varchar(50) NOT NULL,
	`category_name` varchar(150) NOT NULL,
	`parent_category_id` int,
	`description` text,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_categories_category_code_unique` UNIQUE(`category_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_collection_products` (
	`id` bigint NOT NULL,
	`collection_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_collection_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_collections` (
	`id` int NOT NULL,
	`collection_code` varchar(32) NOT NULL,
	`collection_name` varchar(150) NOT NULL,
	`collection_type_id` int,
	`description` text,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`deleted_at` datetime,
	CONSTRAINT `tbl_collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_collections_collection_code_unique` UNIQUE(`collection_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_cost_components` (
	`id` int NOT NULL,
	`component_code` varchar(50) NOT NULL,
	`component_name` varchar(150) NOT NULL,
	`component_group` varchar(50),
	`is_active` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `tbl_cost_components_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_customers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`customer_code` varchar(32) NOT NULL DEFAULT '',
	`customer_name` varchar(255) NOT NULL,
	`phone` varchar(30),
	`facebook_name` varchar(255),
	`address` text,
	`district` varchar(150),
	`payment_preference` varchar(100),
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_customers_customer_code_unique` UNIQUE(`customer_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_delivery_statuses` (
	`id` int NOT NULL,
	`status_code` varchar(50) NOT NULL,
	`status_name` varchar(100) NOT NULL,
	`is_active` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `tbl_delivery_statuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_expense_allocations` (
	`id` bigint NOT NULL,
	`expense_id` bigint NOT NULL,
	`allocation_method_id` int NOT NULL,
	`target_type` varchar(30) NOT NULL,
	`target_id` int NOT NULL,
	`collection_id` int,
	`quantity_basis` decimal(14,2) NOT NULL DEFAULT '0.00',
	`value_basis` decimal(14,2) NOT NULL DEFAULT '0.00',
	`allocation_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_expense_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_expense_categories` (
	`id` int NOT NULL,
	`category_code` varchar(50) NOT NULL,
	`category_name` varchar(150) NOT NULL,
	`parent_category_id` int,
	`is_active` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `tbl_expense_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_expenses` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`expense_code` varchar(32) NOT NULL DEFAULT '',
	`expense_category_id` int NOT NULL,
	`campaign_id` int,
	`cost_component_id` int,
	`expense_name` varchar(255) NOT NULL,
	`expense_type` varchar(100) NOT NULL,
	`expense_date` date NOT NULL,
	`amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`currency` char(3) NOT NULL DEFAULT 'BDT',
	`exchange_rate` decimal(12,4) NOT NULL DEFAULT '1.0000',
	`reference_type` varchar(50),
	`reference_id` int,
	`notes` text,
	`expense_status` varchar(30) NOT NULL DEFAULT 'posted',
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_expenses_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_expenses_expense_code_unique` UNIQUE(`expense_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_friends` (
	`id` int NOT NULL,
	`friend_code` varchar(32) NOT NULL,
	`friend_name` varchar(255) NOT NULL,
	`contact_name` varchar(150),
	`phone` varchar(30),
	`address` text,
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`deleted_at` datetime,
	CONSTRAINT `tbl_friends_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_friends_friend_code_unique` UNIQUE(`friend_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_income` (
	`id` bigint NOT NULL,
	`income_code` varchar(32) NOT NULL,
	`source_type` varchar(50) NOT NULL,
	`source_id` int NOT NULL,
	`entry_date` date NOT NULL,
	`amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`currency` char(3) NOT NULL DEFAULT 'BDT',
	`description` varchar(255),
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	CONSTRAINT `tbl_income_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_income_income_code_unique` UNIQUE(`income_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_inventory` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`variant_id` int NOT NULL,
	`warehouse_id` int NOT NULL,
	`current_stock` int NOT NULL DEFAULT 0,
	`reserved_stock` int NOT NULL DEFAULT 0,
	`returned_stock` int NOT NULL DEFAULT 0,
	`damaged_stock` int NOT NULL DEFAULT 0,
	`total_purchased` int NOT NULL DEFAULT 0,
	`total_sold` int NOT NULL DEFAULT 0,
	`unit_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
	`inventory_value` decimal(14,2) NOT NULL DEFAULT '0.00',
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_marketing_campaigns` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`campaign_code` varchar(32) NOT NULL DEFAULT '',
	`campaign_name` varchar(255) NOT NULL,
	`platform_id` int NOT NULL,
	`start_date` date,
	`end_date` date,
	`budget_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`spend_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`revenue_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`orders_generated` int NOT NULL DEFAULT 0,
	`campaign_status` varchar(30) NOT NULL DEFAULT 'active',
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_marketing_campaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_marketing_campaigns_campaign_code_unique` UNIQUE(`campaign_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_marketing_platforms` (
	`id` int NOT NULL,
	`platform_code` varchar(50) NOT NULL,
	`platform_name` varchar(100) NOT NULL,
	`is_active` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `tbl_marketing_platforms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_order_items` (
	`id` bigint NOT NULL,
	`order_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`inventory_batch_id` bigint,
	`quantity` int NOT NULL,
	`reserved_quantity` int NOT NULL DEFAULT 0,
	`selling_price` decimal(12,2) NOT NULL DEFAULT '0.00',
	`discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`actual_cost_at_sale` decimal(12,2) NOT NULL DEFAULT '0.00',
	`profit_amount` decimal(12,2),
	`item_status` varchar(30) NOT NULL DEFAULT 'active',
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_order_returns` (
	`id` bigint NOT NULL,
	`return_code` varchar(32) NOT NULL,
	`order_id` int NOT NULL,
	`return_date` date NOT NULL,
	`return_reason` varchar(255),
	`return_status_id` int NOT NULL,
	`total_refund_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_order_returns_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_order_returns_return_code_unique` UNIQUE(`return_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_order_status_history` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`status_id` int NOT NULL,
	`changed_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`changed_by` varchar(100),
	`notes` text,
	CONSTRAINT `tbl_order_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_order_statuses` (
	`id` int NOT NULL,
	`status_code` varchar(50) NOT NULL,
	`status_name` varchar(100) NOT NULL,
	`is_active` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `tbl_order_statuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_number` varchar(32) NOT NULL,
	`customer_id` int NOT NULL,
	`order_date` date NOT NULL,
	`order_type` varchar(20) NOT NULL DEFAULT 'in_stock',
	`order_status_id` int NOT NULL,
	`payment_status_id` int NOT NULL,
	`delivery_status_id` int NOT NULL,
	`refund_status_id` int NOT NULL,
	`return_status_id` int NOT NULL,
	`subtotal` decimal(14,2) NOT NULL DEFAULT '0.00',
	`discount_total` decimal(14,2) NOT NULL DEFAULT '0.00',
	`shipping_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`grand_total` decimal(14,2) NOT NULL DEFAULT '0.00',
	`paid_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`outstanding_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`currency` char(3) NOT NULL DEFAULT 'BDT',
	`payment_preference` varchar(100),
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_orders_order_number_unique` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `tbl_payment_statuses` (
	`id` int NOT NULL,
	`status_code` varchar(50) NOT NULL,
	`status_name` varchar(100) NOT NULL,
	`is_active` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `tbl_payment_statuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_payments` (
	`id` bigint NOT NULL,
	`payment_code` varchar(32) NOT NULL,
	`order_id` int NOT NULL,
	`payment_date` date NOT NULL,
	`payment_type` varchar(50) NOT NULL,
	`amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`currency` char(3) NOT NULL DEFAULT 'BDT',
	`payment_status` varchar(30) NOT NULL DEFAULT 'pending',
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_payments_payment_code_unique` UNIQUE(`payment_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_product_cost_ledger` (
	`id` bigint NOT NULL,
	`ledger_code` varchar(32) NOT NULL,
	`variant_id` int NOT NULL,
	`inventory_batch_id` bigint,
	`expense_id` bigint,
	`cost_component_id` int NOT NULL,
	`allocation_method_id` int,
	`allocated_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`cost_per_unit` decimal(12,2) NOT NULL DEFAULT '0.00',
	`effective_date` date NOT NULL,
	`reference_type` varchar(50),
	`reference_id` int,
	`created_by` varchar(100),
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_product_cost_ledger_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_product_cost_ledger_ledger_code_unique` UNIQUE(`ledger_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_product_variants` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`variant_code` varchar(32) NOT NULL DEFAULT '',
	`color_name` varchar(100) NOT NULL,
	`selling_price` decimal(12,2) NOT NULL DEFAULT '0.00',
	`purchase_price_bdt` decimal(12,2) NOT NULL DEFAULT '0.00',
	`current_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
	`costing_method` varchar(30) NOT NULL DEFAULT 'weighted_average',
	`variant_status` varchar(30) NOT NULL DEFAULT 'active',
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_product_variants_variant_code_unique` UNIQUE(`variant_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_products` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`product_code` varchar(32) NOT NULL DEFAULT '',
	`sku` varchar(100) NOT NULL DEFAULT '',
	`product_name` varchar(255) NOT NULL,
	`category_id` int,
	`product_status` varchar(30) NOT NULL DEFAULT 'active',
	`purchase_link` varchar(500),
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_products_product_code_unique` UNIQUE(`product_code`),
	CONSTRAINT `tbl_products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `tbl_profit_loss` (
	`id` bigint NOT NULL,
	`period_start` date NOT NULL,
	`period_end` date NOT NULL,
	`revenue` decimal(14,2) NOT NULL DEFAULT '0.00',
	`cogs` decimal(14,2) NOT NULL DEFAULT '0.00',
	`gross_profit` decimal(14,2) NOT NULL DEFAULT '0.00',
	`expenses` decimal(14,2) NOT NULL DEFAULT '0.00',
	`net_profit` decimal(14,2) NOT NULL DEFAULT '0.00',
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_profit_loss_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_purchase_order_items` (
	`id` bigint NOT NULL,
	`purchase_order_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`quantity` int NOT NULL,
	`unit_purchase_price_rmb` decimal(12,2) NOT NULL DEFAULT '0.00',
	`unit_purchase_price_bdt` decimal(12,2) NOT NULL DEFAULT '0.00',
	`received_quantity` int NOT NULL DEFAULT 0,
	`unit_landed_cost_bdt` decimal(12,2) NOT NULL DEFAULT '0.00',
	`line_total_bdt` decimal(14,2) NOT NULL DEFAULT '0.00',
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_purchase_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_purchase_order_statuses` (
	`id` int NOT NULL,
	`status_code` varchar(50) NOT NULL,
	`status_name` varchar(100) NOT NULL,
	`is_active` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `tbl_purchase_order_statuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_purchase_orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`purchase_order_number` varchar(32) NOT NULL DEFAULT '',
	`supplier_id` int,
	`friend_id` int,
	`warehouse_id` int NOT NULL,
	`purchase_date` date NOT NULL,
	`friend_payment_date` date,
	`historical_rmb_rate` decimal(12,4) NOT NULL DEFAULT '0.0000',
	`china_local_delivery_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
	`status_id` int NOT NULL,
	`total_amount_bdt` decimal(14,2) NOT NULL DEFAULT '0.00',
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_purchase_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_purchase_orders_purchase_order_number_unique` UNIQUE(`purchase_order_number`)
);
--> statement-breakpoint
CREATE TABLE `tbl_refund_statuses` (
	`id` int NOT NULL,
	`status_code` varchar(50) NOT NULL,
	`status_name` varchar(100) NOT NULL,
	`is_active` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `tbl_refund_statuses_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_refund_statuses_status_code_unique` UNIQUE(`status_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_return_statuses` (
	`id` int NOT NULL,
	`status_code` varchar(50) NOT NULL,
	`status_name` varchar(100) NOT NULL,
	`is_active` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `tbl_return_statuses_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_return_statuses_status_code_unique` UNIQUE(`status_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_settings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`setting_key` varchar(100) NOT NULL,
	`setting_value` varchar(500),
	`setting_type` varchar(50) NOT NULL DEFAULT 'string',
	`description` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_settings_setting_key_unique` UNIQUE(`setting_key`)
);
--> statement-breakpoint
CREATE TABLE `tbl_shipment_cost_allocations` (
	`id` bigint NOT NULL,
	`shipment_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`allocation_amount_bdt` decimal(12,2) NOT NULL DEFAULT '0.00',
	`allocation_basis_quantity` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_shipment_cost_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_shipment_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shipment_id` bigint NOT NULL,
	`purchase_order_item_id` bigint NOT NULL,
	`variant_id` int NOT NULL,
	`quantity_shipped` int NOT NULL DEFAULT 0,
	`quantity_received` int NOT NULL DEFAULT 0,
	`carton_number` varchar(50),
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_shipment_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_shipment_purchase_orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shipment_id` int NOT NULL,
	`purchase_order_id` int NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_shipment_purchase_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_shipment_statuses` (
	`id` int NOT NULL,
	`status_code` varchar(50) NOT NULL,
	`status_name` varchar(100) NOT NULL,
	`is_active` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `tbl_shipment_statuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tbl_shipments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shipment_number` varchar(32) NOT NULL DEFAULT '',
	`departure_date` date,
	`warehouse_arrival_date` date,
	`bangladesh_arrival_date` date,
	`weight_kg` decimal(10,2) NOT NULL DEFAULT '0.00',
	`shipping_rate_per_kg` decimal(10,2) NOT NULL DEFAULT '0.00',
	`shipping_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
	`status_id` int NOT NULL,
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_shipments_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_shipments_shipment_number_unique` UNIQUE(`shipment_number`)
);
--> statement-breakpoint
CREATE TABLE `tbl_stock_reservations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`reservation_number` varchar(32) NOT NULL DEFAULT '',
	`order_id` int,
	`order_item_id` bigint,
	`variant_id` int NOT NULL,
	`inventory_batch_id` bigint,
	`warehouse_id` int NOT NULL,
	`reserved_quantity` int NOT NULL DEFAULT 0,
	`released_quantity` int NOT NULL DEFAULT 0,
	`reservation_status` varchar(30) NOT NULL DEFAULT 'reserved',
	`created_date` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`released_date` datetime,
	`reservation_reason` varchar(255),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `tbl_stock_reservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_stock_reservations_reservation_number_unique` UNIQUE(`reservation_number`)
);
--> statement-breakpoint
CREATE TABLE `tbl_suppliers` (
	`id` int NOT NULL,
	`supplier_code` varchar(32) NOT NULL,
	`supplier_name` varchar(255) NOT NULL,
	`contact_name` varchar(150),
	`phone` varchar(30),
	`email` varchar(150),
	`address` text,
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`deleted_at` datetime,
	CONSTRAINT `tbl_suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_suppliers_supplier_code_unique` UNIQUE(`supplier_code`)
);
--> statement-breakpoint
CREATE TABLE `tbl_users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(150) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` varchar(50) NOT NULL,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_users_user_code_unique` UNIQUE(`user_code`),
	CONSTRAINT `tbl_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `tbl_warehouses` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`warehouse_code` varchar(50) NOT NULL,
	`warehouse_name` varchar(150) NOT NULL,
	`country` varchar(100) NOT NULL DEFAULT 'Bangladesh',
	`city` varchar(100),
	`address` text,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`created_by` varchar(100),
	`updated_by` varchar(100),
	`deleted_at` datetime,
	CONSTRAINT `tbl_warehouses_id` PRIMARY KEY(`id`),
	CONSTRAINT `tbl_warehouses_warehouse_code_unique` UNIQUE(`warehouse_code`)
);
