import mongoose, { Document, Schema } from 'mongoose';

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'checking' | 'savings' | 'credit' | 'rd';
  accountNumber: string;
  maskedNumber: string;
  balance: number;
  availableBalance: number;
  currency: string;
  nickname: string;
  interestRate?: number;
  maturityDate?: Date;
  rdMonthlyDeposit?: number;
  rdTenureMonths?: number;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['checking', 'savings', 'credit', 'rd'], required: true },
    accountNumber: { type: String, required: true, unique: true },
    maskedNumber: { type: String, required: true },
    balance: { type: Number, required: true, default: 0 },
    availableBalance: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
    nickname: { type: String, required: true },
    interestRate: Number,
    maturityDate: Date,
    rdMonthlyDeposit: Number,
    rdTenureMonths: Number,
  },
  { timestamps: true }
);

export default mongoose.model<IAccount>('Account', AccountSchema);
