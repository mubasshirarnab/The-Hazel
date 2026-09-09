import { mysqlTable, serial, varchar, text, decimal, int, bigint, tinyint, datetime, date, char } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// 1. Users Table
export const tblUsers = mysqlTable('tbl_users', {
  id: serial('id').primaryKey(),
  userCode: varchar('user_code', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 2. Categories Table
export const tblCategories = mysqlTable('tbl_categories', {
  id: serial('id').primaryKey(),
  categoryCode: varchar('category_code', { length: 50 }).notNull().unique(),
  categoryName: varchar('category_name', { length: 150 }).notNull(),
  parentCategoryId: int('parent_category_id'),
  description: text('description'),
  isActive: tinyint('is_active').notNull().default(1),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 3. Products Table
export const tblProducts = mysqlTable('tbl_products', {
  id: serial('id').primaryKey(),
  productCode: varchar('product_code', { length: 32 }).notNull().unique(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  categoryId: int('category_id'),
  productStatus: varchar('product_status', { length: 30 }).notNull().default('active'),
  purchaseLink: varchar('purchase_link', { length: 500 }),
  productDescription: text('product_description'),
  // Shipping & Import Cost fields
  totalWeight: decimal('total_weight', { precision: 10, scale: 3 }),
  quantity: int('quantity'),
  shippingRoute: varchar('shipping_route', { length: 500 }),
  shippingRate: decimal('shipping_rate', { precision: 10, scale: 2 }),
  shippingCost: decimal('shipping_cost', { precision: 14, scale: 2 }),
  otherImportCost: decimal('other_import_cost', { precision: 14, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 14, scale: 2 }),
  unitCost: decimal('unit_cost', { precision: 12, scale: 2 }),
  unitWeight: decimal('unit_weight', { precision: 10, scale: 3 }),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 4. Product Variants Table
export const tblProductVariants = mysqlTable('tbl_product_variants', {
  id: serial('id').primaryKey(),
  productId: int('product_id').notNull(),
  variantCode: varchar('variant_code', { length: 32 }).notNull().unique(),
  colorName: varchar('color_name', { length: 100 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 12, scale: 2 }).notNull().default('0.00'),
  // RMB pricing breakdown
  rmbPrice: decimal('rmb_price', { precision: 12, scale: 4 }),
  rmbRate: decimal('rmb_rate', { precision: 10, scale: 4 }),
  purchasePriceBdt: decimal('purchase_price_bdt', { precision: 12, scale: 2 }).notNull().default('0.00'),
  currentCost: decimal('current_cost', { precision: 12, scale: 2 }).notNull().default('0.00'),
  costingMethod: varchar('costing_method', { length: 30 }).notNull().default('weighted_average'),
  variantStatus: varchar('variant_status', { length: 30 }).notNull().default('active'),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 5. Warehouses Table
export const tblWarehouses = mysqlTable('tbl_warehouses', {
  id: serial('id').primaryKey(),
  warehouseCode: varchar('warehouse_code', { length: 50 }).notNull().unique(),
  warehouseName: varchar('warehouse_name', { length: 150 }).notNull(),
  country: varchar('country', { length: 100 }).notNull().default('Bangladesh'),
  city: varchar('city', { length: 100 }),
  address: text('address'),
  isActive: tinyint('is_active').notNull().default(1),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 6. Inventory Table
export const tblInventory = mysqlTable('tbl_inventory', {
  id: serial('id').primaryKey(),
  variantId: int('variant_id').notNull(),
  warehouseId: int('warehouse_id').notNull(),
  currentStock: int('current_stock').notNull().default(0),
  reservedStock: int('reserved_stock').notNull().default(0),
  totalPurchased: int('total_purchased').notNull().default(0),
  totalSold: int('total_sold').notNull().default(0),
  unitCost: decimal('unit_cost', { precision: 12, scale: 2 }).notNull().default('0.00'),
  inventoryValue: decimal('inventory_value', { precision: 14, scale: 2 }).notNull().default('0.00'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 7. Inventory Transactions Table
export const tblInventoryTransactions = mysqlTable('tbl_inventory_transactions', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  transactionCode: varchar('transaction_code', { length: 32 }).notNull().unique(),
  transactionTypeId: int('transaction_type_id').notNull(),
  variantId: int('variant_id').notNull(),
  batchId: bigint('batch_id', { mode: 'number' }),
  warehouseId: int('warehouse_id').notNull(),
  quantity: int('quantity').notNull(),
  unitCost: decimal('unit_cost', { precision: 12, scale: 2 }).notNull().default('0.00'),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: int('reference_id'),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
});

// 8. Order Statuses Lookup Table
export const tblOrderStatuses = mysqlTable('tbl_order_statuses', {
  id: int('id').primaryKey(),
  statusCode: varchar('status_code', { length: 50 }).notNull(),
  statusName: varchar('status_name', { length: 100 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
});

// 8. Payment Statuses Lookup Table
export const tblPaymentStatuses = mysqlTable('tbl_payment_statuses', {
  id: int('id').primaryKey(),
  statusCode: varchar('status_code', { length: 50 }).notNull(),
  statusName: varchar('status_name', { length: 100 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
});

// 9. Delivery Statuses Lookup Table
export const tblDeliveryStatuses = mysqlTable('tbl_delivery_statuses', {
  id: int('id').primaryKey(),
  statusCode: varchar('status_code', { length: 50 }).notNull(),
  statusName: varchar('status_name', { length: 100 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
});

// 10. Orders Table
export const tblOrders = mysqlTable('tbl_orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 32 }).notNull().unique().default(''),
  customerName: varchar('customer_name', { length: 255 }).notNull().default(''),
  contact: varchar('contact', { length: 100 }),
  address: text('address'),
  paymentMethod: varchar('payment_method', { length: 100 }),
  orderDate: date('order_date', { mode: 'string' }).notNull(),
  orderType: varchar('order_type', { length: 20 }).notNull().default('in_stock'),
  orderStatusId: int('order_status_id').notNull(),
  paymentStatusId: int('payment_status_id').notNull(),
  deliveryStatusId: int('delivery_status_id').notNull(),
  subtotal: decimal('subtotal', { precision: 14, scale: 2 }).notNull().default('0.00'),
  discountTotal: decimal('discount_total', { precision: 14, scale: 2 }).notNull().default('0.00'),
  shippingAmount: decimal('shipping_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  grandTotal: decimal('grand_total', { precision: 14, scale: 2 }).notNull().default('0.00'),
  paidAmount: decimal('paid_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  outstandingAmount: decimal('outstanding_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  advancePayment: decimal('advance_payment', { precision: 14, scale: 2 }).notNull().default('0.00'),
  currency: char('currency', { length: 3 }).notNull().default('BDT'),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 11. Order Items Table
export const tblOrderItems = mysqlTable('tbl_order_items', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  orderId: int('order_id').notNull(),
  variantId: int('variant_id').notNull(),
  inventoryBatchId: bigint('inventory_batch_id', { mode: 'number' }),
  quantity: int('quantity').notNull(),
  reservedQuantity: int('reserved_quantity').notNull().default(0),
  sellingPrice: decimal('selling_price', { precision: 12, scale: 2 }).notNull().default('0.00'),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  actualCostAtSale: decimal('actual_cost_at_sale', { precision: 12, scale: 2 }).notNull().default('0.00'),
  profitAmount: decimal('profit_amount', { precision: 12, scale: 2 }),
  itemStatus: varchar('item_status', { length: 30 }).notNull().default('active'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 12. Order Status History Table
export const tblOrderStatusHistory = mysqlTable('tbl_order_status_history', {
  id: serial('id').primaryKey(),
  orderId: int('order_id').notNull(),
  statusId: int('status_id').notNull(),
  changedAt: datetime('changed_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  changedBy: varchar('changed_by', { length: 100 }),
  notes: text('notes'),
});

// 13. Stock Reservations Table
export const tblStockReservations = mysqlTable('tbl_stock_reservations', {
  id: serial('id').primaryKey(),
  reservationCode: varchar('reservation_number', { length: 32 }).notNull().unique(),
  orderId: int('order_id'),
  orderItemId: bigint('order_item_id', { mode: 'number' }),
  variantId: int('variant_id').notNull(),
  inventoryBatchId: bigint('inventory_batch_id', { mode: 'number' }),
  warehouseId: int('warehouse_id').notNull(),
  reservedQuantity: int('reserved_quantity').notNull().default(0),
  releasedQuantity: int('released_quantity').notNull().default(0),
  reservationStatus: varchar('reservation_status', { length: 30 }).notNull().default('reserved'),
  createdDate: datetime('created_date').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  releasedDate: datetime('released_date'),
  reservationReason: varchar('reservation_reason', { length: 255 }),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 14. Business Expenses Table
export const tblExpenses = mysqlTable('tbl_expenses', {
  id: serial('id').primaryKey(),
  expenseDate: date('expense_date', { mode: 'string' }).notNull(),
  expenseType: varchar('expense_type', { length: 100 }).notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  productRelated: tinyint('product_related').notNull().default(0),
  productId: int('product_id'),
  platform: varchar('platform', { length: 150 }),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 15. Settings Table
export const tblSettings = mysqlTable('tbl_settings', {
  id: serial('id').primaryKey(),
  settingKey: varchar('setting_key', { length: 100 }).notNull().unique(),
  settingValue: varchar('setting_value', { length: 500 }),
  settingType: varchar('setting_type', { length: 50 }).notNull().default('string'),
  description: text('description'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});