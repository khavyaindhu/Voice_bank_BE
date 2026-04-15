// Rule-based banking assistant — no external API needed
// Matches user intent via keywords and returns context-aware responses

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  screen: string;
  formState?: Record<string, unknown>;
  accountSummary?: {
    checkingBalance?: number;
    savingsBalance?: number;
    creditBalance?: number;
  };
}

// ── Intent definitions ────────────────────────────────────────────
interface Intent {
  patterns: RegExp[];
  response: (ctx: ChatContext) => string;
}

const intents: Intent[] = [
  // Greetings
  {
    patterns: [/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy)/i],
    response: (ctx) => {
      const screenLabel = getScreenLabel(ctx.screen);
      return `Hello! 👋 I'm **Maya**, your U.S. Bank AI assistant.\n\nI can see you're on the **${screenLabel}** screen. I'm here to help you with:\n- **Transfers** — ACH, Wire, Zelle\n- **Payments** — Card payments, Bill pay\n- **Accounts** — Balances, RD details\n- **Loans** — Home, Auto, Personal loan guidance\n\nWhat can I help you with today?`;
    },
  },

  // Wire Transfer
  {
    patterns: [/wire\s*transfer/i, /wire\s*payment/i, /send\s*wire/i, /how.*wire/i, /initiate.*wire/i],
    response: (ctx) => {
      const prefix = ctx.screen === 'payments/wire'
        ? "You're already on the Wire Transfer screen! Here's what to fill in:\n\n"
        : "To make a Wire Transfer, go to **Payments → Wire Transfer**.\n\n";
      return prefix +
        `**Steps to complete a Wire Transfer:**\n\n` +
        `1. Select **Transfer Type** — Domestic or International\n` +
        `2. Choose your **From Account** (e.g., Checking ****9012)\n` +
        `3. Enter **Recipient's Full Legal Name**\n` +
        `4. Enter **Recipient Bank Name**\n` +
        `5. Enter **ABA Routing Number** (9 digits, for domestic)\n` +
        `   — For international, enter **SWIFT/BIC code** instead\n` +
        `6. Enter the **Amount** (fee: $25–$30 domestic, $45–$55 international)\n` +
        `7. Add a **Wire Purpose / Memo** (e.g., Invoice payment)\n` +
        `8. Click **Send Wire Transfer** and confirm\n\n` +
        `⚠️ **Wire transfers are irreversible.** Double-check all details before submitting.\n\n` +
        `⏰ Domestic wires sent before **4:00 PM CT** arrive same business day.`;
    },
  },

  // ACH Transfer
  {
    patterns: [/\bach\b/i, /ach\s*transfer/i, /bank\s*transfer/i, /how.*ach/i, /initiate.*ach/i],
    response: (ctx) => {
      const prefix = ctx.screen === 'payments/ach'
        ? "You're on the ACH Transfer screen! Here are the steps:\n\n"
        : "To make an ACH Transfer, go to **Payments → ACH Transfer**.\n\n";
      return prefix +
        `**Steps for ACH Transfer:**\n\n` +
        `1. Select **From Account**\n` +
        `2. Enter **Recipient's Full Name**\n` +
        `3. Enter **Bank Routing Number** (9 digits — found on the bottom-left of a check)\n` +
        `4. Enter **Recipient's Account Number**\n` +
        `5. Enter the **Amount**\n` +
        `6. Add optional **Memo**\n` +
        `7. Choose a **Schedule Date** or leave as today\n` +
        `8. Click **Submit ACH Transfer**\n\n` +
        `📅 ACH transfers take **1–3 business days** to process.\n` +
        `⏰ Cutoff time: **3:00 PM CT** for same-day initiation.`;
    },
  },

  // Zelle
  {
    patterns: [/zelle/i, /send.*money.*phone/i, /send.*money.*email/i, /how.*zelle/i],
    response: (ctx) => {
      const prefix = ctx.screen === 'payments/zelle'
        ? "You're on the Zelle screen! Here's what to do:\n\n"
        : "To send money via Zelle, go to **Payments → Zelle**.\n\n";
      return prefix +
        `**Steps to send via Zelle:**\n\n` +
        `1. Enter recipient's **Email address** or **Mobile phone number**\n` +
        `2. Enter the **Amount**\n` +
        `3. Add an optional **Memo**\n` +
        `4. Click **Send with Zelle**\n\n` +
        `⚡ Zelle payments are **instant** and typically **free**.\n` +
        `⚠️ Zelle transfers are **FINAL** — they cannot be reversed.\n\n` +
        `**Limits:** Daily $2,500 · Monthly $20,000\n` +
        `The recipient must have a Zelle-enrolled bank account.`;
    },
  },

  // Card Payment
  {
    patterns: [/card\s*payment/i, /pay.*credit\s*card/i, /pay.*card/i, /how.*pay.*card/i, /minimum\s*payment/i],
    response: (ctx) => {
      const prefix = ctx.screen === 'payments/card'
        ? "You're on the Card Payment screen! Here's how:\n\n"
        : "To pay your credit card, go to **Payments → Card Payment** or **Cards**.\n\n";
      return prefix +
        `**Steps to make a Card Payment:**\n\n` +
        `1. Select the **Credit Card** to pay\n` +
        `2. Choose payment type:\n` +
        `   - **Minimum Payment** — pay only the minimum due\n` +
        `   - **Full Balance** — pay the entire outstanding balance\n` +
        `   - **Custom Amount** — enter a specific amount\n` +
        `3. Select the **Source Account** (Checking/Savings)\n` +
        `4. Click **Make Payment**\n\n` +
        `📅 Payments post within **1–2 business days**.\n` +
        `💡 To avoid interest charges, always pay the **full balance** by the due date.`;
    },
  },

  // Balance / Account inquiry
  {
    patterns: [/balance/i, /how\s*much.*account/i, /account\s*balance/i, /check.*balance/i, /my\s*balance/i],
    response: (ctx) => {
      if (ctx.accountSummary && (ctx.accountSummary.checkingBalance !== undefined)) {
        return `**Your Current Account Balances:**\n\n` +
          `🏦 **Checking Account:** $${ctx.accountSummary.checkingBalance?.toLocaleString() ?? 'N/A'} available\n` +
          `💰 **Savings Account:** $${ctx.accountSummary.savingsBalance?.toLocaleString() ?? 'N/A'}\n` +
          `💳 **Credit Card Balance:** $${ctx.accountSummary.creditBalance?.toLocaleString() ?? 'N/A'}\n\n` +
          `For full details including RD account and transaction history, visit the **Accounts** section from the sidebar.`;
      }
      return `Your account balances are shown on the **Dashboard** and **Accounts** page.\n\n` +
        `- **Checking:** Available balance (updates in real-time)\n` +
        `- **Savings:** Current balance + interest rate\n` +
        `- **Credit Card:** Current balance, available credit, credit limit\n` +
        `- **RD Account:** Balance, monthly deposit, maturity date\n\n` +
        `Navigate to **Accounts** in the sidebar to see all balances.`;
    },
  },

  // RD / Recurring Deposit
  {
    patterns: [/\brd\b/i, /recurring\s*deposit/i, /fixed\s*deposit/i, /rd\s*account/i, /maturity/i],
    response: () =>
      `**Recurring Deposit (RD) Account Details:**\n\n` +
      `Your RD account details are shown on the **Accounts** page.\n\n` +
      `**How RD works:**\n` +
      `- You commit to depositing a **fixed amount each month**\n` +
      `- **Tenure:** 6 months to 10 years\n` +
      `- **Interest rate:** 4.5%–7.5% (higher tenure = higher rate)\n` +
      `- On **maturity**, principal + interest is credited to your linked savings account\n\n` +
      `⚠️ **Premature withdrawal:** Allowed with a **1% penalty** on earned interest.\n\n` +
      `Your current RD: **$1,500/month** for **24 months** at **6.5% p.a.**`,
  },

  // Home Loan
  {
    patterns: [/home\s*loan/i, /mortgage/i, /housing\s*loan/i, /apply.*home/i, /home.*loan.*process/i],
    response: () =>
      `**Home Loan Process at U.S. Bank:**\n\n` +
      `**Steps to Apply:**\n` +
      `1. Go to **Loans → Apply for a New Loan** → Select **Home Loan**\n` +
      `2. Enter property address & estimated value\n` +
      `3. Enter the loan amount needed\n` +
      `4. Submit income documents (W-2, pay stubs, tax returns)\n` +
      `5. Credit check initiated (soft pull first — no score impact)\n` +
      `6. Loan officer contacts you within **2–3 business days**\n` +
      `7. Conditional approval → Property appraisal → Final approval → Closing\n\n` +
      `**Key Details:**\n` +
      `- 📊 Current rate: ~**6.75% APR** (30-year fixed)\n` +
      `- 📋 Min. credit score: **620** (recommended: 740+)\n` +
      `- ⏱️ Typical closing time: 30–45 days`,
  },

  // Auto Loan
  {
    patterns: [/auto\s*loan/i, /car\s*loan/i, /vehicle\s*loan/i, /apply.*auto/i],
    response: () =>
      `**Auto Loan at U.S. Bank:**\n\n` +
      `- 📊 Rate: ~**8.5% APR**\n` +
      `- ⏳ Term: **24–84 months**\n` +
      `- ⚡ Instant pre-approval available online\n\n` +
      `**Documents needed:**\n` +
      `- Government-issued ID\n` +
      `- Proof of income (pay stubs)\n` +
      `- Vehicle details (VIN, dealer invoice)\n\n` +
      `Go to **Loans → Apply for a New Loan** → Select **Auto Loan** to get started.`,
  },

  // Personal Loan
  {
    patterns: [/personal\s*loan/i, /apply.*personal/i, /unsecured\s*loan/i],
    response: () =>
      `**Personal Loan at U.S. Bank:**\n\n` +
      `- 📊 Rate: **10.99%–19.99% APR** (based on credit score)\n` +
      `- 💵 Amounts: **$1,000–$50,000**\n` +
      `- ⏳ Term: **12–60 months**\n` +
      `- ⚡ Funds deposited in **1–2 business days** after approval\n\n` +
      `Go to **Loans → Apply for a New Loan** → Select **Personal Loan**.`,
  },

  // Loan EMI / existing loans
  {
    patterns: [/\bemi\b/i, /monthly\s*payment/i, /loan\s*detail/i, /outstanding.*loan/i, /my\s*loan/i, /loan.*balance/i],
    response: () =>
      `**Your Loan Details** are on the **Loans** page.\n\n` +
      `Your current **Home Loan:**\n` +
      `- 🏠 Outstanding Balance: **$287,500**\n` +
      `- 💰 Monthly EMI: **$2,270.15**\n` +
      `- 📊 Interest Rate: **6.75% APR**\n` +
      `- 📅 Next Due Date: shown on the Loans page\n` +
      `- ⏳ Loan End Date: March 2050\n\n` +
      `Navigate to **Loans** in the sidebar for full amortization details.`,
  },

  // Card details / rewards
  {
    patterns: [/card\s*detail/i, /reward\s*point/i, /credit\s*limit/i, /available\s*credit/i, /my\s*card/i, /card.*info/i],
    response: () =>
      `**Your Card Details** are on the **Cards** page.\n\n` +
      `**Credit Card (Visa ****4523):**\n` +
      `- 💳 Credit Limit: **$15,000**\n` +
      `- 💰 Current Balance: **$3,245.50**\n` +
      `- ✅ Available Credit: **$11,754.50**\n` +
      `- 🎁 Reward Points: **12,450 pts**\n` +
      `- 📅 Minimum Payment: $65.00\n\n` +
      `**U.S. Bank Card Options:**\n` +
      `- Visa Platinum — No annual fee, 0% intro APR for 15 months\n` +
      `- Altitude Go Visa — 4x points on dining\n` +
      `- Cash+ Visa Signature — 5% cash back on chosen categories\n\n` +
      `🔒 To freeze/unfreeze your card, visit **Cards** → Toggle Freeze.`,
  },

  // Freeze card
  {
    patterns: [/freeze\s*card/i, /lock\s*card/i, /unfreeze/i, /block\s*card/i, /lost\s*card/i, /stolen\s*card/i],
    response: () =>
      `**To Freeze or Unfreeze your card:**\n\n` +
      `1. Go to **Cards** in the sidebar\n` +
      `2. Select the card you want to manage\n` +
      `3. Click the **Freeze/Unfreeze** toggle\n\n` +
      `🔒 A frozen card **cannot be used** for new transactions.\n` +
      `✅ You can **unfreeze anytime** instantly.\n\n` +
      `📞 To report a **lost or stolen card**, call: **1-800-285-8585** immediately.`,
  },

  // Transaction history
  {
    patterns: [/transaction/i, /payment\s*history/i, /transfer\s*history/i, /past\s*payment/i, /recent.*payment/i],
    response: () =>
      `**Your Transaction History** is on the **Payments → History** page.\n\n` +
      `You can filter by:\n` +
      `- **Type** — ACH, Wire, Zelle, Card Payment\n` +
      `- **Date range**\n` +
      `- **Status** — Completed, Pending, Failed\n\n` +
      `Recent transactions include ACH, Zelle, and Wire transfers.`,
  },

  // Help / what can you do
  {
    patterns: [/help/i, /what\s*can\s*you/i, /what\s*do\s*you/i, /features/i, /capabilities/i],
    response: (ctx) => {
      const screenLabel = getScreenLabel(ctx.screen);
      return `I'm **Maya**, your U.S. Bank AI assistant. Here's what I can help with:\n\n` +
        `💸 **Payments & Transfers**\n` +
        `- ACH Transfer steps\n` +
        `- Wire Transfer (Domestic & International)\n` +
        `- Zelle payments\n` +
        `- Credit card payments\n\n` +
        `💰 **Account Info**\n` +
        `- Balance enquiries\n` +
        `- Recurring Deposit (RD) details\n` +
        `- Transaction history\n\n` +
        `🏦 **Loans**\n` +
        `- Home, Auto, Personal loan guidance\n` +
        `- EMI details & outstanding balance\n\n` +
        `💳 **Cards**\n` +
        `- Card details & reward points\n` +
        `- Freeze/unfreeze card\n\n` +
        `📍 You're currently on: **${screenLabel}**`;
    },
  },
];

