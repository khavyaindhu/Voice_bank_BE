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

  try {
    const context: ChatContext = {
      screen: screenContext || 'dashboard',
      accountSummary,
    };

    let session = sessionId ? await ChatSession.findById(sessionId) : null;
    if (!session) {
      session = await ChatSession.create({ userId: req.userId, messages: [] });
    }

    session.messages.push({
      role: 'user',
      content: message,
      screenContext,
      timestamp: new Date(),
    });

    // Build clean alternating history for Gemini (max last 10 messages)
    const historyForAI: ChatMessage[] = session.messages
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    const aiResponse = await chat(historyForAI, context);

    session.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    });
    session.lastActive = new Date();
    await session.save();

    res.json({ response: aiResponse, sessionId: session._id });

  } catch (err: unknown) {
    console.error('Chat error:', err);
    const message = err instanceof Error ? err.message : 'AI service error';
    res.status(500).json({
      response: `I'm having trouble right now. Please try again. (${message})`,
      error: message,
    });
  }
}

export async function getChatHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.sessionId,
      userId: req.userId,
    });
    if (!session) { res.status(404).json({ message: 'Session not found' }); return; }
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching chat history' });
  }
}
