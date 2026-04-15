import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Card from '../models/Card';

export async function getCards(req: AuthRequest, res: Response): Promise<void> {
  const cards = await Card.find({ userId: req.userId });
  res.json(cards);
}

export async function getCardById(req: AuthRequest, res: Response): Promise<void> {
  const card = await Card.findOne({ _id: req.params.id, userId: req.userId });
  if (!card) { res.status(404).json({ message: 'Card not found' }); return; }
  res.json(card);
}

export async function toggleCardFreeze(req: AuthRequest, res: Response): Promise<void> {
  const card = await Card.findOne({ _id: req.params.id, userId: req.userId });
  if (!card) { res.status(404).json({ message: 'Card not found' }); return; }
  card.status = card.status === 'frozen' ? 'active' : 'frozen';
  await card.save();
  res.json({ message: `Card ${card.status === 'frozen' ? 'frozen' : 'unfrozen'}`, card });
}
