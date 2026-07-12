-- Database Initialization Script for HAZEL ERP

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS `tbl_users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_code` VARCHAR(32) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'staff', 'viewer') NOT NULL DEFAULT 'viewer',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` VARCHAR(100) DEFAULT NULL,
  `updated_by` VARCHAR(100) DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Insert Default Warehouse WH001 (Dhaka Central Warehouse)
-- The stored procedures reference 'WH001' directly, so this must exist.
INSERT INTO `tbl_warehouses` (`warehouse_code`, `warehouse_name`, `country`, `city`, `address`, `is_active`, `created_by`)
VALUES ('WH001', 'Dhaka Central Warehouse', 'Bangladesh', 'Dhaka', 'Dhaka, Bangladesh', 1, 'system')
ON DUPLICATE KEY UPDATE `warehouse_name` = VALUES(`warehouse_name`);
