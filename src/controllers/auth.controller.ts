import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

function signToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
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
