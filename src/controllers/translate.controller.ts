import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { translateCommandToEnglish, translateText, SUPPORTED_LANGUAGES } from '../services/translation.service';

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

export async function translateToEnglishCommand(req: AuthRequest, res: Response): Promise<void> {
  const { text, sourceLanguage } = req.body;

  console.log('[translate/to-english] request received', {
    sourceLanguage,
    textLen: text?.length,
  });

  if (!text?.trim()) {
    res.status(400).json({ message: 'text is required' });
    return;
  }

  if (!sourceLanguage || !SUPPORTED_LANGUAGES[sourceLanguage]) {
    res.status(400).json({ message: `Unsupported source language. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}` });
    return;
  }

  try {
    const englishText = await translateCommandToEnglish(text, sourceLanguage);
    console.log('[translate/to-english] success', {
      sourceLanguage,
      englishPreview: englishText.substring(0, 80),
    });
    res.json({ englishText, sourceLanguage });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Command translation failed';
    console.error('[translate/to-english] error:', msg);
    res.status(500).json({ message: msg });
  }
}
