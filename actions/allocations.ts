'use server';

import { poolConnection } from '@/lib/db/db';
import { dbAllocateProductCosts, dbGenerateBusinessCode } from '@/lib/db/procedures';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const allocationItemSchema = z.object({
  variantId: z.number().int().positive(),
  quantityBasis: z.number().nonnegative(),
  valueBasis: z.number().nonnegative(),
  allocationAmount: z.number().positive('Allocation amount must be positive.'),
});

const expenseSchema = z.object({
  expenseName: z.string().min(3, 'Expense name must be at least 3 characters.'),
  expenseCategoryId: z.number().int().positive('Please select a valid category.'),
  costComponentId: z.number().int().positive('Please select a valid cost component.'),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD).'),
  amount: z.number().positive('Total amount must be positive.'),
  methodCode: z.enum([
    'equal_distribution',
    'quantity_based',
    'purchase_value_based',
    'manual_allocation',
  ]),
  allocations: z.array(allocationItemSchema).min(1, 'Please select at least one variant to allocate costs.'),
  notes: z.string().optional().nullable(),
});

async function authorizeUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized. Admin access required for financial cost allocations.');
  }
  return session.user;
}

export async function createExpenseAllocation(formData: z.infer<typeof expenseSchema>) {
  const user = await authorizeUser();
  const data = expenseSchema.parse(formData);

  // Validate allocation sum matches total amount
  const sumAllocations = data.allocations.reduce((acc, item) => acc + item.allocationAmount, 0);
  if (Math.abs(sumAllocations - data.amount) > 0.05) {
    throw new Error(
      `Total allocation sum (৳${sumAllocations.toFixed(2)}) must equal the total expense amount (৳${data.amount.toFixed(2)}).`
    );
  }

  const expenseCode = await dbGenerateBusinessCode('expenses', 'EXP');

  // 2. Insert expense using raw SQL (bigint PK auto-increment)
  const [expenseResult]: any = await poolConnection.query(
    `INSERT INTO tbl_expenses
      (expense_code, expense_category_id, cost_component_id, expense_name, expense_type,
       expense_date, amount, currency, exchange_rate, notes, expense_status, created_by)
     VALUES (?, ?, ?, ?, 'Post-Import', ?, ?, 'BDT', '1.0000', ?, 'posted', ?)`,
    [
      expenseCode,
      data.expenseCategoryId,
      data.costComponentId,
      data.expenseName,
      data.expenseDate,
      data.amount.toFixed(2),
      data.notes || null,
      user.userCode,
    ]
  );

  const expenseId: number = expenseResult.insertId;

  // Map method code to allocation_method_id
  const methodIdMap: Record<string, number> = {
    equal_distribution: 1,
    quantity_based: 2,
    purchase_value_based: 3,
    manual_allocation: 4,
  };

  // 3. Per-variant: call SP + write cost ledger
  for (const item of data.allocations) {
    await dbAllocateProductCosts(
      expenseId,
      data.methodCode,
      'product',
      item.variantId,
      item.quantityBasis,
      item.valueBasis,
      item.allocationAmount,
      data.notes || ''
    );

    const ledgerCode = await dbGenerateBusinessCode('product_cost_ledger', 'LGR');
    const unitCostImpact = item.quantityBasis > 0 ? item.allocationAmount / item.quantityBasis : 0;

    await poolConnection.query(
      `INSERT INTO tbl_product_cost_ledger
        (ledger_code, variant_id, expense_id, cost_component_id, allocation_method_id,
         allocated_amount, cost_per_unit, effective_date, reference_type, reference_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'expense', ?, ?)`,
      [
        ledgerCode,
        item.variantId,
        expenseId,
        data.costComponentId,
        methodIdMap[data.methodCode] ?? 1,
        item.allocationAmount.toFixed(2),
        unitCostImpact.toFixed(2),
        data.expenseDate,
        expenseId,
        user.userCode,
      ]
    );
  }

  revalidatePath('/cost-allocation');
  revalidatePath('/products');
  revalidatePath('/dashboard');
  return { success: true, expenseId };
}
