import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Account from '../models/Account';
import Transaction from '../models/Transaction';

export async function getAccounts(req: AuthRequest, res: Response): Promise<void> {
  const accounts = await Account.find({ userId: req.userId });
  res.json(accounts);
}

export async function getAccountById(req: AuthRequest, res: Response): Promise<void> {
  const account = await Account.findOne({ _id: req.params.id, userId: req.userId });
  if (!account) { res.status(404).json({ message: 'Account not found' }); return; }
  res.json(account);
}

export async function getAccountTransactions(req: AuthRequest, res: Response): Promise<void> {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const transactions = await Transaction.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await Transaction.countDocuments({ userId: req.userId });
  res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
}
