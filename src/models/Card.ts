import mongoose, { Document, Schema } from 'mongoose';

export interface ICard extends Document {
  userId: mongoose.Types.ObjectId;
  cardType: 'credit' | 'debit';
  network: 'Visa' | 'Mastercard';
  maskedNumber: string;
  cardholderName: string;
  expiryDate: string;
  creditLimit?: number;
  currentBalance: number;
  availableCredit?: number;
  minimumPayment?: number;
  dueDate?: Date;
  status: 'active' | 'frozen' | 'blocked';
  rewardPoints?: number;
}

const CardSchema = new Schema<ICard>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cardType: { type: String, enum: ['credit', 'debit'], required: true },
    network: { type: String, enum: ['Visa', 'Mastercard'], required: true },
    maskedNumber: { type: String, required: true },
    cardholderName: { type: String, required: true },
    expiryDate: { type: String, required: true },
    creditLimit: Number,
    currentBalance: { type: Number, default: 0 },
    availableCredit: Number,
    minimumPayment: Number,
    dueDate: Date,
    status: { type: String, enum: ['active', 'frozen', 'blocked'], default: 'active' },
    rewardPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICard>('Card', CardSchema);
