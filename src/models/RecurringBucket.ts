import mongoose, { Document, Schema, Types } from 'mongoose';

export type RecurringCategory =
  | 'rent'
  | 'emi'
  | 'subscription'
  | 'utility'
  | 'maintenance'
  | 'other';

export interface IRecurringItem {
  _id: Types.ObjectId;
  name: string;
  category: RecurringCategory;
  amount: number;
  payeeId?: Types.ObjectId;
  dayOfMonth?: number;
  aliases: string[];
  notes?: string;
}

export interface IRecurringBucket extends Document {
  userId: Types.ObjectId;
  /** Display name, e.g. "Bucket A — Monthly Bills" */
  name: string;
  /** Short voice alias, e.g. "A" for "bucket A" */
  nickname: string;
  description?: string;
  avatarColor: string;
  items: IRecurringItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

const RecurringItemSchema = new Schema<IRecurringItem>(
  {
    name:       { type: String, required: true, trim: true },
    category:   {
      type: String,
      enum: ['rent', 'emi', 'subscription', 'utility', 'maintenance', 'other'],
      default: 'other',
    },
    amount:     { type: Number, required: true, min: 0 },
    payeeId:    { type: Schema.Types.ObjectId, ref: 'Payee' },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    aliases:    { type: [String], default: [] },
    notes:      { type: String },
  },
  { _id: true }
);

const RecurringBucketSchema = new Schema<IRecurringBucket>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:        { type: String, required: true, trim: true },
    nickname:    { type: String, required: true, trim: true },
    description: { type: String },
    avatarColor: { type: String, default: '#002E6D' },
    items:       { type: [RecurringItemSchema], default: [] },
  },
  { timestamps: true }
);

RecurringBucketSchema.index({ userId: 1, nickname: 1 });

export default mongoose.model<IRecurringBucket>('RecurringBucket', RecurringBucketSchema);
