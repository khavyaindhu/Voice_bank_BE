import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Loan, { ILoan } from '../models/Loan';
import Transaction from '../models/Transaction';
import { v4 as uuidv4 } from 'uuid';

function mapLoan(loan: ILoan) {
  return {
    id: loan._id.toString(),
    loanType: loan.loanType,
    loanNumber: loan.loanNumber,
    principalAmount: loan.principalAmount,
    outstandingBalance: loan.outstandingBalance,
    interestRate: loan.interestRate,
    tenureMonths: loan.tenureMonths,
    emiAmount: loan.emiAmount,
    nextDueDate: loan.nextDueDate,
    startDate: loan.startDate,
    endDate: loan.endDate,
    status: loan.status,
    lenderName: loan.lenderName,
    linkedPayeeId: loan.linkedPayeeId?.toString(),
  };
}

async function buildEmiProgress(loan: ILoan) {
  const payments = await Transaction.find({
    userId: loan.userId,
    loanId: loan._id,
    status: 'completed',
  }).sort({ completedAt: -1 });

  const installmentsPaid = payments.length;
  const totalPaid = payments.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const installmentsRemaining = Math.max(0, loan.tenureMonths - installmentsPaid);
  const principalRepaid = loan.principalAmount - loan.outstandingBalance;
  const now = new Date();
  const monthsSinceStart = Math.max(
    0,
    (now.getFullYear() - loan.startDate.getFullYear()) * 12 +
      (now.getMonth() - loan.startDate.getMonth()),
  );

  return {
    loan: mapLoan(loan),
    installmentsPaid,
    installmentsRemaining,
    totalPaid: Math.round(totalPaid * 100) / 100,
    principalRepaid: Math.round(principalRepaid * 100) / 100,
    monthsSinceStart,
    payments: payments.map(tx => ({
      id: tx._id.toString(),
      amount: Number(tx.amount),
      completedAt: tx.completedAt ?? tx.createdAt,
      referenceNumber: tx.referenceNumber,
      memo: tx.memo,
      recipientName: tx.recipientName,
    })),
  };
}

export async function getLoans(req: AuthRequest, res: Response): Promise<void> {
  const loans = await Loan.find({ userId: req.userId });
  res.json(loans);
}

export async function getLoanById(req: AuthRequest, res: Response): Promise<void> {
  const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
  if (!loan) { res.status(404).json({ message: 'Loan not found' }); return; }
  res.json(loan);
}

/** GET /loans/emi-progress?type=auto|home */
export async function getEmiProgressByType(req: AuthRequest, res: Response): Promise<void> {
  const type = String(req.query.type ?? '').toLowerCase();
  if (!['home', 'auto', 'personal', 'student'].includes(type)) {
    res.status(400).json({ message: 'Query param type must be home, auto, personal, or student' });
    return;
  }
  const loan = await Loan.findOne({ userId: req.userId, loanType: type, status: 'active' });
  if (!loan) {
    res.status(404).json({ message: `No active ${type} loan found` });
    return;
  }
  res.json(await buildEmiProgress(loan));
}

/** GET /loans/:id/emi-progress */
export async function getLoanEmiProgress(req: AuthRequest, res: Response): Promise<void> {
  const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
  if (!loan) { res.status(404).json({ message: 'Loan not found' }); return; }
  res.json(await buildEmiProgress(loan));
}

export async function applyForLoan(req: AuthRequest, res: Response): Promise<void> {
  const { loanType, principalAmount, tenureMonths } = req.body;
  if (!loanType || !principalAmount || !tenureMonths) {
    res.status(400).json({ message: 'Loan type, amount, and tenure required' });
    return;
  }
  const rateMap: Record<string, number> = { home: 6.75, auto: 8.5, personal: 12.5, student: 5.0 };
  const rate = rateMap[loanType] || 10;
  const monthly = rate / 100 / 12;
  const emi = (parseFloat(principalAmount) * monthly * Math.pow(1 + monthly, tenureMonths)) /
    (Math.pow(1 + monthly, tenureMonths) - 1);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + parseInt(tenureMonths));
  const nextDueDate = new Date();
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  const loan = await Loan.create({
    userId: req.userId,
    loanType,
    principalAmount: parseFloat(principalAmount),
    outstandingBalance: parseFloat(principalAmount),
    interestRate: rate,
    tenureMonths: parseInt(tenureMonths),
    emiAmount: Math.round(emi * 100) / 100,
    nextDueDate,
    startDate,
    endDate,
    loanNumber: `LN-${uuidv4().split('-')[0].toUpperCase()}`,
  });
  res.status(201).json({ message: 'Loan application submitted. Under review.', loan });
}
