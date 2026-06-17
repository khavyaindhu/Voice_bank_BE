import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import RecurringBucket, { IRecurringBucket, IRecurringItem } from '../models/RecurringBucket';
import Payee from '../models/Payee';
import Transaction from '../models/Transaction';
import { genTransactionRef } from '../utils/transactionRef';
import mongoose from 'mongoose';

const AVATAR_COLORS = [
  '#002E6D', '#CC0000', '#1D4ED8', '#059669',
  '#7C3AED', '#D97706', '#0891B2', '#BE185D',
];

function mapItem(item: IRecurringItem) {
  return {
    id: item._id.toString(),
    name: item.name,
    category: item.category,
    amount: Number(item.amount),
    payeeId: item.payeeId?.toString(),
    dayOfMonth: item.dayOfMonth,
    aliases: item.aliases ?? [],
    notes: item.notes,
  };
}

function mapBucket(bucket: IRecurringBucket) {
  const items = bucket.items.map(mapItem);
  return {
    id: bucket._id.toString(),
    name: bucket.name,
    nickname: bucket.nickname,
    description: bucket.description,
    avatarColor: bucket.avatarColor,
    items,
    totalMonthly: items.reduce((sum, i) => sum + i.amount, 0),
  };
}

async function createTransactionForPayee(
  userId: string,
  payee: InstanceType<typeof Payee>,
  amount: number,
  fromAccount: string,
  memo: string,
) {
  if (payee.transferType === 'wire') {
    return Transaction.create({
      userId,
      type: 'wire',
      status: 'processing',
      amount,
      fromAccount,
      recipientName: payee.fullName,
      recipientBank: payee.bankName,
      routingNumber: payee.routingNumber,
      memo,
      referenceNumber: genTransactionRef('WIRE'),
    });
  }
  return Transaction.create({
    userId,
    type: 'ach',
    status: 'processing',
    amount,
    fromAccount,
    toAccount: payee.accountNumber,
    recipientName: payee.fullName,
    routingNumber: payee.routingNumber,
    memo,
    referenceNumber: genTransactionRef('ACH'),
    scheduledDate: new Date(),
  });
}

/** GET /recurring-buckets */
export async function getBuckets(req: AuthRequest, res: Response): Promise<void> {
  const buckets = await RecurringBucket.find({ userId: req.userId }).sort({ createdAt: 1 });
  res.json(buckets.map(mapBucket));
}

/** GET /recurring-buckets/:id */
export async function getBucket(req: AuthRequest, res: Response): Promise<void> {
  const bucket = await RecurringBucket.findOne({ _id: req.params.id, userId: req.userId });
  if (!bucket) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  res.json(mapBucket(bucket));
}

/** POST /recurring-buckets */
export async function createBucket(req: AuthRequest, res: Response): Promise<void> {
  const { name, nickname, description } = req.body;
  if (!name?.trim() || !nickname?.trim()) {
    res.status(400).json({ message: 'name and nickname are required' });
    return;
  }

  const count = await RecurringBucket.countDocuments({ userId: req.userId });
  const bucket = await RecurringBucket.create({
    userId: req.userId,
    name: name.trim(),
    nickname: nickname.trim(),
    description: description?.trim(),
    avatarColor: AVATAR_COLORS[count % AVATAR_COLORS.length],
    items: [],
  });

  res.status(201).json({ message: 'Bucket created', bucket: mapBucket(bucket) });
}

/** PATCH /recurring-buckets/:id */
export async function updateBucket(req: AuthRequest, res: Response): Promise<void> {
  const { name, nickname, description } = req.body;
  const bucket = await RecurringBucket.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    {
      ...(name != null && { name: String(name).trim() }),
      ...(nickname != null && { nickname: String(nickname).trim() }),
      ...(description != null && { description: String(description).trim() }),
    },
    { new: true }
  );
  if (!bucket) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  res.json({ message: 'Bucket updated', bucket: mapBucket(bucket) });
}

/** DELETE /recurring-buckets/:id */
export async function deleteBucket(req: AuthRequest, res: Response): Promise<void> {
  const result = await RecurringBucket.deleteOne({ _id: req.params.id, userId: req.userId });
  if (result.deletedCount === 0) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }
  res.json({ message: 'Bucket removed' });
}

