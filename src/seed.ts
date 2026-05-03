import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/database';
import User from './models/User';
import Account from './models/Account';
import Card from './models/Card';
import Loan from './models/Loan';
import Transaction from './models/Transaction';
import Payee from './models/Payee';
import LedgerEntry from './models/LedgerEntry';

// ── Date helpers ─────────────────────────────────────────────────────────────

function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

// ── Main seed ────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  await connectDB();
  console.log('Seeding demo data...');

  await Promise.all([
    User.deleteMany({}),
    Account.deleteMany({}),
    Card.deleteMany({}),
    Loan.deleteMany({}),
    Transaction.deleteMany({}),
    Payee.deleteMany({}),
    LedgerEntry.deleteMany({}),
  ]);

  // ── Primary demo user (logs in via UI) ───────────────────────────────────
  const user = await User.create({
    username: 'johndoe',
    email: 'john.doe@example.com',
    password: 'Demo@1234',
    fullName: 'John Doe',
  });

  const [checking, savings] = await Account.create([
    {
      userId: user._id, type: 'checking',
      accountNumber: '123456789012', maskedNumber: '****9012',
      balance: 12450.75, availableBalance: 12200.75,
      nickname: 'US Bank Checking',
    },
    {
      userId: user._id, type: 'savings',
      accountNumber: '987654321098', maskedNumber: '****1098',
      balance: 45000, availableBalance: 45000,
      nickname: 'US Bank Savings', interestRate: 4.5,
    },
    {
      userId: user._id, type: 'rd',
      accountNumber: '555000111222', maskedNumber: '****1222',
      balance: 18000, availableBalance: 0,
      nickname: 'Recurring Deposit', interestRate: 6.5,
      rdMonthlyDeposit: 1500, rdTenureMonths: 24,
      maturityDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000),
    },
  ]);

  await Card.create([
    {
      userId: user._id, cardType: 'credit', network: 'Visa',
      maskedNumber: '****4523', cardholderName: 'JOHN DOE',
      expiryDate: '09/28', creditLimit: 15000, currentBalance: 3245.50,
      availableCredit: 11754.50, minimumPayment: 65,
      dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      status: 'active', rewardPoints: 12450,
    },
    {
      userId: user._id, cardType: 'debit', network: 'Visa',
      maskedNumber: '****9012', cardholderName: 'JOHN DOE',
      expiryDate: '03/27', currentBalance: 12450.75, status: 'active',
    },
  ]);

  await Loan.create([{
    userId: user._id, loanType: 'home',
    principalAmount: 350000, outstandingBalance: 287500,
    interestRate: 6.75, tenureMonths: 360, emiAmount: 2270.15,
    nextDueDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
    startDate: new Date('2020-03-01'), endDate: new Date('2050-03-01'),
    status: 'active', loanNumber: 'LN-HOME-2020-4521',
  }]);

  const txBase = new Date();
  await Transaction.create([
    { userId: user._id, type: 'ach',          status: 'completed', amount: 500,  fromAccount: checking.maskedNumber, toAccount: '****8890', recipientName: 'Jane Smith',      routingNumber: '071000013', memo: 'Rent',             referenceNumber: 'ACH-A1B2-001', completedAt: new Date(txBase.getTime() - 1*86400000) },
    { userId: user._id, type: 'zelle',        status: 'completed', amount: 75,   fromAccount: checking.maskedNumber, recipientName: 'mike@example.com',                         memo: 'Dinner split',      referenceNumber: 'ZEL-C3D4-002', completedAt: new Date(txBase.getTime() - 3*86400000) },
    { userId: user._id, type: 'wire',         status: 'completed', amount: 2500, fromAccount: checking.maskedNumber, recipientName: 'Acme Corp',         recipientBank: 'Chase', memo: 'Invoice #1042',    referenceNumber: 'WIRE-E5F6-003', completedAt: new Date(txBase.getTime() - 5*86400000) },
    { userId: user._id, type: 'card_payment', status: 'completed', amount: 500,  fromAccount: checking.maskedNumber,                                                             memo: 'Credit card pay',  referenceNumber: 'CPY-G7H8-004',  completedAt: new Date(txBase.getTime() - 7*86400000) },
    { userId: user._id, type: 'ach',          status: 'completed', amount: 1200, fromAccount: savings.maskedNumber,  toAccount: '****3311', recipientName: 'City Utilities',    memo: 'Utility bill',     referenceNumber: 'ACH-I9J0-005',  completedAt: new Date(txBase.getTime() - 10*86400000) },
    { userId: user._id, type: 'zelle',        status: 'completed', amount: 150,  fromAccount: checking.maskedNumber, recipientName: 'sara@example.com',                         memo: 'Concert tickets',  referenceNumber: 'ZEL-K1L2-006',  completedAt: new Date(txBase.getTime() - 14*86400000) },
  ]);

  await Payee.create([
    { userId: user._id, nickname: 'Vijaya',          fullName: 'Vijaya Krishnamurthy',        bankName: 'Chase Bank',        routingNumber: '021000021', accountNumber: '4521789012', accountType: 'checking', transferType: 'wire', category: 'business', avatarColor: '#002E6D', lastPaidAmount: 12500, lastPaidDate: new Date('2024-12-15'), totalTransfers: 8 },
    { userId: user._id, nickname: 'Father',           fullName: 'Ramesh Venkataraman',         bankName: 'Wells Fargo',       routingNumber: '121000248', accountNumber: '9876543210', accountType: 'savings',  transferType: 'ach',  category: 'family',   avatarColor: '#BE185D', lastPaidAmount: 500,   lastPaidDate: new Date('2025-01-02'), totalTransfers: 24 },
    { userId: user._id, nickname: 'Metro Properties', fullName: 'Metro Properties Group Inc',  bankName: 'Bank of America',   routingNumber: '026009593', accountNumber: '1122334455', accountType: 'checking', transferType: 'ach',  category: 'business', avatarColor: '#CC0000', lastPaidAmount: 2200,  lastPaidDate: new Date('2025-01-01'), totalTransfers: 12 },
    { userId: user._id, nickname: 'Tech Solutions',   fullName: 'Tech Solutions Inc',          bankName: 'Citibank',          routingNumber: '021000089', accountNumber: '5566778899', accountType: 'checking', transferType: 'wire', category: 'business', avatarColor: '#1D4ED8', lastPaidAmount: 8750,  lastPaidDate: new Date('2024-11-28'), totalTransfers: 5 },
    { userId: user._id, nickname: 'City Utilities',   fullName: 'City Utility Services Corp',  bankName: 'U.S. Bank',         routingNumber: '091000022', accountNumber: '3344556677', accountType: 'checking', transferType: 'ach',  category: 'utility',  avatarColor: '#059669', lastPaidAmount: 185,   lastPaidDate: new Date('2025-01-05'), totalTransfers: 18 },
  ]);

  // ── Staff customers (exist in DB for staff portal; no UI login needed) ────
  const [vijaya, ramesh, greenvalley, kavya, abcvendors, nayana,
         james, emily, michael, jake, sarah, robert] = await User.create([
    { username: 'vijaya.k',    email: 'vijaya.k@example.com',    password: 'Demo@1234', fullName: 'Vijaya Krishnamurthy' },
    { username: 'ramesh.v',    email: 'ramesh.v@example.com',    password: 'Demo@1234', fullName: 'Ramesh Venkataraman' },
    { username: 'greenvalley', email: 'accounts@greenvalley.com', password: 'Demo@1234', fullName: 'Green Valley Properties LLC' },
    { username: 'kavya.t',     email: 'kavya.t@example.com',     password: 'Demo@1234', fullName: 'Kavya Indhu Thiyagarajan' },
    { username: 'abcvendors',  email: 'ops@abcvendors.com',      password: 'Demo@1234', fullName: 'ABC Vendors LLC' },
    { username: 'nayana.r',    email: 'nayana.r@example.com',    password: 'Demo@1234', fullName: 'Nayana Rajan' },
    { username: 'james.smith',   email: 'james.smith@example.com',   password: 'Demo@1234', fullName: 'James Smith' },
    { username: 'emily.johnson', email: 'emily.johnson@example.com', password: 'Demo@1234', fullName: 'Emily Johnson' },
    { username: 'michael.j',    email: 'michael.jordan@example.com', password: 'Demo@1234', fullName: 'Michael Jordan' },
    { username: 'jake.williams', email: 'jake.williams@example.com', password: 'Demo@1234', fullName: 'Jake Williams' },
    { username: 'sarah.davis',   email: 'sarah.davis@example.com',   password: 'Demo@1234', fullName: 'Sarah Davis' },
    { username: 'robert.brown',  email: 'robert.brown@example.com',  password: 'Demo@1234', fullName: 'Robert Brown' },
  ]);

  // ── Cards for staff customers ─────────────────────────────────────────────
  await Card.create([
    // Vijaya — active debit, disputed credit
    { userId: vijaya._id, customerDisplayId: 'CUST-001', customerName: 'Vijaya Krishnamurthy',
      cardType: 'debit',  network: 'Visa',       maskedNumber: '****1230', cardholderName: 'VIJAYA KRISHNAMURTHY',
      expiryDate: '08/27', currentBalance: 24500, status: 'active',   disputes: 0 },
    { userId: vijaya._id, customerDisplayId: 'CUST-001', customerName: 'Vijaya Krishnamurthy',
      cardType: 'credit', network: 'Visa',       maskedNumber: '****4421', cardholderName: 'VIJAYA KRISHNAMURTHY',
      expiryDate: '06/26', creditLimit: 20000, currentBalance: 4800, availableCredit: 15200,
      minimumPayment: 96, status: 'disputed', disputes: 2 },

    // Ramesh — active debit
    { userId: ramesh._id, customerDisplayId: 'CUST-002', customerName: 'Ramesh Venkataraman',
      cardType: 'debit',  network: 'Mastercard', maskedNumber: '****9210', cardholderName: 'RAMESH VENKATARAMAN',
      expiryDate: '03/28', currentBalance: 12400, status: 'active', disputes: 0 },

    // Green Valley — active debit, expiring credit
    { userId: greenvalley._id, customerDisplayId: 'CUST-003', customerName: 'Green Valley Properties LLC',
      cardType: 'debit',  network: 'Visa',       maskedNumber: '****2211', cardholderName: 'GREEN VALLEY PROPERTIES',
      expiryDate: '11/27', currentBalance: 320000, status: 'active', disputes: 0 },
    { userId: greenvalley._id, customerDisplayId: 'CUST-003', customerName: 'Green Valley Properties LLC',
      cardType: 'credit', network: 'Mastercard', maskedNumber: '****6670', cardholderName: 'GREEN VALLEY PROPERTIES',
      expiryDate: '06/26', creditLimit: 50000, currentBalance: 12000, availableCredit: 38000,
      minimumPayment: 240, status: 'expiring', disputes: 0 },

    // Kavya — active debit
    { userId: kavya._id, customerDisplayId: 'CUST-004', customerName: 'Kavya Indhu Thiyagarajan',
      cardType: 'debit',  network: 'Visa',       maskedNumber: '****7712', cardholderName: 'KAVYA INDHU THIYAGARAJAN',
      expiryDate: '11/28', currentBalance: 8900, status: 'active', disputes: 0 },

    // ABC Vendors — frozen debit
    { userId: abcvendors._id, customerDisplayId: 'CUST-005', customerName: 'ABC Vendors LLC',
      cardType: 'debit',  network: 'Mastercard', maskedNumber: '****9012', cardholderName: 'ABC VENDORS LLC',
      expiryDate: '05/27', currentBalance: 0, status: 'frozen', disputes: 1 },

    // Nayana — active debit, expiring credit
    { userId: nayana._id, customerDisplayId: 'CUST-006', customerName: 'Nayana Rajan',
      cardType: 'debit',  network: 'Visa',       maskedNumber: '****5541', cardholderName: 'NAYANA RAJAN',
      expiryDate: '11/27', currentBalance: 31000, status: 'active', disputes: 0 },
    { userId: nayana._id, customerDisplayId: 'CUST-006', customerName: 'Nayana Rajan',
      cardType: 'credit', network: 'Mastercard', maskedNumber: '****8834', cardholderName: 'NAYANA RAJAN',
      expiryDate: '05/26', creditLimit: 10000, currentBalance: 2100, availableCredit: 7900,
      minimumPayment: 42, status: 'expiring', disputes: 0 },

    // James Smith — active debit + credit
    { userId: james._id, customerDisplayId: 'CUST-007', customerName: 'James Smith',
      cardType: 'debit',  network: 'Visa',       maskedNumber: '****3301', cardholderName: 'JAMES SMITH',
      expiryDate: '07/28', currentBalance: 18500, status: 'active', disputes: 0 },
    { userId: james._id, customerDisplayId: 'CUST-007', customerName: 'James Smith',
      cardType: 'credit', network: 'Mastercard', maskedNumber: '****7742', cardholderName: 'JAMES SMITH',
      expiryDate: '09/27', creditLimit: 25000, currentBalance: 6800, availableCredit: 18200,
      minimumPayment: 136, status: 'active', disputes: 0 },

    // Emily Johnson — active debit, disputed credit
    { userId: emily._id, customerDisplayId: 'CUST-008', customerName: 'Emily Johnson',
      cardType: 'debit',  network: 'Visa',       maskedNumber: '****4412', cardholderName: 'EMILY JOHNSON',
      expiryDate: '02/28', currentBalance: 9200, status: 'active', disputes: 0 },
    { userId: emily._id, customerDisplayId: 'CUST-008', customerName: 'Emily Johnson',
      cardType: 'credit', network: 'Visa',       maskedNumber: '****6623', cardholderName: 'EMILY JOHNSON',
      expiryDate: '04/26', creditLimit: 12000, currentBalance: 3100, availableCredit: 8900,
      minimumPayment: 62, status: 'disputed', disputes: 1 },

    // Michael Jordan — active debit + credit
    { userId: michael._id, customerDisplayId: 'CUST-009', customerName: 'Michael Jordan',
      cardType: 'debit',  network: 'Mastercard', maskedNumber: '****8810', cardholderName: 'MICHAEL JORDAN',
      expiryDate: '12/27', currentBalance: 42000, status: 'active', disputes: 0 },
    { userId: michael._id, customerDisplayId: 'CUST-009', customerName: 'Michael Jordan',
      cardType: 'credit', network: 'Visa',       maskedNumber: '****5530', cardholderName: 'MICHAEL JORDAN',
      expiryDate: '08/28', creditLimit: 50000, currentBalance: 11200, availableCredit: 38800,
      minimumPayment: 224, status: 'active', disputes: 0 },

    // Jake Williams — frozen debit
    { userId: jake._id, customerDisplayId: 'CUST-010', customerName: 'Jake Williams',
      cardType: 'debit',  network: 'Visa',       maskedNumber: '****2209', cardholderName: 'JAKE WILLIAMS',
      expiryDate: '06/27', currentBalance: 0, status: 'frozen', disputes: 1 },

    // Sarah Davis — active debit, expiring credit
    { userId: sarah._id, customerDisplayId: 'CUST-011', customerName: 'Sarah Davis',
      cardType: 'debit',  network: 'Mastercard', maskedNumber: '****9921', cardholderName: 'SARAH DAVIS',
      expiryDate: '03/28', currentBalance: 14700, status: 'active', disputes: 0 },
    { userId: sarah._id, customerDisplayId: 'CUST-011', customerName: 'Sarah Davis',
      cardType: 'credit', network: 'Visa',       maskedNumber: '****1144', cardholderName: 'SARAH DAVIS',
      expiryDate: '06/26', creditLimit: 15000, currentBalance: 4200, availableCredit: 10800,
      minimumPayment: 84, status: 'expiring', disputes: 0 },

    // Robert Brown — active debit
    { userId: robert._id, customerDisplayId: 'CUST-012', customerName: 'Robert Brown',
      cardType: 'debit',  network: 'Visa',       maskedNumber: '****6678', cardholderName: 'ROBERT BROWN',
      expiryDate: '10/28', currentBalance: 27300, status: 'active', disputes: 0 },
  ]);

  // ── Ledger entries for Jan–Apr 2026 ──────────────────────────────────────
  // Helper to build an entry
  let refSeq = 1;
  const ref = (prefix: string) => `${prefix}-${String(refSeq++).padStart(5, '0')}`;

  type EntryInput = {
    userId: unknown;
    displayId: string;
    name: string;
    accountNo: string;
    accountType: 'checking' | 'savings' | 'rd';
    date: Date;
    entryType: 'credit' | 'debit';
    category: string;
    description: string;
    amount: number;
    balance: number;
  };

  const entries: EntryInput[] = [

    // ── VIJAYA KRISHNAMURTHY (CUST-001) ─────────────────────────────
    // Checking ****1230
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,1,5),  entryType: 'credit', category: 'payroll',          description: 'Salary Credit – Jan 2026',           amount: 8500,  balance: 21000 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,1,10), entryType: 'debit',  category: 'utility_payment',  description: 'Electricity Bill – PG&E',            amount: 185,   balance: 20815 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,1,15), entryType: 'debit',  category: 'loan_payment',     description: 'Home Loan EMI – Jan',                amount: 2270,  balance: 18545 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,1,20), entryType: 'debit',  category: 'ach_transfer',     description: 'ACH Transfer – Metro Rent',          amount: 2200,  balance: 16345 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,2,5),  entryType: 'credit', category: 'payroll',          description: 'Salary Credit – Feb 2026',           amount: 8500,  balance: 24845 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,2,12), entryType: 'debit',  category: 'card_payment',     description: 'Credit Card Payment – Visa ****4421', amount: 1200, balance: 23645 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,2,15), entryType: 'debit',  category: 'loan_payment',     description: 'Home Loan EMI – Feb',                amount: 2270,  balance: 21375 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,3,5),  entryType: 'credit', category: 'payroll',          description: 'Salary Credit – Mar 2026',           amount: 8500,  balance: 29875 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,3,10), entryType: 'debit',  category: 'utility_payment',  description: 'Water & Sewage Bill',                amount: 92,    balance: 29783 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,3,15), entryType: 'debit',  category: 'loan_payment',     description: 'Home Loan EMI – Mar',                amount: 2270,  balance: 27513 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,3,22), entryType: 'debit',  category: 'wire_transfer',    description: 'Wire Transfer – Tech Solutions',     amount: 8750,  balance: 18763 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,4,5),  entryType: 'credit', category: 'payroll',          description: 'Salary Credit – Apr 2026',           amount: 8500,  balance: 27263 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,4,10), entryType: 'debit',  category: 'utility_payment',  description: 'Internet & Cable – Comcast',         amount: 128,   balance: 27135 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,4,15), entryType: 'debit',  category: 'loan_payment',     description: 'Home Loan EMI – Apr',                amount: 2270,  balance: 24865 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****1230', accountType: 'checking', date: d(2026,4,28), entryType: 'debit',  category: 'ach_transfer',     description: 'ACH Transfer – City Utilities',      amount: 365,   balance: 24500 },
    // Savings ****4421
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****4421', accountType: 'savings',  date: d(2026,1,31), entryType: 'credit', category: 'interest_credit',  description: 'Monthly Interest Credit – Jan',      amount: 330,   balance: 84330 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****4421', accountType: 'savings',  date: d(2026,2,10), entryType: 'credit', category: 'deposit',          description: 'Savings Transfer from Checking',    amount: 2000,  balance: 86330 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****4421', accountType: 'savings',  date: d(2026,2,28), entryType: 'credit', category: 'interest_credit',  description: 'Monthly Interest Credit – Feb',      amount: 322,   balance: 86652 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****4421', accountType: 'savings',  date: d(2026,3,31), entryType: 'credit', category: 'interest_credit',  description: 'Monthly Interest Credit – Mar',      amount: 325,   balance: 86977 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****4421', accountType: 'savings',  date: d(2026,4,15), entryType: 'debit',  category: 'withdrawal',       description: 'Fund Transfer to Checking',          amount: 500,   balance: 86477 },
    { userId: vijaya._id, displayId: 'CUST-001', name: 'Vijaya Krishnamurthy', accountNo: '****4421', accountType: 'savings',  date: d(2026,4,30), entryType: 'credit', category: 'interest_credit',  description: 'Monthly Interest Credit – Apr',      amount: 324,   balance: 88000 },

    // ── RAMESH VENKATARAMAN (CUST-002) ──────────────────────────────
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,1,3),  entryType: 'credit', category: 'payroll',          description: 'Salary Credit – Jan 2026',           amount: 6200,  balance: 11200 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,1,8),  entryType: 'debit',  category: 'utility_payment',  description: 'Gas & Electric – Jan',               amount: 210,   balance: 10990 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,1,15), entryType: 'debit',  category: 'loan_payment',     description: 'Auto Loan EMI – Jan',                amount: 520,   balance: 10470 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,1,25), entryType: 'debit',  category: 'ach_transfer',     description: 'ACH – Insurance Premium',            amount: 340,   balance: 10130 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,2,3),  entryType: 'credit', category: 'payroll',          description: 'Salary Credit – Feb 2026',           amount: 6200,  balance: 16330 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,2,15), entryType: 'debit',  category: 'loan_payment',     description: 'Auto Loan EMI – Feb',                amount: 520,   balance: 15810 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,2,20), entryType: 'debit',  category: 'zelle',            description: 'Zelle – Daughter College Fee',       amount: 3000,  balance: 12810 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,3,3),  entryType: 'credit', category: 'payroll',          description: 'Salary Credit – Mar 2026',           amount: 6200,  balance: 19010 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,3,15), entryType: 'debit',  category: 'loan_payment',     description: 'Auto Loan EMI – Mar',                amount: 520,   balance: 18490 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,3,28), entryType: 'debit',  category: 'withdrawal',       description: 'ATM Withdrawal',                     amount: 500,   balance: 17990 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,4,3),  entryType: 'credit', category: 'payroll',          description: 'Salary Credit – Apr 2026',           amount: 6200,  balance: 24190 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,4,10), entryType: 'debit',  category: 'utility_payment',  description: 'Water Bill – Apr',                   amount: 88,    balance: 24102 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,4,15), entryType: 'debit',  category: 'loan_payment',     description: 'Auto Loan EMI – Apr',                amount: 520,   balance: 23582 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****9210', accountType: 'checking', date: d(2026,4,25), entryType: 'debit',  category: 'ach_transfer',     description: 'ACH – Recurring SIP Investment',     amount: 1500,  balance: 12400 },
    // RD ****3311
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****3311', accountType: 'rd',       date: d(2026,1,5),  entryType: 'credit', category: 'deposit',          description: 'RD Monthly Installment – Jan',       amount: 3000,  balance: 33000 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****3311', accountType: 'rd',       date: d(2026,2,5),  entryType: 'credit', category: 'deposit',          description: 'RD Monthly Installment – Feb',       amount: 3000,  balance: 36000 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****3311', accountType: 'rd',       date: d(2026,3,5),  entryType: 'credit', category: 'deposit',          description: 'RD Monthly Installment – Mar',       amount: 3000,  balance: 39000 },
    { userId: ramesh._id, displayId: 'CUST-002', name: 'Ramesh Venkataraman', accountNo: '****3311', accountType: 'rd',       date: d(2026,4,5),  entryType: 'credit', category: 'deposit',          description: 'RD Monthly Installment – Apr',       amount: 3000,  balance: 42000 },

    // ── GREEN VALLEY PROPERTIES LLC (CUST-003) ───────────────────────
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,1,2),  entryType: 'credit', category: 'deposit',        description: 'Tenant Rent Collection – Jan',      amount: 85000, balance: 280000 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,1,10), entryType: 'debit',  category: 'vendor_payment',  description: 'Maintenance & Repairs – Jan',       amount: 12000, balance: 268000 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,1,15), entryType: 'debit',  category: 'payroll',         description: 'Staff Payroll – Jan 2026',          amount: 28000, balance: 240000 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,1,20), entryType: 'debit',  category: 'utility_payment', description: 'Property Utilities – Jan',          amount: 4200,  balance: 235800 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,2,2),  entryType: 'credit', category: 'deposit',         description: 'Tenant Rent Collection – Feb',      amount: 87500, balance: 323300 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,2,15), entryType: 'debit',  category: 'payroll',         description: 'Staff Payroll – Feb 2026',          amount: 28000, balance: 295300 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,2,18), entryType: 'debit',  category: 'vendor_payment',  description: 'Contractor Payment – Renovation',  amount: 35000, balance: 260300 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,3,2),  entryType: 'credit', category: 'deposit',         description: 'Tenant Rent Collection – Mar',      amount: 87500, balance: 347800 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,3,15), entryType: 'debit',  category: 'payroll',         description: 'Staff Payroll – Mar 2026',          amount: 28000, balance: 319800 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,3,25), entryType: 'debit',  category: 'wire_transfer',   description: 'Wire – Property Acquisition Down',  amount: 50000, balance: 269800 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,4,2),  entryType: 'credit', category: 'deposit',         description: 'Tenant Rent Collection – Apr',      amount: 90000, balance: 359800 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,4,10), entryType: 'debit',  category: 'vendor_payment',  description: 'Landscape & Groundskeeping – Apr',  amount: 6800,  balance: 353000 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,4,15), entryType: 'debit',  category: 'payroll',         description: 'Staff Payroll – Apr 2026',          amount: 28000, balance: 325000 },
    { userId: greenvalley._id, displayId: 'CUST-003', name: 'Green Valley Properties LLC', accountNo: '****2211', accountType: 'checking', date: d(2026,4,28), entryType: 'debit',  category: 'utility_payment', description: 'Property Utilities – Apr',          amount: 5000,  balance: 320000 },

    // ── KAVYA INDHU THIYAGARAJAN (CUST-004) ─────────────────────────
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****7712', accountType: 'checking', date: d(2026,1,5),  entryType: 'credit', category: 'payroll',        description: 'Salary Credit – Jan 2026',        amount: 5800, balance: 9800 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****7712', accountType: 'checking', date: d(2026,1,12), entryType: 'debit',  category: 'ach_transfer',   description: 'ACH – Rent Payment Jan',          amount: 1600, balance: 8200 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****7712', accountType: 'checking', date: d(2026,1,18), entryType: 'debit',  category: 'utility_payment', description: 'Electricity Bill – Jan',          amount: 145, balance: 8055 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****7712', accountType: 'checking', date: d(2026,2,5),  entryType: 'credit', category: 'payroll',        description: 'Salary Credit – Feb 2026',        amount: 5800, balance: 13855 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****7712', accountType: 'checking', date: d(2026,2,12), entryType: 'debit',  category: 'ach_transfer',   description: 'ACH – Rent Payment Feb',          amount: 1600, balance: 12255 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****7712', accountType: 'checking', date: d(2026,2,22), entryType: 'debit',  category: 'zelle',          description: 'Zelle – Online Shopping Refund',  amount: 280, balance: 11975 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****7712', accountType: 'checking', date: d(2026,3,5),  entryType: 'credit', category: 'payroll',        description: 'Salary Credit – Mar 2026',        amount: 5800, balance: 17775 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****7712', accountType: 'checking', date: d(2026,3,12), entryType: 'debit',  category: 'ach_transfer',   description: 'ACH – Rent Payment Mar',          amount: 1600, balance: 16175 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****7712', accountType: 'checking', date: d(2026,3,20), entryType: 'debit',  category: 'card_payment',   description: 'Credit Card Payment – Amazon',    amount: 650, balance: 15525 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****7712', accountType: 'checking', date: d(2026,4,5),  entryType: 'credit', category: 'payroll',        description: 'Salary Credit – Apr 2026',        amount: 5800, balance: 21325 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****7712', accountType: 'checking', date: d(2026,4,12), entryType: 'debit',  category: 'ach_transfer',   description: 'ACH – Rent Payment Apr',          amount: 1600, balance: 19725 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****7712', accountType: 'checking', date: d(2026,4,20), entryType: 'debit',  category: 'withdrawal',     description: 'ATM Withdrawal – Apr',            amount: 400, balance: 8900 },
    // Savings ****8823
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****8823', accountType: 'savings',  date: d(2026,1,28), entryType: 'credit', category: 'deposit',        description: 'Transfer from Checking',          amount: 1000, balance: 19000 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****8823', accountType: 'savings',  date: d(2026,2,28), entryType: 'credit', category: 'interest_credit', description: 'Interest Credit – Feb',           amount: 71,  balance: 19071 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****8823', accountType: 'savings',  date: d(2026,3,28), entryType: 'credit', category: 'deposit',        description: 'Transfer from Checking',          amount: 1000, balance: 20071 },
    { userId: kavya._id, displayId: 'CUST-004', name: 'Kavya Indhu Thiyagarajan', accountNo: '****8823', accountType: 'savings',  date: d(2026,4,28), entryType: 'credit', category: 'interest_credit', description: 'Interest Credit – Apr',           amount: 76,  balance: 22000 },

    // ── ABC VENDORS LLC (CUST-005) — minimal (account frozen Feb 2026) ─
    { userId: abcvendors._id, displayId: 'CUST-005', name: 'ABC Vendors LLC', accountNo: '****9012', accountType: 'checking', date: d(2026,1,5),  entryType: 'credit', category: 'deposit',       description: 'Customer Payment – Invoice #881',  amount: 18000, balance: 18000 },
    { userId: abcvendors._id, displayId: 'CUST-005', name: 'ABC Vendors LLC', accountNo: '****9012', accountType: 'checking', date: d(2026,1,15), entryType: 'debit',  category: 'vendor_payment', description: 'Supplier Payment – Jan',           amount: 12000, balance: 6000 },
    { userId: abcvendors._id, displayId: 'CUST-005', name: 'ABC Vendors LLC', accountNo: '****9012', accountType: 'checking', date: d(2026,1,28), entryType: 'debit',  category: 'payroll',        description: 'Staff Payroll – Jan',              amount: 6000,  balance: 0 },
    { userId: abcvendors._id, displayId: 'CUST-005', name: 'ABC Vendors LLC', accountNo: '****9012', accountType: 'checking', date: d(2026,2,1),  entryType: 'debit',  category: 'fee',            description: 'Account Freeze – Regulatory Hold', amount: 0,     balance: 0 },

    // ── NAYANA RAJAN (CUST-006) ──────────────────────────────────────
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,1,5),  entryType: 'credit', category: 'payroll',          description: 'Salary Credit – Jan 2026',        amount: 7200, balance: 22200 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,1,10), entryType: 'debit',  category: 'ach_transfer',     description: 'ACH – Rent Payment Jan',          amount: 1800, balance: 20400 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,1,15), entryType: 'debit',  category: 'loan_payment',     description: 'Personal Loan EMI – Jan',         amount: 890,  balance: 19510 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,1,20), entryType: 'debit',  category: 'utility_payment',  description: 'Electricity & Gas – Jan',         amount: 220,  balance: 19290 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,2,5),  entryType: 'credit', category: 'payroll',          description: 'Salary Credit – Feb 2026',        amount: 7200, balance: 26490 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,2,10), entryType: 'debit',  category: 'ach_transfer',     description: 'ACH – Rent Payment Feb',          amount: 1800, balance: 24690 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,2,15), entryType: 'debit',  category: 'loan_payment',     description: 'Personal Loan EMI – Feb',         amount: 890,  balance: 23800 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,2,25), entryType: 'credit', category: 'deposit',          description: 'Bonus Credit – Performance',      amount: 2500, balance: 26300 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,3,5),  entryType: 'credit', category: 'payroll',          description: 'Salary Credit – Mar 2026',        amount: 7200, balance: 33500 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,3,10), entryType: 'debit',  category: 'ach_transfer',     description: 'ACH – Rent Payment Mar',          amount: 1800, balance: 31700 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,3,15), entryType: 'debit',  category: 'loan_payment',     description: 'Personal Loan EMI – Mar',         amount: 890,  balance: 30810 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,3,22), entryType: 'debit',  category: 'wire_transfer',    description: 'Wire – Family Remittance',        amount: 3000, balance: 27810 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,4,5),  entryType: 'credit', category: 'payroll',          description: 'Salary Credit – Apr 2026',        amount: 7200, balance: 35010 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,4,10), entryType: 'debit',  category: 'ach_transfer',     description: 'ACH – Rent Payment Apr',          amount: 1800, balance: 33210 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,4,15), entryType: 'debit',  category: 'loan_payment',     description: 'Personal Loan EMI – Apr',         amount: 890,  balance: 32320 },
    { userId: nayana._id, displayId: 'CUST-006', name: 'Nayana Rajan', accountNo: '****5541', accountType: 'checking', date: d(2026,4,25), entryType: 'debit',  category: 'utility_payment',  description: 'Internet & Mobile Bill – Apr',    amount: 320,  balance: 31000 },

    // ── JAMES SMITH (CUST-007) ───────────────────────────────────────
    { userId: james._id, displayId: 'CUST-007', name: 'James Smith', accountNo: '****3301', accountType: 'checking', date: d(2026,1,5),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Jan 2026',        amount: 9500,  balance: 14500 },
    { userId: james._id, displayId: 'CUST-007', name: 'James Smith', accountNo: '****3301', accountType: 'checking', date: d(2026,1,12), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Mortgage Payment Jan',      amount: 2800,  balance: 11700 },
    { userId: james._id, displayId: 'CUST-007', name: 'James Smith', accountNo: '****3301', accountType: 'checking', date: d(2026,1,18), entryType: 'debit',  category: 'utility_payment', description: 'Electric & Gas – Jan',            amount: 245,   balance: 11455 },
    { userId: james._id, displayId: 'CUST-007', name: 'James Smith', accountNo: '****3301', accountType: 'checking', date: d(2026,2,5),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Feb 2026',        amount: 9500,  balance: 20955 },
    { userId: james._id, displayId: 'CUST-007', name: 'James Smith', accountNo: '****3301', accountType: 'checking', date: d(2026,2,12), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Mortgage Payment Feb',      amount: 2800,  balance: 18155 },
    { userId: james._id, displayId: 'CUST-007', name: 'James Smith', accountNo: '****3301', accountType: 'checking', date: d(2026,2,20), entryType: 'debit',  category: 'card_payment',    description: 'Credit Card Payment – Feb',       amount: 1500,  balance: 16655 },
    { userId: james._id, displayId: 'CUST-007', name: 'James Smith', accountNo: '****3301', accountType: 'checking', date: d(2026,3,5),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Mar 2026',        amount: 9500,  balance: 26155 },
    { userId: james._id, displayId: 'CUST-007', name: 'James Smith', accountNo: '****3301', accountType: 'checking', date: d(2026,3,12), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Mortgage Payment Mar',      amount: 2800,  balance: 23355 },
    { userId: james._id, displayId: 'CUST-007', name: 'James Smith', accountNo: '****3301', accountType: 'checking', date: d(2026,3,22), entryType: 'debit',  category: 'wire_transfer',   description: 'Wire – Business Investment',      amount: 5000,  balance: 18355 },
    { userId: james._id, displayId: 'CUST-007', name: 'James Smith', accountNo: '****3301', accountType: 'checking', date: d(2026,4,5),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Apr 2026',        amount: 9500,  balance: 27855 },
    { userId: james._id, displayId: 'CUST-007', name: 'James Smith', accountNo: '****3301', accountType: 'checking', date: d(2026,4,12), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Mortgage Payment Apr',      amount: 2800,  balance: 25055 },
    { userId: james._id, displayId: 'CUST-007', name: 'James Smith', accountNo: '****3301', accountType: 'checking', date: d(2026,4,25), entryType: 'debit',  category: 'withdrawal',      description: 'ATM Withdrawal – Apr',            amount: 600,   balance: 18500 },

    // ── EMILY JOHNSON (CUST-008) ─────────────────────────────────────
    { userId: emily._id, displayId: 'CUST-008', name: 'Emily Johnson', accountNo: '****4412', accountType: 'checking', date: d(2026,1,3),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Jan 2026',        amount: 6800,  balance: 8800 },
    { userId: emily._id, displayId: 'CUST-008', name: 'Emily Johnson', accountNo: '****4412', accountType: 'checking', date: d(2026,1,10), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Rent Payment Jan',          amount: 1900,  balance: 6900 },
    { userId: emily._id, displayId: 'CUST-008', name: 'Emily Johnson', accountNo: '****4412', accountType: 'checking', date: d(2026,1,20), entryType: 'debit',  category: 'utility_payment', description: 'Internet & Cable – Jan',          amount: 145,   balance: 6755 },
    { userId: emily._id, displayId: 'CUST-008', name: 'Emily Johnson', accountNo: '****4412', accountType: 'checking', date: d(2026,2,3),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Feb 2026',        amount: 6800,  balance: 13555 },
    { userId: emily._id, displayId: 'CUST-008', name: 'Emily Johnson', accountNo: '****4412', accountType: 'checking', date: d(2026,2,10), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Rent Payment Feb',          amount: 1900,  balance: 11655 },
    { userId: emily._id, displayId: 'CUST-008', name: 'Emily Johnson', accountNo: '****4412', accountType: 'checking', date: d(2026,2,18), entryType: 'debit',  category: 'zelle',           description: 'Zelle – Split Dinner with Friends', amount: 85,  balance: 11570 },
    { userId: emily._id, displayId: 'CUST-008', name: 'Emily Johnson', accountNo: '****4412', accountType: 'checking', date: d(2026,3,3),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Mar 2026',        amount: 6800,  balance: 18370 },
    { userId: emily._id, displayId: 'CUST-008', name: 'Emily Johnson', accountNo: '****4412', accountType: 'checking', date: d(2026,3,10), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Rent Payment Mar',          amount: 1900,  balance: 16470 },
    { userId: emily._id, displayId: 'CUST-008', name: 'Emily Johnson', accountNo: '****4412', accountType: 'checking', date: d(2026,3,25), entryType: 'debit',  category: 'card_payment',    description: 'Credit Card Dispute Charge',      amount: 320,   balance: 16150 },
    { userId: emily._id, displayId: 'CUST-008', name: 'Emily Johnson', accountNo: '****4412', accountType: 'checking', date: d(2026,4,3),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Apr 2026',        amount: 6800,  balance: 22950 },
    { userId: emily._id, displayId: 'CUST-008', name: 'Emily Johnson', accountNo: '****4412', accountType: 'checking', date: d(2026,4,10), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Rent Payment Apr',          amount: 1900,  balance: 21050 },
    { userId: emily._id, displayId: 'CUST-008', name: 'Emily Johnson', accountNo: '****4412', accountType: 'checking', date: d(2026,4,22), entryType: 'debit',  category: 'withdrawal',      description: 'ATM Withdrawal – Apr',            amount: 300,   balance: 9200 },

    // ── MICHAEL JORDAN (CUST-009) ────────────────────────────────────
    { userId: michael._id, displayId: 'CUST-009', name: 'Michael Jordan', accountNo: '****8810', accountType: 'checking', date: d(2026,1,5),  entryType: 'credit', category: 'payroll',        description: 'Salary Credit – Jan 2026',        amount: 14000, balance: 35000 },
    { userId: michael._id, displayId: 'CUST-009', name: 'Michael Jordan', accountNo: '****8810', accountType: 'checking', date: d(2026,1,10), entryType: 'debit',  category: 'ach_transfer',   description: 'ACH – Mortgage Payment Jan',      amount: 4200,  balance: 30800 },
    { userId: michael._id, displayId: 'CUST-009', name: 'Michael Jordan', accountNo: '****8810', accountType: 'checking', date: d(2026,1,18), entryType: 'debit',  category: 'wire_transfer',  description: 'Wire – Sports Foundation Donation', amount: 5000, balance: 25800 },
    { userId: michael._id, displayId: 'CUST-009', name: 'Michael Jordan', accountNo: '****8810', accountType: 'checking', date: d(2026,2,5),  entryType: 'credit', category: 'payroll',        description: 'Salary Credit – Feb 2026',        amount: 14000, balance: 39800 },
    { userId: michael._id, displayId: 'CUST-009', name: 'Michael Jordan', accountNo: '****8810', accountType: 'checking', date: d(2026,2,10), entryType: 'debit',  category: 'ach_transfer',   description: 'ACH – Mortgage Payment Feb',      amount: 4200,  balance: 35600 },
    { userId: michael._id, displayId: 'CUST-009', name: 'Michael Jordan', accountNo: '****8810', accountType: 'checking', date: d(2026,3,5),  entryType: 'credit', category: 'payroll',        description: 'Salary Credit – Mar 2026',        amount: 14000, balance: 49600 },
    { userId: michael._id, displayId: 'CUST-009', name: 'Michael Jordan', accountNo: '****8810', accountType: 'checking', date: d(2026,3,10), entryType: 'debit',  category: 'ach_transfer',   description: 'ACH – Mortgage Payment Mar',      amount: 4200,  balance: 45400 },
    { userId: michael._id, displayId: 'CUST-009', name: 'Michael Jordan', accountNo: '****8810', accountType: 'checking', date: d(2026,3,20), entryType: 'debit',  category: 'vendor_payment', description: 'Vendor – Event Management Co.',   amount: 8000,  balance: 37400 },
    { userId: michael._id, displayId: 'CUST-009', name: 'Michael Jordan', accountNo: '****8810', accountType: 'checking', date: d(2026,4,5),  entryType: 'credit', category: 'payroll',        description: 'Salary Credit – Apr 2026',        amount: 14000, balance: 51400 },
    { userId: michael._id, displayId: 'CUST-009', name: 'Michael Jordan', accountNo: '****8810', accountType: 'checking', date: d(2026,4,10), entryType: 'debit',  category: 'ach_transfer',   description: 'ACH – Mortgage Payment Apr',      amount: 4200,  balance: 47200 },
    { userId: michael._id, displayId: 'CUST-009', name: 'Michael Jordan', accountNo: '****8810', accountType: 'checking', date: d(2026,4,28), entryType: 'debit',  category: 'card_payment',   description: 'Credit Card Payment – Apr',       amount: 5200,  balance: 42000 },

    // ── JAKE WILLIAMS (CUST-010) — minimal (account frozen Mar 2026) ──
    { userId: jake._id, displayId: 'CUST-010', name: 'Jake Williams', accountNo: '****2209', accountType: 'checking', date: d(2026,1,5),  entryType: 'credit', category: 'deposit',        description: 'Initial Deposit',                 amount: 5000,  balance: 5000 },
    { userId: jake._id, displayId: 'CUST-010', name: 'Jake Williams', accountNo: '****2209', accountType: 'checking', date: d(2026,2,3),  entryType: 'credit', category: 'payroll',        description: 'Salary Credit – Feb 2026',        amount: 4500,  balance: 9500 },
    { userId: jake._id, displayId: 'CUST-010', name: 'Jake Williams', accountNo: '****2209', accountType: 'checking', date: d(2026,2,20), entryType: 'debit',  category: 'withdrawal',     description: 'ATM Withdrawal',                  amount: 9500,  balance: 0 },
    { userId: jake._id, displayId: 'CUST-010', name: 'Jake Williams', accountNo: '****2209', accountType: 'checking', date: d(2026,3,1),  entryType: 'debit',  category: 'fee',            description: 'Account Freeze – Fraud Hold',     amount: 0,     balance: 0 },

    // ── SARAH DAVIS (CUST-011) ───────────────────────────────────────
    { userId: sarah._id, displayId: 'CUST-011', name: 'Sarah Davis', accountNo: '****9921', accountType: 'checking', date: d(2026,1,5),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Jan 2026',        amount: 7500,  balance: 11500 },
    { userId: sarah._id, displayId: 'CUST-011', name: 'Sarah Davis', accountNo: '****9921', accountType: 'checking', date: d(2026,1,10), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Rent Payment Jan',          amount: 1750,  balance: 9750 },
    { userId: sarah._id, displayId: 'CUST-011', name: 'Sarah Davis', accountNo: '****9921', accountType: 'checking', date: d(2026,1,22), entryType: 'debit',  category: 'loan_payment',    description: 'Car Loan EMI – Jan',              amount: 650,   balance: 9100 },
    { userId: sarah._id, displayId: 'CUST-011', name: 'Sarah Davis', accountNo: '****9921', accountType: 'checking', date: d(2026,2,5),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Feb 2026',        amount: 7500,  balance: 16600 },
    { userId: sarah._id, displayId: 'CUST-011', name: 'Sarah Davis', accountNo: '****9921', accountType: 'checking', date: d(2026,2,10), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Rent Payment Feb',          amount: 1750,  balance: 14850 },
    { userId: sarah._id, displayId: 'CUST-011', name: 'Sarah Davis', accountNo: '****9921', accountType: 'checking', date: d(2026,2,22), entryType: 'debit',  category: 'loan_payment',    description: 'Car Loan EMI – Feb',              amount: 650,   balance: 14200 },
    { userId: sarah._id, displayId: 'CUST-011', name: 'Sarah Davis', accountNo: '****9921', accountType: 'checking', date: d(2026,3,5),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Mar 2026',        amount: 7500,  balance: 21700 },
    { userId: sarah._id, displayId: 'CUST-011', name: 'Sarah Davis', accountNo: '****9921', accountType: 'checking', date: d(2026,3,10), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Rent Payment Mar',          amount: 1750,  balance: 19950 },
    { userId: sarah._id, displayId: 'CUST-011', name: 'Sarah Davis', accountNo: '****9921', accountType: 'checking', date: d(2026,3,18), entryType: 'debit',  category: 'zelle',           description: 'Zelle – School Fundraiser',       amount: 200,   balance: 19750 },
    { userId: sarah._id, displayId: 'CUST-011', name: 'Sarah Davis', accountNo: '****9921', accountType: 'checking', date: d(2026,4,5),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Apr 2026',        amount: 7500,  balance: 27250 },
    { userId: sarah._id, displayId: 'CUST-011', name: 'Sarah Davis', accountNo: '****9921', accountType: 'checking', date: d(2026,4,10), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Rent Payment Apr',          amount: 1750,  balance: 25500 },
    { userId: sarah._id, displayId: 'CUST-011', name: 'Sarah Davis', accountNo: '****9921', accountType: 'checking', date: d(2026,4,22), entryType: 'debit',  category: 'loan_payment',    description: 'Car Loan EMI – Apr',              amount: 650,   balance: 14700 },

    // ── ROBERT BROWN (CUST-012) ──────────────────────────────────────
    { userId: robert._id, displayId: 'CUST-012', name: 'Robert Brown', accountNo: '****6678', accountType: 'checking', date: d(2026,1,5),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Jan 2026',        amount: 11000, balance: 18000 },
    { userId: robert._id, displayId: 'CUST-012', name: 'Robert Brown', accountNo: '****6678', accountType: 'checking', date: d(2026,1,12), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Mortgage Payment Jan',      amount: 3100,  balance: 14900 },
    { userId: robert._id, displayId: 'CUST-012', name: 'Robert Brown', accountNo: '****6678', accountType: 'checking', date: d(2026,1,20), entryType: 'debit',  category: 'utility_payment', description: 'Utilities – Water & Electric',    amount: 310,   balance: 14590 },
    { userId: robert._id, displayId: 'CUST-012', name: 'Robert Brown', accountNo: '****6678', accountType: 'checking', date: d(2026,2,5),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Feb 2026',        amount: 11000, balance: 25590 },
    { userId: robert._id, displayId: 'CUST-012', name: 'Robert Brown', accountNo: '****6678', accountType: 'checking', date: d(2026,2,12), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Mortgage Payment Feb',      amount: 3100,  balance: 22490 },
    { userId: robert._id, displayId: 'CUST-012', name: 'Robert Brown', accountNo: '****6678', accountType: 'checking', date: d(2026,2,22), entryType: 'debit',  category: 'wire_transfer',   description: 'Wire – Investment Transfer',      amount: 4000,  balance: 18490 },
    { userId: robert._id, displayId: 'CUST-012', name: 'Robert Brown', accountNo: '****6678', accountType: 'checking', date: d(2026,3,5),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Mar 2026',        amount: 11000, balance: 29490 },
    { userId: robert._id, displayId: 'CUST-012', name: 'Robert Brown', accountNo: '****6678', accountType: 'checking', date: d(2026,3,12), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Mortgage Payment Mar',      amount: 3100,  balance: 26390 },
    { userId: robert._id, displayId: 'CUST-012', name: 'Robert Brown', accountNo: '****6678', accountType: 'checking', date: d(2026,3,28), entryType: 'debit',  category: 'withdrawal',      description: 'ATM Withdrawal – Mar',            amount: 800,   balance: 25590 },
    { userId: robert._id, displayId: 'CUST-012', name: 'Robert Brown', accountNo: '****6678', accountType: 'checking', date: d(2026,4,5),  entryType: 'credit', category: 'payroll',         description: 'Salary Credit – Apr 2026',        amount: 11000, balance: 36590 },
    { userId: robert._id, displayId: 'CUST-012', name: 'Robert Brown', accountNo: '****6678', accountType: 'checking', date: d(2026,4,12), entryType: 'debit',  category: 'ach_transfer',    description: 'ACH – Mortgage Payment Apr',      amount: 3100,  balance: 33490 },
    { userId: robert._id, displayId: 'CUST-012', name: 'Robert Brown', accountNo: '****6678', accountType: 'checking', date: d(2026,4,25), entryType: 'debit',  category: 'card_payment',    description: 'Credit Card Payment – Apr',       amount: 6200,  balance: 27300 },
  ];

  // Insert all ledger entries with auto-generated refs
  await LedgerEntry.insertMany(entries.map(e => ({
    userId:            e.userId,
    customerDisplayId: e.displayId,
    customerName:      e.name,
    accountNo:         e.accountNo,
    accountType:       e.accountType,
    date:              e.date,
    entryType:         e.entryType,
    category:          e.category,
    description:       e.description,
    amount:            e.amount,
    runningBalance:    e.balance,
    ref:               ref(e.entryType === 'credit' ? 'CR' : 'DR'),
  })));

  console.log(`✅ Seed complete — ${entries.length} ledger entries created`);
  console.log('Demo login — username: johndoe | password: Demo@1234');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
