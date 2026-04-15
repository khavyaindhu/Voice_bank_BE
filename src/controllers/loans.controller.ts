import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Loan from '../models/Loan';
import { v4 as uuidv4 } from 'uuid';

export async function getLoans(req: AuthRequest, res: Response): Promise<void> {
  const loans = await Loan.find({ userId: req.userId });
  res.json(loans);
}

export async function getLoanById(req: AuthRequest, res: Response): Promise<void> {
  const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
  if (!loan) { res.status(404).json({ message: 'Loan not found' }); return; }
  res.json(loan);
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
