// Translation service — uses Anthropic API directly via fetch (Node 18+)
// No SDK dependency; same approach as the test-api.mjs that was verified working.

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  kn: 'Kannada',
  es: 'Spanish',
};

export async function translateText(text: string, targetLangCode: string): Promise<string> {
  if (targetLangCode === 'en' || !SUPPORTED_LANGUAGES[targetLangCode]) return text;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('[translateText] apiKey present:', !!apiKey, '| lang:', targetLangCode);
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is not set');

  const languageName = SUPPORTED_LANGUAGES[targetLangCode];

  const prompt =
    `Translate the following banking assistant response to ${languageName}.\n\n` +
    `Rules:\n` +
    `1. Keep all markdown formatting exactly: **, *, ##, - bullet points, numbered lists, emojis\n` +
    `2. Do NOT translate — keep exactly as written:\n` +
    `   - Brand/product names: Maya, U.S. Bank, Zelle, ACH, Wire, Visa, Mastercard\n` +
    `   - Financial acronyms: EMI, APR, ABA, SWIFT, BIC, RD, CT\n` +
    `   - Dollar amounts: $2,500 / $15,000 etc\n` +
    `   - Masked account numbers: ****4523 / ****9012 etc\n` +
    `   - Phone numbers: 1-800-285-8585\n` +
    `   - Percentages with context: 6.75% APR\n` +
    `   - Route paths: /payments/wire, /dashboard etc\n` +
    `3. Return ONLY the translated text — no explanation, no preamble.\n\n` +
    `Text:\n${text}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (globalThis as any).fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      temperature: 0,   // deterministic — prevents word repetition hallucinations
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const block = data.content?.[0];
  return block?.type === 'text' ? block.text : text;
}

export async function translateCommandToEnglish(text: string, sourceLangCode: string): Promise<string> {
  if (!text.trim()) return text;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('[translateCommandToEnglish] apiKey present:', !!apiKey, '| source:', sourceLangCode);
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is not set');

  const sourceLanguage = SUPPORTED_LANGUAGES[sourceLangCode] ?? 'the user selected language';
  const prompt =
    `Convert this banking app command from ${sourceLanguage} to concise English so an existing English intent parser can understand it.\n\n` +
    `Rules:\n` +
    `1. Return ONLY the English command. No explanation, no quotes, no markdown.\n` +
    `2. Preserve names, customer IDs, account numbers, amounts, dates, and banking acronyms exactly when possible.\n` +
    `3. Convert number words to digits when useful, e.g. five hundred -> $500 if the user means money.\n` +
    `4. Preserve banking terms such as ACH, Wire, Zelle, FMS, Reports, Card Services, Dashboard.\n` +
    `5. If the input is already English, return it cleaned up in English.\n\n` +
    `Command:\n${text}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (globalThis as any).fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const block = data.content?.[0];
  return block?.type === 'text' ? block.text.trim() : text;
}
