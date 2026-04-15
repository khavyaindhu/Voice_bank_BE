import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType = 'ach' | 'wire' | 'zelle' | 'card_payment' | 'deposit' | 'withdrawal' | 'transfer';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  fromAccount?: string;
  toAccount?: string;
  recipientName?: string;
  recipientBank?: string;
  routingNumber?: string;
  swiftCode?: string;
  memo?: string;
  referenceNumber: string;
  scheduledDate?: Date;
  completedAt?: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['ach', 'wire', 'zelle', 'card_payment', 'deposit', 'withdrawal', 'transfer'], required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], default: 'pending' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    fromAccount: String,
    toAccount: String,
    recipientName: String,
    recipientBank: String,
    routingNumber: String,
    swiftCode: String,
    memo: String,
    referenceNumber: { type: String, required: true, unique: true },
    scheduledDate: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
