// Quick test to verify Anthropic API key is working
// Usage: node test-api.mjs
// Set ANTHROPIC_API_KEY in your environment before running

const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY environment variable is not set.');
  console.error('Run: export ANTHROPIC_API_KEY=your_key_here');
  process.exit(1);
}

console.log('Testing Anthropic API key...\n');

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    messages: [{ role: 'user', content: 'Say hello in one word' }]
  })
});

const data = await response.json();

if (data.error) {
  console.error('API key test FAILED:');
  console.error(JSON.stringify(data.error, null, 2));
  process.exit(1);
}

console.log('API key test PASSED!');
console.log('Model response:', data.content[0].text);
console.log('Model used:', data.model);
console.log('Tokens used:', data.usage);
