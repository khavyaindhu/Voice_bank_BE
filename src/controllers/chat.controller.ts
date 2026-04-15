import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { chat, ChatMessage, ChatContext } from '../services/ai.service';
import ChatSession from '../models/ChatSession';

export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  const { message, screenContext, accountSummary, sessionId } = req.body;

  if (!message?.trim()) {
    res.status(400).json({ message: 'Message is required' });
    return;
  }

  const context: ChatContext = {
    screen: screenContext || 'dashboard',
    accountSummary,
  };

  let session = sessionId
    ? await ChatSession.findById(sessionId)
    : null;

  if (!session) {
    session = await ChatSession.create({ userId: req.userId, messages: [] });
  }

  session.messages.push({ role: 'user', content: message, screenContext: screenContext, timestamp: new Date() });

  const historyForAI: ChatMessage[] = session.messages
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }));

  const aiResponse = await chat(historyForAI, context);

  session.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
  session.lastActive = new Date();
  await session.save();

  res.json({
    response: aiResponse,
    sessionId: session._id,
  });
}

export async function getChatHistory(req: AuthRequest, res: Response): Promise<void> {
  const session = await ChatSession.findOne({
    _id: req.params.sessionId,
    userId: req.userId,
  });
  if (!session) { res.status(404).json({ message: 'Session not found' }); return; }
  res.json(session);
}
