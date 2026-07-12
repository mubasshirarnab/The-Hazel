'use server';

import { db } from '@/lib/db/db';
import { tblProducts, tblProductVariants, tblInventory } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Zod schemas for input validation
const productSchema = z.object({
  productName: z.string().min(2, 'Product name must be at least 2 characters.'),
  sku: z.string().min(2, 'SKU must be at least 2 characters.'),
  categoryId: z.number().optional().nullable(),
  purchaseLink: z.string().url('Invalid purchase link URL.').or(z.literal('')).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const variantSchema = z.object({
  colorName: z.string().min(1, 'Color variant name is required.'),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative.'),
  purchasePriceBdt: z.number().min(0, 'Purchase price BDT must be non-negative.'),
  notes: z.string().optional().nullable(),
});

// Admin and Staff roles have edit rights
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

  // Use transaction to write product and variants together
  return await db.transaction(async (tx) => {
    // 1. Insert product
    const [prodResult] = await tx.insert(tblProducts).values({
      productName: productData.productName,
      sku: productData.sku,
      categoryId: productData.categoryId,
      purchaseLink: productData.purchaseLink,
      notes: productData.notes,
      productStatus: 'active',
      createdBy: user.userCode,
    });

    const productId = prodResult.insertId;

    // 2. Insert variants and default inventory records (WH001)
    for (const v of formData.variants) {
      const parsedVariant = variantSchema.parse(v);
      const [varResult] = await tx.insert(tblProductVariants).values({
        productId,
        colorName: parsedVariant.colorName,
        sellingPrice: parsedVariant.sellingPrice.toString(),
        purchasePriceBdt: parsedVariant.purchasePriceBdt.toString(),
        currentCost: parsedVariant.purchasePriceBdt.toString(), // Default current cost to purchase BDT
        variantStatus: 'active',
        notes: parsedVariant.notes,
        createdBy: user.userCode,
      });

      const variantId = varResult.insertId;

      // Initialize inventory row for WH001 (Dhaka Central)
      await tx.insert(tblInventory).values({
        variantId,
        warehouseId: 1, // WH001
        currentStock: 0,
        reservedStock: 0,
        returnedStock: 0,
        damagedStock: 0,
        totalPurchased: 0,
        totalSold: 0,
        unitCost: parsedVariant.purchasePriceBdt.toString(),
        inventoryValue: '0.00',
        createdBy: user.userCode,
      });
    }

    revalidatePath('/products');
    revalidatePath('/inventory');
    return { success: true, productId };
  });
}

export async function updateProduct(
  id: number,
  data: z.infer<typeof productSchema>
) {
  const user = await authorizeUser();
  const parsedData = productSchema.parse(data);

  await db
    .update(tblProducts)
    .set({
      productName: parsedData.productName,
      sku: parsedData.sku,
      categoryId: parsedData.categoryId,
      purchaseLink: parsedData.purchaseLink,
      notes: parsedData.notes,
      updatedBy: user.userCode,
    })
    .where(eq(tblProducts.id, id));

  revalidatePath('/products');
  return { success: true };
}

export async function deleteProduct(id: number) {
  const user = await authorizeUser();

  // Soft delete product
  await db.transaction(async (tx) => {
    const timestamp = new Date();
    await tx
      .update(tblProducts)
      .set({
        deletedAt: timestamp,
        updatedBy: user.userCode,
      })
      .where(eq(tblProducts.id, id));

    // Soft delete corresponding variants
    await tx
      .update(tblProductVariants)
      .set({
        deletedAt: timestamp,
        updatedBy: user.userCode,
      })
      .where(eq(tblProductVariants.productId, id));

    // Soft delete inventory rows
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
  return { success: true };
}

export async function createVariant(
  productId: number,
  data: z.infer<typeof variantSchema>
) {
  const user = await authorizeUser();
  const parsedData = variantSchema.parse(data);

  return await db.transaction(async (tx) => {
    const [result] = await tx.insert(tblProductVariants).values({
      productId,
      colorName: parsedData.colorName,
      sellingPrice: parsedData.sellingPrice.toString(),
      purchasePriceBdt: parsedData.purchasePriceBdt.toString(),
      currentCost: parsedData.purchasePriceBdt.toString(),
      variantStatus: 'active',
      notes: parsedData.notes,
      createdBy: user.userCode,
    });

    const variantId = result.insertId;

    // Initialize inventory row for WH001 (Dhaka Central)
    await tx.insert(tblInventory).values({
      variantId,
      warehouseId: 1,
      currentStock: 0,
      reservedStock: 0,
      returnedStock: 0,
      damagedStock: 0,
      totalPurchased: 0,
      totalSold: 0,
      unitCost: parsedData.purchasePriceBdt.toString(),
      inventoryValue: '0.00',
      createdBy: user.userCode,
    });

    revalidatePath('/products');
    revalidatePath('/inventory');
    return { success: true, variantId };
  });
}

export async function updateVariant(
  id: number,
  data: z.infer<typeof variantSchema>
) {
  const user = await authorizeUser();
  const parsedData = variantSchema.parse(data);

  await db
    .update(tblProductVariants)
    .set({
      colorName: parsedData.colorName,
      sellingPrice: parsedData.sellingPrice.toString(),
      purchasePriceBdt: parsedData.purchasePriceBdt.toString(),
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
