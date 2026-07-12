'use server';

import { dbAdjustInventory } from '@/lib/db/procedures';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const adjustmentSchema = z.object({
  variantId: z.number().int().positive('Please select a valid variant.'),
  warehouseId: z.number().int().positive('Please select a valid warehouse.'),
  adjustmentType: z.enum(['increase', 'decrease']),
  quantity: z.number().int().positive('Quantity must be a positive integer.'),
  reason: z.string().min(3, 'Reason must be at least 3 characters.'),
});

async function authorizeUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    throw new Error('Unauthorized. Staff or Admin role required.');
  }
  return session.user;
}

export async function adjustInventory(formData: z.infer<typeof adjustmentSchema>) {
  const user = await authorizeUser();
  const data = adjustmentSchema.parse(formData);

  try {
    await dbAdjustInventory(
      data.variantId,
      data.warehouseId,
      data.adjustmentType,
      data.quantity,
      data.reason,
      user.userCode
    );

    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error adjusting inventory:', error);
    throw new Error(error.message || 'Failed to adjust inventory.');
  }
}
