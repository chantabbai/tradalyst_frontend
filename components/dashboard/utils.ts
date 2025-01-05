
export const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export function formatProfit(amount: number | undefined | null): string {
  if (!isNumber(amount)) return '$0.00';
  const absAmount = Math.abs(amount);
  const formattedAmount = absAmount.toFixed(2);
  return amount < 0 ? `-$${formattedAmount}` : `$${formattedAmount}`;
}

export const calculateTotalPnL = (data: { pnl: number }[]): number => {
  if (!data || data.length === 0) return 0;
  return data.reduce((sum, d) => sum + (isNumber(d.pnl) ? d.pnl : 0), 0);
};
