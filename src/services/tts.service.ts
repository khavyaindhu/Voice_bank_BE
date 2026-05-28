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

export async function synthesizeSpeech(text: string, langCode: string): Promise<TtsResult> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_TTS_API_KEY is not configured');

  // Strip markdown before sending to TTS
  const plain = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[_~\[\]()]/g, '')
    .replace(/^\s*[-•]\s/gm, '')
    .substring(0, 4500); // Google TTS limit is 5000 chars

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
