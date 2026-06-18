import mongoose from 'mongoose';

export interface EmiPaymentSeedOpts {
  userId: mongoose.Types.ObjectId;
  loanId: mongoose.Types.ObjectId;
  fromAccount: string;
  toAccount?: string;
  recipientName: string;
  routingNumber?: string;
  amount: number;
  count: number;
  startYear: number;
  startMonth: number;
  dayOfMonth: number;
  memoPrefix: string;
  refPrefix: string;
}

/** Build monthly EMI transaction documents for database seeding only. */
export function buildEmiPaymentDocs(opts: EmiPaymentSeedOpts) {
  const txs = [];
  for (let i = 0; i < opts.count; i++) {
    const monthIndex = opts.startMonth - 1 + i;
    const year = opts.startYear + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    const date = new Date(year, month - 1, opts.dayOfMonth);
    const monthLabel = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    txs.push({
      userId: opts.userId,
      loanId: opts.loanId,
      type: 'ach',
      status: 'completed',
      amount: opts.amount,
      fromAccount: opts.fromAccount,
      ...(opts.toAccount ? { toAccount: opts.toAccount } : {}),
      recipientName: opts.recipientName,
      ...(opts.routingNumber ? { routingNumber: opts.routingNumber } : {}),
      memo: `${opts.memoPrefix} – ${monthLabel}`,
      referenceNumber: `${opts.refPrefix}-${String(i + 1).padStart(3, '0')}`,
      completedAt: date,
    });
  }
  return txs;
}
