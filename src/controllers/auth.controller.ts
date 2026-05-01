import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Account from '../models/Account';

function signToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

/** Create starter demo accounts for a newly registered user */
async function createDemoAccounts(userId: string): Promise<void> {
  const suffix = Math.floor(1000 + Math.random() * 9000); // random 4-digit suffix
  await Account.create([
    {
      userId,
      type: 'checking',
      accountNumber: `CHKDEMO${suffix}0001`,
      maskedNumber: `****${suffix}`,
      balance: 12450.75,
      availableBalance: 12200.75,
      nickname: 'US Bank Checking',
    },
    {
      userId,
      type: 'savings',
      accountNumber: `SAVDEMO${suffix}0002`,
      maskedNumber: `****${String(Number(suffix) + 1).padStart(4, '0')}`,
      balance: 45000.00,
      availableBalance: 45000.00,
      nickname: 'US Bank Savings',
      interestRate: 4.5,
    },
  ]);
}

export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password, fullName } = req.body;
  if (!username || !email || !password || !fullName) {
    res.status(400).json({ message: 'All fields required' });
    return;
  }
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    res.status(409).json({ message: 'Username or email already in use' });
    return;
  }
  const user = await User.create({ username, email, password, fullName });

  // Auto-provision demo accounts so the user can make payments immediately
  try { await createDemoAccounts(user._id.toString()); } catch { /* non-fatal */ }

  const token = signToken(user._id.toString());
  res.status(201).json({ token, user: { id: user._id, username: user.username, fullName: user.fullName, email: user.email } });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: 'Username and password required' });
    return;
  }
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  user.lastLogin = new Date();
  await user.save();
  const token = signToken(user._id.toString());
  res.json({ token, user: { id: user._id, username: user.username, fullName: user.fullName, email: user.email } });
}

export async function getMe(req: Request & { userId?: string }, res: Response): Promise<void> {
  const user = await User.findById(req.userId).select('-password');
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  res.json(user);
}

/** POST /api/auth/provision-accounts — one-time fix for users who registered before auto-provisioning */
export async function provisionAccounts(req: Request & { userId?: string }, res: Response): Promise<void> {
  const existing = await Account.find({ userId: req.userId });
  if (existing.length > 0) {
    res.json({ message: `Already has ${existing.length} account(s) — no action taken.` });
    return;
  }
  await createDemoAccounts(req.userId!);
  res.json({ message: 'Demo accounts created successfully. Refresh the app.' });
}
