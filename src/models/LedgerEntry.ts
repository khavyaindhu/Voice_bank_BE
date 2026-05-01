import mongoose, { Document, Schema } from 'mongoose';

export type LedgerCategory =
  | 'payroll'
  | 'deposit'
  | 'withdrawal'
  | 'ach_transfer'
  | 'wire_transfer'
  | 'zelle'
  | 'loan_payment'
  | 'interest_credit'
  | 'card_payment'
  | 'vendor_payment'
  | 'utility_payment'
  | 'fee'
  | 'month_end_accrual'
  | 'cash_replenishment'
  | 'atm_fill'
  | 'vault_transfer';

export interface ILedgerEntry extends Document {
  userId:            mongoose.Types.ObjectId;
  customerDisplayId: string;   // CUST-001 … CUST-006
  customerName:      string;
  accountNo:         string;   // masked, e.g. ****1230
  accountType:       'checking' | 'savings' | 'rd';
  date:              Date;
  entryType:         'credit' | 'debit';
  category:          LedgerCategory;
  description:       string;
  amount:            number;
  runningBalance:    number;
  ref:               string;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
  {
    userId:            { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerDisplayId: { type: String, required: true, index: true },
    customerName:      { type: String, required: true },
    accountNo:         { type: String, required: true },
    accountType:       { type: String, enum: ['checking', 'savings', 'rd'], required: true },
    date:              { type: Date, required: true, index: true },
    entryType:         { type: String, enum: ['credit', 'debit'], required: true },
    category:          { type: String, required: true },
    description:       { type: String, required: true },
    amount:            { type: Number, required: true },
    runningBalance:    { type: Number, required: true },
    ref:               { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

LedgerEntrySchema.index({ date: -1, customerDisplayId: 1 });

export default mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
