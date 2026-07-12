'use server';

import { db, poolConnection } from '@/lib/db/db';
import { tblMarketingCampaigns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { dbGenerateBusinessCode } from '@/lib/db/procedures';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const campaignSchema = z.object({
  campaignName: z.string().min(3, 'Campaign name must be at least 3 characters.'),
  platformId: z.number().int().positive('Please select a valid platform.'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format.').optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format.').optional().nullable(),
  budgetAmount: z.number().min(0).default(0),
  spendAmount: z.number().min(0).default(0),
  revenueAmount: z.number().min(0).default(0),
  ordersGenerated: z.number().int().nonnegative().default(0),
});

async function authorizeUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthorized.');
  }
  return session.user;
}

export async function createCampaign(formData: z.infer<typeof campaignSchema>) {
  const user = await authorizeUser();
  const data = campaignSchema.parse(formData);

  try {
    const campaignCode = await dbGenerateBusinessCode('marketing_campaigns', 'CAM');

    const [result]: any = await poolConnection.query(
      `INSERT INTO tbl_marketing_campaigns
        (campaign_code, campaign_name, platform_id, start_date, end_date,
         budget_amount, spend_amount, revenue_amount, orders_generated, campaign_status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        campaignCode,
        data.campaignName,
        data.platformId,
        data.startDate || null,
        data.endDate || null,
        data.budgetAmount.toFixed(2),
        data.spendAmount.toFixed(2),
        data.revenueAmount.toFixed(2),
        data.ordersGenerated,
        user.userCode,
      ]
    );

    revalidatePath('/marketing');
    revalidatePath('/dashboard');
    return { success: true, campaignId: result.insertId };
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    throw new Error(error.message || 'Failed to create campaign.');
  }
}

export async function updateCampaign(id: number, formData: z.infer<typeof campaignSchema>) {
  const user = await authorizeUser();
  const data = campaignSchema.parse(formData);

  try {
    await poolConnection.query(
      `UPDATE tbl_marketing_campaigns SET
        campaign_name = ?, platform_id = ?, start_date = ?, end_date = ?,
        budget_amount = ?, spend_amount = ?, revenue_amount = ?, orders_generated = ?,
        updated_by = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [
        data.campaignName,
        data.platformId,
        data.startDate || null,
        data.endDate || null,
        data.budgetAmount.toFixed(2),
        data.spendAmount.toFixed(2),
        data.revenueAmount.toFixed(2),
        data.ordersGenerated,
        user.userCode,
        id,
      ]
    );

    revalidatePath('/marketing');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    throw new Error(error.message || 'Failed to update campaign.');
  }
}

export async function deleteCampaign(id: number) {
  const user = await authorizeUser();

  try {
    await poolConnection.query(
      `UPDATE tbl_marketing_campaigns SET deleted_at = NOW(), updated_by = ? WHERE id = ?`,
      [user.userCode, id]
    );

    revalidatePath('/marketing');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    throw new Error(error.message || 'Failed to delete campaign.');
  }
}
