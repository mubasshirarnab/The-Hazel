import { poolConnection } from './db';

/**
 * Helper to call sp_generate_business_code and get the code.
 */
export async function dbGenerateBusinessCode(entityName: string, prefix: string): Promise<string> {
  const connection = await poolConnection.getConnection();
  try {
    await connection.query('CALL sp_generate_business_code(?, ?, @p_code)', [entityName, prefix]);
    const [rows]: any = await connection.query('SELECT @p_code AS code');
    return rows[0]?.code || '';
  } finally {
    connection.release();
  }
}

interface OrderItemInput {
  variant_id: number;
  quantity: number;
  selling_price: number;
  discount_amount?: number;
}

/**
 * Helper to create an order using sp_create_order.
 */
export async function dbCreateOrder(
  customerId: number,
  orderType: 'in_stock' | 'preorder',
  orderDate: string,
  items: OrderItemInput[],
  notes: string
): Promise<{ orderId: number; orderNumber: string }> {
  const connection = await poolConnection.getConnection();
  try {
    const itemsJson = JSON.stringify(items);
    await connection.query(
      'CALL sp_create_order(?, ?, ?, ?, ?, @p_order_id, @p_order_number)',
      [customerId, orderType, orderDate, itemsJson, notes]
    );
    const [rows]: any = await connection.query(
      'SELECT @p_order_id AS order_id, @p_order_number AS order_number'
    );
    return {
      orderId: Number(rows[0]?.order_id) || 0,
      orderNumber: rows[0]?.order_number || '',
    };
  } finally {
    connection.release();
  }
}

/**
 * Helper to receive a shipment using sp_receive_shipment.
 */
export async function dbReceiveShipment(shipmentId: number, purchaseOrderId: number): Promise<void> {
  const connection = await poolConnection.getConnection();
  try {
    await connection.query('CALL sp_receive_shipment(?, ?)', [shipmentId, purchaseOrderId]);
  } finally {
    connection.release();
  }
}

/**
 * Helper to complete an order using sp_complete_order.
 */
export async function dbCompleteOrder(orderId: number): Promise<void> {
  const connection = await poolConnection.getConnection();
  try {
    await connection.query('CALL sp_complete_order(?)', [orderId]);
  } finally {
    connection.release();
  }
}

/**
 * Helper to cancel an order using sp_cancel_order.
 */
export async function dbCancelOrder(orderId: number): Promise<void> {
  const connection = await poolConnection.getConnection();
  try {
    await connection.query('CALL sp_cancel_order(?)', [orderId]);
  } finally {
    connection.release();
  }
}

/**
 * Helper to return an order using sp_return_order.
 */
export async function dbReturnOrder(orderId: number, returnReason: string): Promise<void> {
  const connection = await poolConnection.getConnection();
  try {
    await connection.query('CALL sp_return_order(?, ?)', [orderId, returnReason]);
  } finally {
    connection.release();
  }
}

/**
 * Helper to allocate product costs using sp_allocate_product_costs.
 */
export async function dbAllocateProductCosts(
  expenseId: number,
  allocationMethodCode: 'equal_distribution' | 'quantity_based' | 'purchase_value_based' | 'manual_allocation',
  targetType: 'product' | 'collection' | 'campaign',
  targetId: number,
  quantityBasis: number,
  valueBasis: number,
  allocationAmount: number,
  notes: string
): Promise<void> {
  const connection = await poolConnection.getConnection();
  try {
    await connection.query(
      'CALL sp_allocate_product_costs(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        expenseId,
        allocationMethodCode,
        targetType,
        targetId,
        quantityBasis,
        valueBasis,
        allocationAmount,
        notes,
      ]
    );
  } finally {
    connection.release();
  }
}

/**
 * Helper to manually adjust inventory using sp_adjust_inventory.
 */
export async function dbAdjustInventory(
  variantId: number,
  warehouseId: number,
  adjustmentType: 'increase' | 'decrease',
  quantity: number,
  reason: string,
  createdBy: string
): Promise<void> {
  const connection = await poolConnection.getConnection();
  try {
    await connection.query(
      'CALL sp_adjust_inventory(?, ?, ?, ?, ?, ?)',
      [variantId, warehouseId, adjustmentType, quantity, reason, createdBy]
    );
  } finally {
    connection.release();
  }
}

/**
 * Helper to refresh P&L summary using sp_refresh_profit_loss.
 */
export async function dbRefreshProfitLoss(): Promise<void> {
  const connection = await poolConnection.getConnection();
  try {
    await connection.query('CALL sp_refresh_profit_loss()');
  } finally {
    connection.release();
  }
}
