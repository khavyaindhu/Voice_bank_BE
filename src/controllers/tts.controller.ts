import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { synthesizeSpeech, isGoogleTtsConfigured } from '../services/tts.service';

const SUPPORTED_LANG_CODES = ['en', 'hi', 'ta', 'kn', 'es'];

export async function tts(req: AuthRequest, res: Response): Promise<void> {
  const { text, langCode } = req.body;

  if (!text?.trim()) {
    res.status(400).json({ message: 'text is required' });
    return;
  }

  if (!langCode || !SUPPORTED_LANG_CODES.includes(langCode)) {
    res.status(400).json({ message: `Unsupported langCode. Supported: ${SUPPORTED_LANG_CODES.join(', ')}` });
    return;
  }

  if (!isGoogleTtsConfigured()) {
    // Return a clear signal so the FE can fallback to Web Speech API
    res.status(503).json({ message: 'Google TTS not configured — use browser fallback', fallback: true });
    return;
  }

  try {
    const result = await synthesizeSpeech(text, langCode);
    res.json({ audioContent: result.audioContent, voiceName: result.voiceName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'TTS synthesis failed';
    console.error('[tts controller] error:', msg);
    res.status(500).json({ message: msg, fallback: true });
  }
}
