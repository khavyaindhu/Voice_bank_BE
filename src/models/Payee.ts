import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPayee extends Document {
  userId:        Types.ObjectId;
  nickname:      string;
  fullName:      string;
  bankName:      string;
  routingNumber: string;
  accountNumber: string;   // stored as-is for POC; encrypt at rest in production
  accountType:   'checking' | 'savings';
  transferType:  'wire' | 'ach';
  category:      'business' | 'personal' | 'family' | 'utility';
  avatarColor:   string;
  lastPaidAmount?: number;
  lastPaidDate?:   Date;
  totalTransfers:  number;
}

const PayeeSchema = new Schema<IPayee>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    nickname:      { type: String, required: true, trim: true },
    fullName:      { type: String, required: true, trim: true },
    bankName:      { type: String, required: true, trim: true },
    routingNumber: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    accountType:   { type: String, enum: ['checking', 'savings'], default: 'checking' },
    transferType:  { type: String, enum: ['wire', 'ach'],         default: 'ach' },
    category:      { type: String, enum: ['business', 'personal', 'family', 'utility'], default: 'business' },
    avatarColor:   { type: String, default: '#002E6D' },
    lastPaidAmount:{ type: Number },
    lastPaidDate:  { type: Date },
    totalTransfers:{ type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IPayee>('Payee', PayeeSchema);
