import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { translateText, SUPPORTED_LANGUAGES } from '../services/translation.service';

export async function translate(req: AuthRequest, res: Response): Promise<void> {
  const { text, language } = req.body;

  console.log('[translate] request received', { language, textLen: text?.length });

  if (!text?.trim()) {
    res.status(400).json({ message: 'text is required' });
    return;
  }

  if (!language || !SUPPORTED_LANGUAGES[language]) {
    res.status(400).json({ message: `Unsupported language. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}` });
    return;
  }

  try {
    const translatedText = await translateText(text, language);
    console.log('[translate] success', { language, resultLen: translatedText?.length });
    res.json({ translatedText, language });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Translation failed';
    console.error('[translate] error:', msg);
    res.status(500).json({ message: msg });
  }
}
