// Google Cloud Text-to-Speech service
// Uses the REST API directly (no SDK) — same pattern as translation.service.ts
// Docs: https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize

// Best available voices per language code (Neural2 → WaveNet → Standard, in preference order)
const VOICE_MAP: Record<string, { languageCode: string; name: string; ssmlGender: string }[]> = {
  ta: [
    { languageCode: 'ta-IN', name: 'ta-IN-Neural2-A', ssmlGender: 'FEMALE' },
    { languageCode: 'ta-IN', name: 'ta-IN-Neural2-D', ssmlGender: 'FEMALE' },
    { languageCode: 'ta-IN', name: 'ta-IN-Wavenet-A', ssmlGender: 'FEMALE' },
    { languageCode: 'ta-IN', name: 'ta-IN-Standard-A', ssmlGender: 'FEMALE' },
  ],
  hi: [
    { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A', ssmlGender: 'FEMALE' },
    { languageCode: 'hi-IN', name: 'hi-IN-Neural2-D', ssmlGender: 'FEMALE' },
    { languageCode: 'hi-IN', name: 'hi-IN-Wavenet-A', ssmlGender: 'FEMALE' },
    { languageCode: 'hi-IN', name: 'hi-IN-Standard-A', ssmlGender: 'FEMALE' },
  ],
  kn: [
    { languageCode: 'kn-IN', name: 'kn-IN-Wavenet-A', ssmlGender: 'FEMALE' },
    { languageCode: 'kn-IN', name: 'kn-IN-Wavenet-B', ssmlGender: 'MALE' },
    { languageCode: 'kn-IN', name: 'kn-IN-Standard-A', ssmlGender: 'FEMALE' },
  ],
  es: [
    { languageCode: 'es-ES', name: 'es-ES-Neural2-A', ssmlGender: 'FEMALE' },
    { languageCode: 'es-ES', name: 'es-ES-Wavenet-C', ssmlGender: 'FEMALE' },
    { languageCode: 'es-ES', name: 'es-ES-Standard-A', ssmlGender: 'FEMALE' },
  ],
  fr: [
    { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A', ssmlGender: 'FEMALE' },
    { languageCode: 'fr-FR', name: 'fr-FR-Neural2-C', ssmlGender: 'FEMALE' },
    { languageCode: 'fr-FR', name: 'fr-FR-Wavenet-A', ssmlGender: 'FEMALE' },
    { languageCode: 'fr-FR', name: 'fr-FR-Standard-A', ssmlGender: 'FEMALE' },
  ],
  en: [
    { languageCode: 'en-US', name: 'en-US-Neural2-H', ssmlGender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Wavenet-F', ssmlGender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Standard-F', ssmlGender: 'FEMALE' },
  ],
};

export interface TtsResult {
  audioContent: string; // base64-encoded MP3
  voiceName: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[_~\[\]()]/g, '')
    .replace(/^\s*[-•]\s/gm, '')
    .substring(0, 4500); // Google TTS limit is 5000 chars
}

export async function synthesizeSpeech(text: string, langCode: string): Promise<TtsResult> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_TTS_API_KEY is not configured');

  const plain = stripMarkdown(text);

  const voices = VOICE_MAP[langCode] ?? VOICE_MAP['en'];

  // Try voices in preference order until one succeeds
  let lastError: Error | null = null;
  for (const voice of voices) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (globalThis as any).fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: plain },
            voice,
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: langCode === 'en' ? 0.95 : 0.85,
              pitch: 0.0,
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        lastError = new Error(`Google TTS ${response.status}: ${errText}`);
        continue; // try next voice in list
      }

      const data = await response.json() as { audioContent: string };
      console.log('[tts] synthesized with voice:', voice.name);
      return { audioContent: data.audioContent, voiceName: voice.name };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('All TTS voices failed');
}

export function isGoogleTtsConfigured(): boolean {
  return !!process.env.GOOGLE_TTS_API_KEY;
}

// ── Keyless fallback: Google Translate's public TTS endpoint ────────────────
// No API key or billing required. Each request is limited to ~200 characters,
// so longer text is split into sentence chunks and the MP3 buffers are
// concatenated (browsers play concatenated MP3 frame streams fine).

const TRANSLATE_TTS_LANG: Record<string, string> = {
  en: 'en', hi: 'hi', ta: 'ta', kn: 'kn', es: 'es', fr: 'fr',
};

const TRANSLATE_TTS_MAX_CHUNK = 180;

function chunkForTranslateTts(text: string): string[] {
  const sentences = text.split(/(?<=[.!?।…:;])\s+|\n+/);
  const chunks: string[] = [];
  let current = '';

  const push = (s: string) => { if (s.trim()) chunks.push(s.trim()); };

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;

    if (sentence.length > TRANSLATE_TTS_MAX_CHUNK) {
      push(current);
      current = '';
      let piece = '';
      for (const word of sentence.split(/\s+/)) {
        if ((`${piece} ${word}`).trim().length > TRANSLATE_TTS_MAX_CHUNK) {
          push(piece);
          piece = word;
        } else {
          piece = (`${piece} ${word}`).trim();
        }
      }
      push(piece);
    } else if ((`${current} ${sentence}`).trim().length > TRANSLATE_TTS_MAX_CHUNK) {
      push(current);
      current = sentence;
    } else {
      current = (`${current} ${sentence}`).trim();
    }
  }
  push(current);
  return chunks;
}

export async function synthesizeWithTranslateTts(text: string, langCode: string): Promise<TtsResult> {
  const tl = TRANSLATE_TTS_LANG[langCode] ?? 'en';
  const plain = stripMarkdown(text);
  const chunks = chunkForTranslateTts(plain);
  if (!chunks.length) throw new Error('No speakable text after markdown stripping');

  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const url =
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}` +
      `&q=${encodeURIComponent(chunk)}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (globalThis as any).fetch(url, {
      headers: {
        // Endpoint rejects requests without a browser-like user agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Translate TTS error ${response.status} for chunk of ${chunk.length} chars`);
    }
    buffers.push(Buffer.from(await response.arrayBuffer()));
  }

  console.log('[tts] synthesized with translate-tts fallback:', { lang: tl, chunks: chunks.length });
  return {
    audioContent: Buffer.concat(buffers).toString('base64'),
    voiceName: `translate-tts-${tl}`,
  };
}
