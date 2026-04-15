import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/database';
import User from './models/User';
import Account from './models/Account';
import Card from './models/Card';
import Loan from './models/Loan';
import Transaction from './models/Transaction';

async function seed(): Promise<void> {
  await connectDB();
  console.log('Seeding demo data...');

  await Promise.all([
    User.deleteMany({}),
    Account.deleteMany({}),
    Card.deleteMany({}),
    Loan.deleteMany({}),
    Transaction.deleteMany({}),
  ]);

  const user = await User.create({
    username: 'johndoe',
    email: 'john.doe@example.com',
    password: 'Demo@1234',
    fullName: 'John Doe',
  });

  const [checking, savings, rd] = await Account.create([
    {
      userId: user._id,
      type: 'checking',
      accountNumber: '123456789012',
      maskedNumber: '****9012',
      balance: 12450.75,
      availableBalance: 12200.75,
      nickname: 'US Bank Checking',
    },
    {
      userId: user._id,
      type: 'savings',
      accountNumber: '987654321098',
      maskedNumber: '****1098',
      balance: 45000.00,
      availableBalance: 45000.00,
      nickname: 'US Bank Savings',
      interestRate: 4.5,
    },
    {
      userId: user._id,
      type: 'rd',
      accountNumber: '555000111222',
      maskedNumber: '****1222',
      balance: 18000.00,
      availableBalance: 0,
      nickname: 'Recurring Deposit',
      interestRate: 6.5,
      rdMonthlyDeposit: 1500,
      rdTenureMonths: 24,
      maturityDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000),
    },
  ]);

  await Card.create([
    {
      userId: user._id,
      cardType: 'credit',
      network: 'Visa',
      maskedNumber: '****4523',
      cardholderName: 'JOHN DOE',
      expiryDate: '09/28',
      creditLimit: 15000,
      currentBalance: 3245.50,
      availableCredit: 11754.50,
      minimumPayment: 65.00,
      dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      status: 'active',
      rewardPoints: 12450,
    },
    {
      userId: user._id,
      cardType: 'debit',
      network: 'Visa',
      maskedNumber: '****9012',
      cardholderName: 'JOHN DOE',
      expiryDate: '03/27',
      currentBalance: 12450.75,
      status: 'active',
    },
  ]);

  await Loan.create([
    {
      userId: user._id,
      loanType: 'home',
      principalAmount: 350000,
      outstandingBalance: 287500,
      interestRate: 6.75,
      tenureMonths: 360,
      emiAmount: 2270.15,
      nextDueDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      startDate: new Date('2020-03-01'),
      endDate: new Date('2050-03-01'),
      status: 'active',
      loanNumber: 'LN-HOME-2020-4521',
    },
  ]);

  const txDates = [1, 3, 5, 7, 10, 14].map(d => {
    const date = new Date();
    date.setDate(date.getDate() - d);
    return date;
  });

  await Transaction.create([
    { userId: user._id, type: 'ach', status: 'completed', amount: 500, fromAccount: checking.maskedNumber, toAccount: '****8890', recipientName: 'Jane Smith', routingNumber: '071000013', memo: 'Rent', referenceNumber: 'ACH-A1B2-1700001', completedAt: txDates[0] },
    { userId: user._id, type: 'zelle', status: 'completed', amount: 75, fromAccount: checking.maskedNumber, recipientName: 'mike@example.com', memo: 'Dinner split', referenceNumber: 'ZEL-C3D4-1700002', completedAt: txDates[1] },
    { userId: user._id, type: 'wire', status: 'completed', amount: 2500, fromAccount: checking.maskedNumber, recipientName: 'Acme Corp', recipientBank: 'Chase', routingNumber: '021000021', memo: 'Invoice #1042', referenceNumber: 'WIRE-E5F6-1700003', completedAt: txDates[2] },
    { userId: user._id, type: 'card_payment', status: 'completed', amount: 500, fromAccount: checking.maskedNumber, memo: 'Credit card payment – custom', referenceNumber: 'CPY-G7H8-1700004', completedAt: txDates[3] },
    { userId: user._id, type: 'ach', status: 'completed', amount: 1200, fromAccount: savings.maskedNumber, toAccount: '****3311', recipientName: 'City Utilities', routingNumber: '042000314', memo: 'Utility bill', referenceNumber: 'ACH-I9J0-1700005', completedAt: txDates[4] },
    { userId: user._id, type: 'zelle', status: 'completed', amount: 150, fromAccount: checking.maskedNumber, recipientName: 'sara@example.com', memo: 'Concert tickets', referenceNumber: 'ZEL-K1L2-1700006', completedAt: txDates[5] },
  ]);

  console.log('Seed complete!');
  console.log('Demo login — username: johndoe | password: Demo@1234');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
