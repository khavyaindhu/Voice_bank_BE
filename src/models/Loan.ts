import mongoose, { Document, Schema } from 'mongoose';

export interface ILoan extends Document {
  userId: mongoose.Types.ObjectId;
  loanType: 'home' | 'auto' | 'personal' | 'student';
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  nextDueDate: Date;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'closed' | 'defaulted';
  loanNumber: string;
  lenderName: string;
}

const LoanSchema = new Schema<ILoan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    loanType: { type: String, enum: ['home', 'auto', 'personal', 'student'], required: true },
    principalAmount: { type: Number, required: true },
    outstandingBalance: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    emiAmount: { type: Number, required: true },
    nextDueDate: { type: Date, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'closed', 'defaulted'], default: 'active' },
    loanNumber: { type: String, required: true, unique: true },
    lenderName: { type: String, default: 'U.S. Bank' },
  },
  { timestamps: true }
);

export default mongoose.model<ILoan>('Loan', LoanSchema);
