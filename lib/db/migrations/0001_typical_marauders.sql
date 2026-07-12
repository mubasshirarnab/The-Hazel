ALTER TABLE `tbl_product_variants` MODIFY COLUMN `variant_code` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `tbl_products` MODIFY COLUMN `product_code` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `tbl_products` MODIFY COLUMN `sku` varchar(100) NOT NULL;