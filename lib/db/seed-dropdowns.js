const mysql = require('mysql2/promise');

async function getCode(connection, sequenceName, prefix) {
  await connection.query(`CALL sp_generate_business_code(?, ?, @new_code)`, [sequenceName, prefix]);
  const [result] = await connection.query("SELECT @new_code AS new_code");
  return result[0]?.new_code || `${prefix}0001`;
}

async function main() {
  const connectionConfig = process.env.DATABASE_URL
    ? { uri: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hazel_erp',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      };

  const connection = await mysql.createConnection(connectionConfig);

  try {
    console.log('Seeding categories...');
    const catCode1 = await getCode(connection, 'categories', 'CAT');
    const [resCat1] = await connection.query(`INSERT INTO tbl_categories (category_code, category_name, is_active, created_by) VALUES (?, 'Handbag', 1, 'system')`, [catCode1]);
    const catId1 = resCat1.insertId;

    const catCode2 = await getCode(connection, 'categories', 'CAT');
    const [resCat2] = await connection.query(`INSERT INTO tbl_categories (category_code, category_name, is_active, created_by) VALUES (?, 'Watch', 1, 'system')`, [catCode2]);
    const catId2 = resCat2.insertId;

    console.log('Seeding products...');
    const prodCode1 = await getCode(connection, 'products', 'PRD');
    const [resProd1] = await connection.query(`INSERT INTO tbl_products (product_code, sku, product_name, category_id, product_status, created_by) VALUES (?, 'HB-001', 'Classic Leather Handbag', ?, 'active', 'system')`, [prodCode1, catId1]);
    const prodId1 = resProd1.insertId;

    const prodCode2 = await getCode(connection, 'products', 'PRD');
    const [resProd2] = await connection.query(`INSERT INTO tbl_products (product_code, sku, product_name, category_id, product_status, created_by) VALUES (?, 'WT-001', 'Luxury Quartz Watch', ?, 'active', 'system')`, [prodCode2, catId2]);
    const prodId2 = resProd2.insertId;

    console.log('Seeding variants...');
    const varCode1 = await getCode(connection, 'variants', 'VAR');
    await connection.query(`INSERT INTO tbl_product_variants (product_id, variant_code, color_name, selling_price, variant_status, created_by) VALUES (?, ?, 'Black', 15000.00, 'active', 'system')`, [prodId1, varCode1]);

    const varCode2 = await getCode(connection, 'variants', 'VAR');
    await connection.query(`INSERT INTO tbl_product_variants (product_id, variant_code, color_name, selling_price, variant_status, created_by) VALUES (?, ?, 'Brown', 15000.00, 'active', 'system')`, [prodId1, varCode2]);

    const varCode3 = await getCode(connection, 'variants', 'VAR');
    await connection.query(`INSERT INTO tbl_product_variants (product_id, variant_code, color_name, selling_price, variant_status, created_by) VALUES (?, ?, 'Silver', 8500.00, 'active', 'system')`, [prodId2, varCode3]);

    console.log('Seeding warehouse...');
    const whCode = await getCode(connection, 'warehouses', 'WH');
    await connection.query(`INSERT INTO tbl_warehouses (warehouse_code, warehouse_name, country, is_active, created_by) VALUES (?, 'Main Dhaka Warehouse', 'Bangladesh', 1, 'system')`, [whCode]);

    console.log('Seeding customer...');
    const custCode = await getCode(connection, 'customers', 'CUS');
    await connection.query(`INSERT INTO tbl_customers (customer_code, customer_name, phone, created_by) VALUES (?, 'Walk-in Customer', '01700000000', 'system')`, [custCode]);

    console.log('Seeding supplier...');
    const supCode = await getCode(connection, 'suppliers', 'SUP');
    await connection.query(`INSERT INTO tbl_suppliers (supplier_code, supplier_name, created_by) VALUES (?, 'Guangzhou Leather Factory', 'system')`, [supCode]);

    console.log('Seeding friend (agent)...');
    const friendCode = await getCode(connection, 'friends', 'FRN');
    await connection.query(`INSERT INTO tbl_friends (friend_code, friend_name, created_by) VALUES (?, 'Mr. Chen (China Agent)', 'system')`, [friendCode]);

    // Truncate and seed couriers if they exist, wait, earlier script truncated tbl_couriers. Let's check schema.
    try {
      console.log('Seeding courier...');
      const courCode = await getCode(connection, 'couriers', 'COR');
      await connection.query(`INSERT INTO tbl_couriers (courier_code, courier_name, is_active) VALUES (?, 'Steadfast Courier', 1)`, [courCode]);
    } catch (e) {
      console.log('tbl_couriers might not exist or schema differs, skipping.', e.message);
    }

    console.log('Successfully seeded default dropdown options!');

  } catch (error) {
    console.error('Error seeding dropdowns:', error);
  } finally {
    await connection.end();
  }
}

main();
