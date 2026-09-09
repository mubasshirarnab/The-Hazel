'use server';

import { db } from '@/lib/db/db';
import { tblProducts, tblProductVariants, tblInventory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const productSchema = z.object({
  productName: z.string().min(2, 'Product name must be at least 2 characters.'),
  sku: z.string().min(2, 'SKU must be at least 2 characters.'),
  categoryId: z.number().optional().nullable(),
  purchaseLink: z.string().url('Invalid purchase link URL.').or(z.literal('')).optional().nullable(),
  productDescription: z.string().optional().nullable(),
  totalWeight: z.number().nonnegative('Total weight must be non-negative.').optional().nullable(),
  quantity: z.number().int().positive('Quantity must be a positive integer.').optional().nullable(),
  shippingRoute: z.string().optional().nullable(),
  shippingRate: z.number().nonnegative('Shipping rate must be non-negative.').optional().nullable(),
  shippingCost: z.number().nonnegative().optional().nullable(),
  otherImportCost: z.number().nonnegative().optional().nullable(),
  totalCost: z.number().nonnegative().optional().nullable(),
  unitCost: z.number().nonnegative().optional().nullable(),
  unitWeight: z.number().nonnegative().optional().nullable(),
});

const variantSchema = z.object({
  colorName: z.string().min(1, 'Color variant name is required.'),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative.'),
  rmbPrice: z.number().min(0, 'RMB price must be non-negative.').optional().nullable(),
  rmbRate: z.number().min(0, 'RMB rate must be non-negative.').optional().nullable(),
  purchasePriceBdt: z.number().min(0, 'Buying price (BDT) must be non-negative.'),
  notes: z.string().optional().nullable(),
});

async function authorizeUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    throw new Error('Unauthorized. Staff or Admin role required.');
  }
  return session.user;
}

export async function createProduct(formData: {
  product: z.infer<typeof productSchema>;
  variants: z.infer<typeof variantSchema>[];
}) {
  const user = await authorizeUser();
  const productData = productSchema.parse(formData.product);

  if (formData.variants.length === 0) {
    throw new Error('At least one color variant must be provided.');
  }

  // Calculate unit weight
  const qty = productData.quantity || 1;
  const totalWeight = productData.totalWeight || 0;
  const unitWeight = qty > 0 && totalWeight > 0 ? Number((totalWeight / qty).toFixed(3)) : null;

  // Calculate shipping cost
  const shippingRate = productData.shippingRate || 0;
  const shippingCost = totalWeight > 0 && shippingRate > 0 ? Number((totalWeight * shippingRate).toFixed(2)) : (productData.shippingCost ?? null);

  // Calculate Buying Price for calculation
  const firstVariant = formData.variants[0];
  const buyingPrice = (firstVariant.rmbPrice && firstVariant.rmbRate ? firstVariant.rmbPrice * firstVariant.rmbRate : 0);

  const otherImportCost = productData.otherImportCost || 0;
  const totalCost = productData.totalCost ?? (qty > 0 ? Number((qty * buyingPrice + (shippingCost || 0) + otherImportCost).toFixed(2)) : null);
  const unitCost = totalCost && qty > 0 ? Number((totalCost / qty).toFixed(2)) : Number(buyingPrice.toFixed(2));

  // Generate unique product code
  const productCode = `PRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  return await db.transaction(async (tx) => {
    // 1. Insert product
    const [prodResult] = await tx.insert(tblProducts).values({
      productCode,
      productName: productData.productName,
      sku: productData.sku,
      categoryId: productData.categoryId,
      purchaseLink: productData.purchaseLink,
      productDescription: productData.productDescription,
      totalWeight: productData.totalWeight?.toString(),
      quantity: productData.quantity,
      shippingRoute: productData.shippingRoute,
      shippingRate: productData.shippingRate?.toString(),
      shippingCost: shippingCost?.toString(),
      otherImportCost: productData.otherImportCost?.toString(),
      totalCost: totalCost?.toString(),
      unitCost: unitCost?.toString(),
      unitWeight: unitWeight?.toString(),
      productStatus: 'active',
      createdBy: user.userCode,
    });

    const productId = prodResult.insertId;

    // 2. Insert variants and inventory records
    for (const v of formData.variants) {
      const parsedVariant = variantSchema.parse(v);
      const variantCode = `VAR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const vBuyingPrice = parsedVariant.rmbPrice && parsedVariant.rmbRate 
        ? parsedVariant.rmbPrice * parsedVariant.rmbRate 
        : parsedVariant.purchasePriceBdt;

      const [varResult] = await tx.insert(tblProductVariants).values({
        productId,
        variantCode,
        colorName: parsedVariant.colorName,
        sellingPrice: parsedVariant.sellingPrice.toString(),
        rmbPrice: parsedVariant.rmbPrice?.toString(),
        rmbRate: parsedVariant.rmbRate?.toString(),
        purchasePriceBdt: vBuyingPrice.toString(),
        currentCost: unitCost.toString(),
        variantStatus: 'active',
        notes: parsedVariant.notes,
        createdBy: user.userCode,
      });

      const variantId = varResult.insertId;

      // Initialize inventory row
      await tx.insert(tblInventory).values({
        variantId,
        warehouseId: 1, // WH001
        currentStock: qty,
        reservedStock: 0,
        totalPurchased: qty,
        totalSold: 0,
        unitCost: unitCost.toString(),
        inventoryValue: (qty * unitCost).toFixed(2),
        createdBy: user.userCode,
      });
    }

    revalidatePath('/products');
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    return { success: true, productId };
  });
}

