import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env automatically

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  kn: 'Kannada',
  es: 'Spanish',
};

export async function translateText(text: string, targetLangCode: string): Promise<string> {
  if (targetLangCode === 'en' || !SUPPORTED_LANGUAGES[targetLangCode]) return text;

  const languageName = SUPPORTED_LANGUAGES[targetLangCode];

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content:
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
          `Text:\n${text}`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === 'text' ? block.text : text;
}
