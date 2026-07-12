'use server';

import { poolConnection } from '@/lib/db/db';
import { dbRefreshProfitLoss, dbGenerateBusinessCode } from '@/lib/db/procedures';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const cashFlowSchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD).'),
  entryType: z.enum(['inflow', 'outflow']),
  amount: z.number().positive('Amount must be positive.'),
  description: z.string().min(3, 'Description must be at least 3 characters.'),
});

async function authorizeAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized. Administrative access required for financial operations.');
  }
  return session.user;
}

export async function createCashFlowEntry(formData: z.infer<typeof cashFlowSchema>) {
  await authorizeAdmin();
  const data = cashFlowSchema.parse(formData);

  try {
    const cashFlowCode = await dbGenerateBusinessCode('cash_flow', 'CF');

    await poolConnection.query(
      `INSERT INTO tbl_cash_flow (cash_flow_code, entry_date, entry_type, amount, currency, description)
       VALUES (?, ?, ?, ?, 'BDT', ?)`,
      [cashFlowCode, data.entryDate, data.entryType, data.amount.toFixed(2), data.description]
    );

    revalidatePath('/finance');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating cash flow entry:', error);
    throw new Error(error.message || 'Failed to create cash flow entry.');
  }
}

export async function refreshProfitLoss() {
  await authorizeAdmin();

  try {
    await dbRefreshProfitLoss();
    revalidatePath('/finance');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error refreshing profit & loss:', error);
    throw new Error(error.message || 'Failed to refresh profit & loss summary.');
  }
}
