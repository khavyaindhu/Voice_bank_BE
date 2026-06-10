import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/config
 * Returns feature flags so the FE can decide which paths to use.
 * No authentication required — these are non-sensitive capability flags.
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    features: {
      googleTts: !!process.env.GOOGLE_TTS_API_KEY,
      // Server-side TTS is always available: Google Cloud TTS when a key is
      // configured, otherwise the keyless Google Translate TTS fallback.
      serverTts: true,
    },
  });
});

export default router;
