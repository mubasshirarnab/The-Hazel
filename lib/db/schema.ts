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
  notes: text('notes'),
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
  returnedStock: int('returned_stock').notNull().default(0),
  damagedStock: int('damaged_stock').notNull().default(0),
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

// 7. Customers Table
export const tblCustomers = mysqlTable('tbl_customers', {
  id: serial('id').primaryKey(),
  customerCode: varchar('customer_code', { length: 32 }).notNull().unique(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  facebookName: varchar('facebook_name', { length: 255 }),
  address: text('address'),
  district: varchar('district', { length: 150 }),
  paymentPreference: varchar('payment_preference', { length: 100 }),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 8. Order Statuses Lookup Table
export const tblOrderStatuses = mysqlTable('tbl_order_statuses', {
  id: int('id').primaryKey(),
  statusCode: varchar('status_code', { length: 50 }).notNull(),
  statusName: varchar('status_name', { length: 100 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
});

// 9. Payment Statuses Lookup Table
export const tblPaymentStatuses = mysqlTable('tbl_payment_statuses', {
  id: int('id').primaryKey(),
  statusCode: varchar('status_code', { length: 50 }).notNull(),
  statusName: varchar('status_name', { length: 100 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
});

// 10. Delivery Statuses Lookup Table
export const tblDeliveryStatuses = mysqlTable('tbl_delivery_statuses', {
  id: int('id').primaryKey(),
  statusCode: varchar('status_code', { length: 50 }).notNull(),
  statusName: varchar('status_name', { length: 100 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
});

// 11. Orders Table
export const tblOrders = mysqlTable('tbl_orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 32 }).notNull().unique().default(''),
  customerId: int('customer_id').notNull(),
  orderDate: date('order_date').notNull(),
  orderType: varchar('order_type', { length: 20 }).notNull().default('in_stock'),
  orderStatusId: int('order_status_id').notNull(),
  paymentStatusId: int('payment_status_id').notNull(),
  deliveryStatusId: int('delivery_status_id').notNull(),
  refundStatusId: int('refund_status_id').notNull(),
  returnStatusId: int('return_status_id').notNull(),
  subtotal: decimal('subtotal', { precision: 14, scale: 2 }).notNull().default('0.00'),
  discountTotal: decimal('discount_total', { precision: 14, scale: 2 }).notNull().default('0.00'),
  shippingAmount: decimal('shipping_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  grandTotal: decimal('grand_total', { precision: 14, scale: 2 }).notNull().default('0.00'),
  paidAmount: decimal('paid_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  outstandingAmount: decimal('outstanding_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  currency: char('currency', { length: 3 }).notNull().default('BDT'),
  paymentPreference: varchar('payment_preference', { length: 100 }),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 12. Order Items Table
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

// 13. Order Returns Table
export const tblOrderReturns = mysqlTable('tbl_order_returns', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  returnCode: varchar('return_code', { length: 32 }).notNull().unique(),
  orderId: int('order_id').notNull(),
  returnDate: date('return_date').notNull(),
  returnReason: varchar('return_reason', { length: 255 }),
  returnStatusId: int('return_status_id').notNull(),
  totalRefundAmount: decimal('total_refund_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 14. Purchase Order Statuses Lookup Table
export const tblPurchaseOrderStatuses = mysqlTable('tbl_purchase_order_statuses', {
  id: int('id').primaryKey(),
  statusCode: varchar('status_code', { length: 50 }).notNull(),
  statusName: varchar('status_name', { length: 100 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
});

// 15. Suppliers Table
export const tblSuppliers = mysqlTable('tbl_suppliers', {
  id: int('id').primaryKey(),
  supplierCode: varchar('supplier_code', { length: 32 }).notNull().unique(),
  supplierName: varchar('supplier_name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 150 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 150 }),
  address: text('address'),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  deletedAt: datetime('deleted_at'),
});

// 16. Friends Table (China Agents)
export const tblFriends = mysqlTable('tbl_friends', {
  id: int('id').primaryKey(),
  friendCode: varchar('friend_code', { length: 32 }).notNull().unique(),
  friendName: varchar('friend_name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 150 }),
  phone: varchar('phone', { length: 30 }),
  address: text('address'),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  deletedAt: datetime('deleted_at'),
});

// 17. Purchase Orders Table
export const tblPurchaseOrders = mysqlTable('tbl_purchase_orders', {
  id: serial('id').primaryKey(),
  purchaseOrderNumber: varchar('purchase_order_number', { length: 32 }).notNull().unique(),
  supplierId: int('supplier_id'),
  friendId: int('friend_id'),
  warehouseId: int('warehouse_id').notNull(),
  purchaseDate: date('purchase_date').notNull(),
  friendPaymentDate: date('friend_payment_date'),
  historicalRmbRate: decimal('historical_rmb_rate', { precision: 12, scale: 4 }).notNull().default('0.0000'),
  chinaLocalDeliveryCost: decimal('china_local_delivery_cost', { precision: 12, scale: 2 }).notNull().default('0.00'),
  statusId: int('status_id').notNull(),
  totalAmountBdt: decimal('total_amount_bdt', { precision: 14, scale: 2 }).notNull().default('0.00'),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 18. Purchase Order Items Table
export const tblPurchaseOrderItems = mysqlTable('tbl_purchase_order_items', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  purchaseOrderId: int('purchase_order_id').notNull(),
  variantId: int('variant_id').notNull(),
  quantity: int('quantity').notNull(),
  unitPurchasePriceRmb: decimal('unit_purchase_price_rmb', { precision: 12, scale: 2 }).notNull().default('0.00'),
  unitPurchasePriceBdt: decimal('unit_purchase_price_bdt', { precision: 12, scale: 2 }).notNull().default('0.00'),
  receivedQuantity: int('received_quantity').notNull().default(0),
  unitLandedCostBdt: decimal('unit_landed_cost_bdt', { precision: 12, scale: 2 }).notNull().default('0.00'),
  lineTotalBdt: decimal('line_total_bdt', { precision: 14, scale: 2 }).notNull().default('0.00'),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 19. Shipments Table
export const tblShipments = mysqlTable('tbl_shipments', {
  id: serial('id').primaryKey(),
  shipmentNumber: varchar('shipment_number', { length: 32 }).notNull().unique(),
  departureDate: date('departure_date'),
  warehouseArrivalDate: date('warehouse_arrival_date'),
  bangladeshArrivalDate: date('bangladesh_arrival_date'),
  weightKg: decimal('weight_kg', { precision: 10, scale: 2 }).notNull().default('0.00'),
  shippingRatePerKg: decimal('shipping_rate_per_kg', { precision: 10, scale: 2 }).notNull().default('0.00'),
  shippingCost: decimal('shipping_cost', { precision: 12, scale: 2 }).notNull().default('0.00'),
  statusId: int('status_id').notNull(),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 20. Shipment Purchase Orders Relation
export const tblShipmentPurchaseOrders = mysqlTable('tbl_shipment_purchase_orders', {
  id: serial('id').primaryKey(),
  shipmentId: int('shipment_id').notNull(),
  purchaseOrderId: int('purchase_order_id').notNull(),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 21. Shipment Cost Allocations Table
export const tblShipmentCostAllocations = mysqlTable('tbl_shipment_cost_allocations', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  shipmentId: int('shipment_id').notNull(),
  variantId: int('variant_id').notNull(),
  allocationAmountBdt: decimal('allocation_amount_bdt', { precision: 12, scale: 2 }).notNull().default('0.00'),
  allocationBasisQuantity: int('allocation_basis_quantity').notNull().default(0),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 22. Shipment Statuses Lookup Table
export const tblShipmentStatuses = mysqlTable('tbl_shipment_statuses', {
  id: int('id').primaryKey(),
  statusCode: varchar('status_code', { length: 50 }).notNull(),
  statusName: varchar('status_name', { length: 100 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
});

// 23. Expense Categories Lookup Table
export const tblExpenseCategories = mysqlTable('tbl_expense_categories', {
  id: int('id').primaryKey(),
  categoryCode: varchar('category_code', { length: 50 }).notNull(),
  categoryName: varchar('category_name', { length: 150 }).notNull(),
  parentCategoryId: int('parent_category_id'),
  isActive: tinyint('is_active').notNull().default(1),
});

// 24. Cost Components Table
export const tblCostComponents = mysqlTable('tbl_cost_components', {
  id: int('id').primaryKey(),
  componentCode: varchar('component_code', { length: 50 }).notNull(),
  componentName: varchar('component_name', { length: 150 }).notNull(),
  componentGroup: varchar('component_group', { length: 50 }),
  isActive: tinyint('is_active').notNull().default(1),
});

// 25. Expenses Table
export const tblExpenses = mysqlTable('tbl_expenses', {
  id: serial('id').primaryKey(),
  expenseCode: varchar('expense_code', { length: 32 }).notNull().unique(),
  expenseCategoryId: int('expense_category_id').notNull(),
  campaignId: int('campaign_id'),
  costComponentId: int('cost_component_id'),
  expenseName: varchar('expense_name', { length: 255 }).notNull(),
  expenseType: varchar('expense_type', { length: 100 }).notNull(),
  expenseDate: date('expense_date').notNull(),
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  currency: char('currency', { length: 3 }).notNull().default('BDT'),
  exchangeRate: decimal('exchange_rate', { precision: 12, scale: 4 }).notNull().default('1.0000'),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: int('reference_id'),
  notes: text('notes'),
  expenseStatus: varchar('expense_status', { length: 30 }).notNull().default('posted'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 26. Expense Allocations Table
export const tblExpenseAllocations = mysqlTable('tbl_expense_allocations', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  expenseId: bigint('expense_id', { mode: 'number' }).notNull(),
  allocationMethodId: int('allocation_method_id').notNull(),
  targetType: varchar('target_type', { length: 30 }).notNull(),
  targetId: int('target_id').notNull(),
  collectionId: int('collection_id'),
  quantityBasis: decimal('quantity_basis', { precision: 14, scale: 2 }).notNull().default('0.00'),
  valueBasis: decimal('value_basis', { precision: 14, scale: 2 }).notNull().default('0.00'),
  allocationAmount: decimal('allocation_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 27. Allocation Methods Table
export const tblAllocationMethods = mysqlTable('tbl_allocation_methods', {
  id: int('id').primaryKey(),
  methodCode: varchar('method_code', { length: 50 }).notNull(),
  methodName: varchar('method_name', { length: 100 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
});

// 28. Collections Table
export const tblCollections = mysqlTable('tbl_collections', {
  id: int('id').primaryKey(),
  collectionCode: varchar('collection_code', { length: 32 }).notNull().unique(),
  collectionName: varchar('collection_name', { length: 150 }).notNull(),
  collectionTypeId: int('collection_type_id'),
  description: text('description'),
  isActive: tinyint('is_active').notNull().default(1),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  deletedAt: datetime('deleted_at'),
});

// 29. Collection Products Table
export const tblCollectionProducts = mysqlTable('tbl_collection_products', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  collectionId: int('collection_id').notNull(),
  variantId: int('variant_id').notNull(),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 30. Marketing Platforms Table
export const tblMarketingPlatforms = mysqlTable('tbl_marketing_platforms', {
  id: int('id').primaryKey(),
  platformCode: varchar('platform_code', { length: 50 }).notNull(),
  platformName: varchar('platform_name', { length: 100 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
});

// 31. Marketing Campaigns Table
export const tblMarketingCampaigns = mysqlTable('tbl_marketing_campaigns', {
  id: serial('id').primaryKey(),
  campaignCode: varchar('campaign_code', { length: 32 }).notNull().unique(),
  campaignName: varchar('campaign_name', { length: 255 }).notNull(),
  platformId: int('platform_id').notNull(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  budgetAmount: decimal('budget_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  spendAmount: decimal('spend_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  revenueAmount: decimal('revenue_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  ordersGenerated: int('orders_generated').notNull().default(0),
  campaignStatus: varchar('campaign_status', { length: 30 }).notNull().default('active'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

// 32. Income Table
export const tblIncome = mysqlTable('tbl_income', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  incomeCode: varchar('income_code', { length: 32 }).notNull().unique(),
  sourceType: varchar('source_type', { length: 50 }).notNull(),
  sourceId: int('source_id').notNull(),
  entryDate: date('entry_date').notNull(),
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  currency: char('currency', { length: 3 }).notNull().default('BDT'),
  description: varchar('description', { length: 255 }),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
});

// 33. Payments Table
export const tblPayments = mysqlTable('tbl_payments', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  paymentCode: varchar('payment_code', { length: 32 }).notNull().unique(),
  orderId: int('order_id').notNull(),
  paymentDate: date('payment_date').notNull(),
  paymentType: varchar('payment_type', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  currency: char('currency', { length: 3 }).notNull().default('BDT'),
  paymentStatus: varchar('payment_status', { length: 30 }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 34. Cash Flow Table
export const tblCashFlow = mysqlTable('tbl_cash_flow', {
  id: serial('id').primaryKey(),
  cashFlowCode: varchar('cash_flow_code', { length: 32 }).notNull().unique(),
  entryDate: date('entry_date').notNull(),
  entryType: varchar('entry_type', { length: 20 }).notNull(),
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  currency: char('currency', { length: 3 }).notNull().default('BDT'),
  sourceType: varchar('source_type', { length: 50 }),
  sourceId: int('source_id'),
  description: varchar('description', { length: 255 }),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 35. Settings Table
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

// 36. Stock Reservations Table
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

// 37. Profit Loss Snapshot Table (populated via sp_refresh_profit_loss)
export const tblProfitLoss = mysqlTable('tbl_profit_loss', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  revenue: decimal('revenue', { precision: 14, scale: 2 }).notNull().default('0.00'),
  cogs: decimal('cogs', { precision: 14, scale: 2 }).notNull().default('0.00'),
  grossProfit: decimal('gross_profit', { precision: 14, scale: 2 }).notNull().default('0.00'),
  expenses: decimal('expenses', { precision: 14, scale: 2 }).notNull().default('0.00'),
  netProfit: decimal('net_profit', { precision: 14, scale: 2 }).notNull().default('0.00'),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: datetime('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 38. Product Cost Ledger (immutable — tracks all cost allocations per variant)
export const tblProductCostLedger = mysqlTable('tbl_product_cost_ledger', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  ledgerCode: varchar('ledger_code', { length: 32 }).notNull().unique(),
  variantId: int('variant_id').notNull(),
  inventoryBatchId: bigint('inventory_batch_id', { mode: 'number' }),
  expenseId: bigint('expense_id', { mode: 'number' }),
  costComponentId: int('cost_component_id').notNull(),
  allocationMethodId: int('allocation_method_id'),
  allocatedAmount: decimal('allocated_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  costPerUnit: decimal('cost_per_unit', { precision: 12, scale: 2 }).notNull().default('0.00'),
  effectiveDate: date('effective_date').notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: int('reference_id'),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 39. Shipment Items Table
export const tblShipmentItems = mysqlTable('tbl_shipment_items', {
  id: serial('id').primaryKey(),
  shipmentId: bigint('shipment_id', { mode: 'number' }).notNull(),
  purchaseOrderItemId: bigint('purchase_order_item_id', { mode: 'number' }).notNull(),
  variantId: int('variant_id').notNull(),
  quantityShipped: int('quantity_shipped').notNull().default(0),
  quantityReceived: int('quantity_received').notNull().default(0),
  cartonNumber: varchar('carton_number', { length: 50 }),
  createdAt: datetime('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// 40. Order Status History Table
export const tblOrderStatusHistory = mysqlTable('tbl_order_status_history', {
  id: serial('id').primaryKey(),
  orderId: int('order_id').notNull(),
  statusId: int('status_id').notNull(),
  changedAt: datetime('changed_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  changedBy: varchar('changed_by', { length: 100 }),
  notes: text('notes'),
});

// 41. Refund Statuses Table
export const tblRefundStatuses = mysqlTable('tbl_refund_statuses', {
  id: int('id').primaryKey(),
  statusCode: varchar('status_code', { length: 50 }).notNull().unique(),
  statusName: varchar('status_name', { length: 100 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
});

// 42. Return Statuses Table
export const tblReturnStatuses = mysqlTable('tbl_return_statuses', {
  id: int('id').primaryKey(),
  statusCode: varchar('status_code', { length: 50 }).notNull().unique(),
  statusName: varchar('status_name', { length: 100 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),
});


