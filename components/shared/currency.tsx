import React from 'react';

interface CurrencyProps {
  amount: number | string;
  rmbAmount?: number | string;
  rmbRate?: number | string;
  className?: string;
}

export function formatBDT(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '৳0.00';
  
  // Format with thousands separator and 2 decimal places
  return '৳' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatRMB(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '¥0.00';
  return '¥' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Currency({ amount, rmbAmount, rmbRate, className = '' }: CurrencyProps) {
  const formattedBDT = formatBDT(amount);
  
  if (rmbAmount !== undefined) {
    const formattedRMB = formatRMB(rmbAmount);
    const rateText = rmbRate !== undefined ? ` @ ${Number(rmbRate).toFixed(2)}` : '';
    return (
      <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
        <span className="font-semibold text-zinc-100">{formattedBDT}</span>
        <span className="text-xs text-zinc-400">
          ({formattedRMB}{rateText})
        </span>
      </span>
    );
  }

  return <span className={`font-semibold text-zinc-100 ${className}`}>{formattedBDT}</span>;
}
