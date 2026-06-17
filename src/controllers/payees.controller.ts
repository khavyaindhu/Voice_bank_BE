import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Payee from '../models/Payee';
import Transaction from '../models/Transaction';
import { genTransactionRef } from '../utils/transactionRef';

const AVATAR_COLORS = [
  '#002E6D', '#CC0000', '#1D4ED8', '#059669',
  '#7C3AED', '#D97706', '#0891B2', '#BE185D',
];

/** GET /payees — list all payees for the authenticated user */
export async function getPayees(req: AuthRequest, res: Response): Promise<void> {
  const payees = await Payee.find({ userId: req.userId }).sort({ createdAt: 1 });
  // Never send the full account number to the client
  const sanitized = payees.map(p => ({
    id:             p._id,
    nickname:       p.nickname,
    fullName:       p.fullName,
    bankName:       p.bankName,
    routingNumber:  p.routingNumber,
    accountNumber:  p.accountNumber,          // sent to FE for payment execution
    accountType:    p.accountType,
    transferType:   p.transferType,
    category:       p.category,
    avatarColor:    p.avatarColor,
    lastPaidAmount: p.lastPaidAmount,
    lastPaidDate:   p.lastPaidDate?.toISOString().split('T')[0],
    totalTransfers: p.totalTransfers,
  }));
  res.json(sanitized);
}

/** POST /payees — create a new payee */
export async function createPayee(req: AuthRequest, res: Response): Promise<void> {
  const { nickname, fullName, bankName, routingNumber, accountNumber, accountType, transferType, category } = req.body;

  if (!nickname || !fullName || !bankName || !routingNumber || !accountNumber) {
    res.status(400).json({ message: 'Missing required payee fields' });
    return;
  }
  if (routingNumber.length !== 9 || !/^\d{9}$/.test(routingNumber)) {
    res.status(400).json({ message: 'Routing number must be exactly 9 digits' });
    return;
  }

  const count = await Payee.countDocuments({ userId: req.userId });
  const avatarColor = AVATAR_COLORS[count % AVATAR_COLORS.length];

  const payee = await Payee.create({
    userId: req.userId,
    nickname: nickname.trim(),
    fullName: fullName.trim(),
    bankName: bankName.trim(),
    routingNumber: routingNumber.trim(),
    accountNumber: accountNumber.trim(),
    accountType:  accountType  || 'checking',
    transferType: transferType || 'ach',
    category:     category     || 'business',
    avatarColor,
    totalTransfers: 0,
  });

  res.status(201).json({
    message: 'Payee saved',
    payee: {
      id:             payee._id,
      nickname:       payee.nickname,
      fullName:       payee.fullName,
      bankName:       payee.bankName,
      routingNumber:  payee.routingNumber,
      accountNumber:  payee.accountNumber,
      accountType:    payee.accountType,
      transferType:   payee.transferType,
      category:       payee.category,
      avatarColor:    payee.avatarColor,
      totalTransfers: payee.totalTransfers,
    },
  });
}

/** DELETE /payees/:id — remove a saved payee */
export async function deletePayee(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await Payee.deleteOne({ _id: id, userId: req.userId });
  if (result.deletedCount === 0) {
    res.status(404).json({ message: 'Payee not found' });
    return;
  }
  res.json({ message: 'Payee removed' });
}

/** PATCH /payees/:id/record-payment — update last-paid stats after a successful transfer */
export async function recordPayment(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { amount } = req.body;

  const payee = await Payee.findOneAndUpdate(
    { _id: id, userId: req.userId },
    {
      $set:  { lastPaidAmount: parseFloat(amount), lastPaidDate: new Date() },
      $inc:  { totalTransfers: 1 },
    },
    { new: true }
  );

  if (!payee) {
    res.status(404).json({ message: 'Payee not found' });
    return;
  }
  res.json({ message: 'Payment recorded', totalTransfers: payee.totalTransfers });
}

/**
 * POST /payees/:id/pay — execute Quick Pay: log transaction + update payee stats.
 * Used by Maya voice Quick Pay and the Quick Pay page so every send appears in history.
 */
export async function sendPayeePayment(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { amount, fromAccount, memo } = req.body;

  if (!fromAccount || amount == null) {
    res.status(400).json({ message: 'fromAccount and amount are required' });
    return;
  }

  const payee = await Payee.findOne({ _id: id, userId: req.userId });
  if (!payee) {
    res.status(404).json({ message: 'Payee not found' });
    return;
  }

  const amt = parseFloat(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    res.status(400).json({ message: 'amount must be a positive number' });
    return;
  }

  const txMemo = (memo?.trim() || `Quick Pay to ${payee.nickname}`);

  let tx;
  if (payee.transferType === 'wire') {
    tx = await Transaction.create({
      userId: req.userId,
      type: 'wire',
      status: 'processing',
      amount: amt,
      fromAccount,
      recipientName: payee.fullName,
      recipientBank: payee.bankName,
      routingNumber: payee.routingNumber,
      memo: txMemo,
      referenceNumber: genTransactionRef('WIRE'),
    });
  } else {
    tx = await Transaction.create({
      userId: req.userId,
      type: 'ach',
      status: 'processing',
      amount: amt,
      fromAccount,
      toAccount: payee.accountNumber,
      recipientName: payee.fullName,
      routingNumber: payee.routingNumber,
      memo: txMemo,
      referenceNumber: genTransactionRef('ACH'),
      scheduledDate: new Date(),
    });
  }

  const updated = await Payee.findOneAndUpdate(
    { _id: id, userId: req.userId },
    {
      $set: { lastPaidAmount: amt, lastPaidDate: new Date() },
      $inc: { totalTransfers: 1 },
    },
    { new: true }
  );

  res.status(201).json({
    message: 'Payment sent',
    transaction: tx,
    totalTransfers: updated?.totalTransfers ?? payee.totalTransfers + 1,
  });
}