/** POST /recurring-buckets/:id/items */
export async function addItem(req: AuthRequest, res: Response): Promise<void> {
  const { name, category, amount, payeeId, dayOfMonth, aliases, notes } = req.body;
  if (!name?.trim() || amount == null) {
    res.status(400).json({ message: 'name and amount are required' });
    return;
  }

  const bucket = await RecurringBucket.findOne({ _id: req.params.id, userId: req.userId });
  if (!bucket) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }

  bucket.items.push({
    _id: new mongoose.Types.ObjectId(),
    name: name.trim(),
    category: category ?? 'other',
    amount: parseFloat(amount),
    payeeId: payeeId ? new mongoose.Types.ObjectId(payeeId) : undefined,
    dayOfMonth: dayOfMonth ? parseInt(dayOfMonth, 10) : undefined,
    aliases: Array.isArray(aliases) ? aliases : [],
    notes: notes?.trim(),
  });
  await bucket.save();

  res.status(201).json({ message: 'Item added', bucket: mapBucket(bucket) });
}

/** PATCH /recurring-buckets/:id/items/:itemId */
export async function updateItem(req: AuthRequest, res: Response): Promise<void> {
  const bucket = await RecurringBucket.findOne({ _id: req.params.id, userId: req.userId });
  if (!bucket) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }

  const item = bucket.items.find(i => i._id.toString() === req.params.itemId);
  if (!item) {
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  const { name, category, amount, payeeId, dayOfMonth, aliases, notes, amountDelta } = req.body;

  if (name != null) item.name = String(name).trim();
  if (category != null) item.category = category;
  if (amount != null) item.amount = parseFloat(amount);
  if (amountDelta != null) item.amount = Number(item.amount) + parseFloat(amountDelta);
  if (payeeId != null) item.payeeId = new mongoose.Types.ObjectId(payeeId);
  if (dayOfMonth != null) item.dayOfMonth = parseInt(dayOfMonth, 10);
  if (aliases != null) item.aliases = aliases;
  if (notes != null) item.notes = String(notes).trim();

  await bucket.save();
  res.json({ message: 'Item updated', bucket: mapBucket(bucket) });
}

/** DELETE /recurring-buckets/:id/items/:itemId */
export async function deleteItem(req: AuthRequest, res: Response): Promise<void> {
  const bucket = await RecurringBucket.findOne({ _id: req.params.id, userId: req.userId });
  if (!bucket) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }

  const idx = bucket.items.findIndex(i => i._id.toString() === req.params.itemId);
  if (idx === -1) {
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  bucket.items.splice(idx, 1);
  await bucket.save();
  res.json({ message: 'Item removed', bucket: mapBucket(bucket) });
}

/** POST /recurring-buckets/:id/pay-all — pay every item in the bucket */
export async function payAll(req: AuthRequest, res: Response): Promise<void> {
  const { fromAccount } = req.body;
  if (!fromAccount) {
    res.status(400).json({ message: 'fromAccount is required' });
    return;
  }

  const bucket = await RecurringBucket.findOne({ _id: req.params.id, userId: req.userId });
  if (!bucket) {
    res.status(404).json({ message: 'Bucket not found' });
    return;
  }

  if (bucket.items.length === 0) {
    res.status(400).json({ message: 'Bucket has no recurring payments' });
    return;
  }

  const transactions: InstanceType<typeof Transaction>[] = [];
  const errors: string[] = [];

  for (const item of bucket.items) {
    const amt = Number(item.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      errors.push(`${item.name}: invalid amount`);
      continue;
    }

    const memo = `Recurring bucket ${bucket.nickname}: ${item.name}`;

    try {
      if (item.payeeId) {
        const payee = await Payee.findOne({ _id: item.payeeId, userId: req.userId });
        if (!payee) {
          errors.push(`${item.name}: linked payee not found`);
          continue;
        }
        const tx = await createTransactionForPayee(req.userId!, payee, amt, fromAccount, memo);
        transactions.push(tx);
        await Payee.findOneAndUpdate(
          { _id: payee._id, userId: req.userId },
          { $set: { lastPaidAmount: amt, lastPaidDate: new Date() }, $inc: { totalTransfers: 1 } }
        );
      } else {
        const tx = await Transaction.create({
          userId: req.userId,
          type: 'ach',
          status: 'processing',
          amount: amt,
          fromAccount,
          recipientName: item.name,
          memo,
          referenceNumber: genTransactionRef('ACH'),
          scheduledDate: new Date(),
        });
        transactions.push(tx);
      }
    } catch {
      errors.push(`${item.name}: payment failed`);
    }
  }

  res.status(201).json({
    message: `Processed ${transactions.length} of ${bucket.items.length} payments`,
    bucket: mapBucket(bucket),
    transactions,
    errors,
    totalPaid: transactions.reduce((s, t) => s + Number(t.amount), 0),
  });
}
