'use server';

import { db } from '@/lib/db/db';
import { tblCustomers } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const customerSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters.'),
  phone: z.string().min(6, 'Phone number must be at least 6 characters.').optional().nullable(),
  facebookName: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  paymentPreference: z.string().optional().nullable(),
});

async function authorizeUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthorized.');
  }
  return session.user;
}

export async function createCustomer(formData: z.infer<typeof customerSchema>) {
  const user = await authorizeUser();
  const data = customerSchema.parse(formData);

  const customerCode = `CST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  try {
    const [result] = await db.insert(tblCustomers).values({
      customerCode,
      customerName: data.customerName,
      phone: data.phone,
      facebookName: data.facebookName,
      address: data.address,
      district: data.district,
      paymentPreference: data.paymentPreference,
      createdBy: user.userCode,
    });

    revalidatePath('/customers');
    return { success: true, customerId: result.insertId };
  } catch (error: any) {
    console.error('Error creating customer:', error);
    throw new Error(error.message || 'Failed to create customer.');
  }
}

export async function updateCustomer(id: number, formData: z.infer<typeof customerSchema>) {
  const user = await authorizeUser();
  const data = customerSchema.parse(formData);

  try {
    await db
      .update(tblCustomers)
      .set({
        customerName: data.customerName,
        phone: data.phone,
        facebookName: data.facebookName,
        address: data.address,
        district: data.district,
        paymentPreference: data.paymentPreference,
        updatedBy: user.userCode,
      })
      .where(eq(tblCustomers.id, id));

    revalidatePath('/customers');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating customer:', error);
    throw new Error(error.message || 'Failed to update customer.');
  }
}

export async function deleteCustomer(id: number) {
  const user = await authorizeUser();
  const timestamp = new Date();

  try {
    await db
      .update(tblCustomers)
      .set({
        deletedAt: timestamp,
        updatedBy: user.userCode,
      })
      .where(eq(tblCustomers.id, id));

    revalidatePath('/customers');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    throw new Error(error.message || 'Failed to delete customer.');
  }
}
