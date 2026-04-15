import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Transaction from '../models/Transaction';
import { v4 as uuidv4 } from 'uuid';

function genRef(prefix: string): string {
  return `${prefix}-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;
}

export async function initiateACH(req: AuthRequest, res: Response): Promise<void> {
  const { fromAccount, toAccount, recipientName, routingNumber, amount, memo, scheduledDate } = req.body;
  if (!fromAccount || !toAccount || !routingNumber || !amount || !recipientName) {
    res.status(400).json({ message: 'Missing required fields for ACH transfer' });
    return;
  }
  const tx = await Transaction.create({
    userId: req.userId,
    type: 'ach',
    status: 'processing',
    amount: parseFloat(amount),
    fromAccount,
    toAccount,
    recipientName,
    routingNumber,
    memo,
    referenceNumber: genRef('ACH'),
    scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
  });
  res.status(201).json({ message: 'ACH transfer initiated', transaction: tx });
}

export async function initiateWire(req: AuthRequest, res: Response): Promise<void> {
  const { fromAccount, recipientName, recipientBank, routingNumber, swiftCode, amount, memo, isInternational } = req.body;
  if (!fromAccount || !recipientName || !amount) {
    res.status(400).json({ message: 'Missing required fields for wire transfer' });
    return;
  }
  if (isInternational && !swiftCode) {
    res.status(400).json({ message: 'SWIFT code required for international wire' });
    return;
  }
  const tx = await Transaction.create({
    userId: req.userId,
    type: 'wire',
    status: 'processing',
    amount: parseFloat(amount),
    fromAccount,
    recipientName,
    recipientBank,
    routingNumber,
    swiftCode,
    memo,
    referenceNumber: genRef('WIRE'),
  });
  res.status(201).json({ message: 'Wire transfer initiated', transaction: tx });
}

export async function initiateZelle(req: AuthRequest, res: Response): Promise<void> {
  const { fromAccount, recipientContact, amount, memo } = req.body;
  if (!fromAccount || !recipientContact || !amount) {
    res.status(400).json({ message: 'Missing required fields for Zelle' });
    return;
  }
  const tx = await Transaction.create({
    userId: req.userId,
    type: 'zelle',
    status: 'completed',
    amount: parseFloat(amount),
    fromAccount,
    toAccount: recipientContact,
    recipientName: recipientContact,
    memo,
    referenceNumber: genRef('ZEL'),
    completedAt: new Date(),
  });
  res.status(201).json({ message: 'Zelle payment sent', transaction: tx });
}

export async function makeCardPayment(req: AuthRequest, res: Response): Promise<void> {
  const { fromAccount, cardId, paymentType, customAmount } = req.body;
  if (!fromAccount || !cardId || !paymentType) {
    res.status(400).json({ message: 'Missing required fields for card payment' });
    return;
  }
  const tx = await Transaction.create({
    userId: req.userId,
    type: 'card_payment',
    status: 'completed',
    amount: parseFloat(customAmount || 0),
    fromAccount,
    toAccount: cardId,
    memo: `Card payment – ${paymentType}`,
    referenceNumber: genRef('CPY'),
    completedAt: new Date(),
  });
  res.status(201).json({ message: 'Card payment successful', transaction: tx });
}

export async function getPaymentHistory(req: AuthRequest, res: Response): Promise<void> {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const type = req.query['type'] as string;
  const filter: Record<string, unknown> = { userId: req.userId };
  if (type) filter['type'] = type;

  const transactions = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await Transaction.countDocuments(filter);
  res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
}