// ── Screen-specific context hints ───────────────────────────────
const screenHints: Record<string, string> = {
  'payments/ach': `You're on the **ACH Transfer** screen. Fill in all required fields and click **Submit ACH Transfer**. Need help? Ask me about any field!`,
  'payments/wire': `You're on the **Wire Transfer** screen. Select Domestic or International, fill in recipient details, and click **Send Wire Transfer**.`,
  'payments/zelle': `You're on the **Zelle** screen. Enter the recipient's email or phone, amount, and click **Send with Zelle**.`,
  'payments/card': `You're on the **Card Payment** screen. Select your card, choose payment type, and click **Make Payment**.`,
  'loans/apply': `You're on the **Loan Application** screen. Select your loan type, enter the amount and tenure, then submit.`,
};

function getScreenLabel(screen: string): string {
  const labels: Record<string, string> = {
    'dashboard': 'Dashboard',
    'payments/ach': 'ACH Transfer',
    'payments/wire': 'Wire Transfer',
    'payments/zelle': 'Zelle',
    'payments/card': 'Card Payment',
    'payments/history': 'Transaction History',
    'accounts': 'Accounts',
    'cards': 'Cards',
    'loans': 'Loans',
    'loans/apply': 'Loan Application',
  };
  return labels[screen] ?? screen;
}

