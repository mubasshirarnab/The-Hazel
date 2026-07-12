'use server';

import { db } from '@/lib/db/db';
import { tblSettings } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const settingsSchema = z.object({
  current_rmb_rate: z.number().positive('RMB rate must be positive.'),
  shipping_rate: z.number().nonnegative('Shipping rate must be non-negative.'),
  default_advance_percentage: z.number().min(0).max(100, 'Must be 0–100%.'),
  courier_charge: z.number().nonnegative('Courier charge must be non-negative.'),
  tax_rate: z.number().min(0).max(100, 'Must be 0–100%.'),
});

async function authorizeAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized. Administrator access required.');
  }
  return session.user;
}

export async function updateSettings(formData: z.infer<typeof settingsSchema>) {
  const user = await authorizeAdmin();
  const data = settingsSchema.parse(formData);

  const updates: { key: string; value: string }[] = [
    { key: 'current_rmb_rate', value: data.current_rmb_rate.toFixed(4) },
    { key: 'shipping_rate', value: data.shipping_rate.toFixed(2) },
    { key: 'default_advance_percentage', value: data.default_advance_percentage.toFixed(2) },
    { key: 'courier_charge', value: data.courier_charge.toFixed(2) },
    { key: 'tax_rate', value: data.tax_rate.toFixed(2) },
  ];

  try {
    for (const { key, value } of updates) {
      await db
        .update(tblSettings)
        .set({ settingValue: value, updatedBy: user.userCode })
        .where(eq(tblSettings.settingKey, key));
    }

    revalidatePath('/settings');
    revalidatePath('/purchase-orders');
    revalidatePath('/shipments');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating settings:', error);
    throw new Error(error.message || 'Failed to update settings.');
  }
}