export async function updateProduct(
  id: number,
  data: z.infer<typeof productSchema>
) {
  const user = await authorizeUser();
  const parsedData = productSchema.parse(data);

  const qty = parsedData.quantity || 1;
  const totalWeight = parsedData.totalWeight || 0;
  const unitWeight = qty > 0 && totalWeight > 0 ? Number((totalWeight / qty).toFixed(3)) : null;

  const shippingRate = parsedData.shippingRate || 0;
  const shippingCost = totalWeight > 0 && shippingRate > 0 ? Number((totalWeight * shippingRate).toFixed(2)) : (parsedData.shippingCost ?? null);

  await db
    .update(tblProducts)
    .set({
      productName: parsedData.productName,
      sku: parsedData.sku,
      categoryId: parsedData.categoryId,
      purchaseLink: parsedData.purchaseLink,
      productDescription: parsedData.productDescription,
      totalWeight: parsedData.totalWeight?.toString(),
      quantity: parsedData.quantity,
      shippingRoute: parsedData.shippingRoute,
      shippingRate: parsedData.shippingRate?.toString(),
      shippingCost: shippingCost?.toString(),
      otherImportCost: parsedData.otherImportCost?.toString(),
      totalCost: parsedData.totalCost?.toString(),
      unitCost: parsedData.unitCost?.toString(),
      unitWeight: unitWeight?.toString(),
      updatedBy: user.userCode,
    })
    .where(eq(tblProducts.id, id));

  revalidatePath('/products');
  revalidatePath('/inventory');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteProduct(id: number) {
  const user = await authorizeUser();

  await db.transaction(async (tx) => {
    const timestamp = new Date();
    await tx
      .update(tblProducts)
      .set({
        deletedAt: timestamp,
        updatedBy: user.userCode,
      })
      .where(eq(tblProducts.id, id));

    await tx
      .update(tblProductVariants)
      .set({
        deletedAt: timestamp,
        updatedBy: user.userCode,
      })
      .where(eq(tblProductVariants.productId, id));

    const variants = await tx
      .select({ id: tblProductVariants.id })
      .from(tblProductVariants)
      .where(eq(tblProductVariants.productId, id));

    for (const v of variants) {
      await tx
        .update(tblInventory)
        .set({
          deletedAt: timestamp,
          updatedBy: user.userCode,
        })
        .where(eq(tblInventory.variantId, v.id));
    }
  });

  revalidatePath('/products');
  revalidatePath('/inventory');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function createVariant(
  productId: number,
  data: z.infer<typeof variantSchema>
) {
  const user = await authorizeUser();
  const parsedData = variantSchema.parse(data);

  const variantCode = `VAR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const vBuyingPrice = parsedData.rmbPrice && parsedData.rmbRate 
    ? parsedData.rmbPrice * parsedData.rmbRate 
    : parsedData.purchasePriceBdt;

  return await db.transaction(async (tx) => {
    const [result] = await tx.insert(tblProductVariants).values({
      productId,
      variantCode,
      colorName: parsedData.colorName,
      sellingPrice: parsedData.sellingPrice.toString(),
      rmbPrice: parsedData.rmbPrice?.toString(),
      rmbRate: parsedData.rmbRate?.toString(),
      purchasePriceBdt: vBuyingPrice.toString(),
      currentCost: vBuyingPrice.toString(),
      variantStatus: 'active',
      notes: parsedData.notes,
      createdBy: user.userCode,
    });

    const variantId = result.insertId;

    await tx.insert(tblInventory).values({
      variantId,
      warehouseId: 1,
      currentStock: 0,
      reservedStock: 0,
      totalPurchased: 0,
      totalSold: 0,
      unitCost: vBuyingPrice.toString(),
      inventoryValue: '0.00',
      createdBy: user.userCode,
    });

    revalidatePath('/products');
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    return { success: true, variantId };
  });
}

export async function updateVariant(
  id: number,
  data: z.infer<typeof variantSchema>
) {
  const user = await authorizeUser();
  const parsedData = variantSchema.parse(data);

  const vBuyingPrice = parsedData.rmbPrice && parsedData.rmbRate 
    ? parsedData.rmbPrice * parsedData.rmbRate 
    : parsedData.purchasePriceBdt;

  await db
    .update(tblProductVariants)
    .set({
      colorName: parsedData.colorName,
      sellingPrice: parsedData.sellingPrice.toString(),
      rmbPrice: parsedData.rmbPrice?.toString(),
      rmbRate: parsedData.rmbRate?.toString(),
      purchasePriceBdt: vBuyingPrice.toString(),
      notes: parsedData.notes,
      updatedBy: user.userCode,
    })
    .where(eq(tblProductVariants.id, id));

  revalidatePath('/products');
  return { success: true };
}

export async function deleteVariant(id: number) {
  const user = await authorizeUser();
  const timestamp = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(tblProductVariants)
      .set({
        deletedAt: timestamp,
        updatedBy: user.userCode,
      })
      .where(eq(tblProductVariants.id, id));

    await tx
      .update(tblInventory)
      .set({
        deletedAt: timestamp,
        updatedBy: user.userCode,
      })
      .where(eq(tblInventory.variantId, id));
  });

  revalidatePath('/products');
  revalidatePath('/inventory');
  return { success: true };
}