function findIntent(message: string, ctx: ChatContext): string | null {
  const lower = message.toLowerCase().trim();
  for (const intent of intents) {
    if (intent.patterns.some(p => p.test(lower))) {
      return intent.response(ctx);
    }
  }
  return null;
}

// ── Main chat function (no API key needed) ───────────────────────
export async function chat(
  messages: ChatMessage[],
  context: ChatContext
): Promise<string> {
  const lastMessage = messages[messages.length - 1]?.content ?? '';

  // 1. Check for direct intent match
  const intentResponse = findIntent(lastMessage, context);
  if (intentResponse) return intentResponse;

  // 2. Screen-specific hint if no intent matched and user sent a short/unclear message
  const screenHint = screenHints[context.screen];
  if (screenHint && lastMessage.split(' ').length <= 3) {
    return screenHint;
  }

  // 3. Contextual fallback based on current screen
  const screenLabel = getScreenLabel(context.screen);
  return `I'm here to help you on the **${screenLabel}** screen! 😊\n\n` +
    `I can answer questions about:\n` +
    `- How to complete this form\n` +
    `- Transfer limits and fees\n` +
    `- Processing times\n\n` +
    `Try asking: *"How do I make a wire transfer?"* or *"What are the ACH steps?"*\n\n` +
    `Or type **help** to see everything I can do.`;
}
