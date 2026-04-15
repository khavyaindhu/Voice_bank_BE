import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

const BANKING_KNOWLEDGE = `
## ACH Transfer Steps
1. Navigate to Payments → ACH Transfer
2. Select the source account (e.g., Checking ****1234)
3. Enter recipient's full name
4. Enter the recipient's bank routing number (9 digits, found on check bottom-left)
5. Enter recipient's account number
6. Enter the transfer amount
7. (Optional) Add a memo/note
8. (Optional) Schedule a future date, or leave as today
9. Click "Submit ACH Transfer"
10. You'll receive a reference number — save it for tracking
- ACH transfers typically take 1–3 business days
- Cutoff time: 3:00 PM CT for same-day initiation

## Wire Transfer Steps (Domestic)
1. Navigate to Payments → Wire Transfer
2. Select "Domestic Wire"
3. Select source account
4. Enter recipient's full legal name
5. Enter recipient's bank name
6. Enter ABA routing number (9 digits)
7. Enter recipient's account number
8. Enter amount (minimum $1, fee: $25–$30)
9. Add wire purpose/memo
10. Review all details carefully — wires are IRREVERSIBLE
11. Click "Send Wire" and confirm with your password
- Domestic wires sent before 4:00 PM CT typically arrive same business day
- International wires require SWIFT/BIC code instead of routing number

## Wire Transfer Steps (International)
- Same as domestic but select "International Wire"
- Enter SWIFT/BIC code of recipient's bank
- Enter recipient's IBAN (for European transfers) or account number
- Additional fields: country, currency, correspondent bank (if needed)
- Fees: $45–$55 + possible intermediary fees
- Timeline: 2–5 business days

## Zelle Transfer Steps
1. Navigate to Payments → Zelle
2. Enter recipient's email address OR mobile phone number
3. Enter amount (Zelle is instant, typically no fee)
4. Add optional memo
5. Click "Send with Zelle"
- Zelle transfers are INSTANT and FINAL — cannot be reversed
- Daily limit: $2,500; monthly limit: $20,000
- Recipient must also have a Zelle-enrolled account

## Card Payment Steps
1. Navigate to Cards
2. Select the credit card to pay
3. Choose payment type: Minimum Payment, Full Balance, or Custom Amount
4. Select source checking/savings account
5. Click "Make Payment"
- Payments post within 1–2 business days
- To avoid interest, pay the full balance by the due date

## Balance Enquiry
- Dashboard shows live balances for all accounts
- Checking: Available balance updates real-time
- Savings: Current balance + interest rate shown
- Credit Card: Current balance, available credit, and credit limit
- RD (Recurring Deposit): Monthly deposit amount, tenure, maturity date, interest rate

## Recurring Deposit (RD) Details
- RD is a fixed monthly deposit product
- You commit to depositing a fixed amount each month
- Tenure: 6 months to 10 years
- Interest rates: 4.5%–7.5% depending on tenure (higher tenure = higher rate)
- Premature withdrawal allowed with 1% penalty on interest
- On maturity, principal + interest is credited to your linked savings account

## Loan Process
### Home Loan
1. Go to Loans → Apply for Home Loan
2. Enter property address, estimated value, loan amount needed
3. Upload income documents (W-2, pay stubs, tax returns)
4. Credit check is initiated (soft pull first)
5. Loan officer contacts you within 2–3 business days
6. Conditional approval issued
7. Property appraisal scheduled
8. Final approval → closing documents → disbursement
- Current rate: ~6.75% APR (30-year fixed)
- Minimum credit score: 620; recommended: 740+

### Auto Loan
- Rate: ~8.5% APR; Term: 24–84 months
- Instant pre-approval available online
- Documents: ID, income proof, vehicle details (VIN, dealer invoice)

### Personal Loan
- Rate: 10.99%–19.99% APR based on credit score
- Amounts: $1,000–$50,000; Term: 12–60 months
- Funds deposited in 1–2 business days after approval

## Card Details (US Bank Specific)
- Visa Platinum: No annual fee, 0% intro APR for 15 months
- Altitude Go Visa: 4x points on dining, 2x on groceries/streaming
- Cash+ Visa Signature: 5% cash back on 2 chosen categories
- To report a lost/stolen card: 1-800-285-8585
`;

function buildSystemPrompt(context: ChatContext): string {
  const screenDescriptions: Record<string, string> = {
    'dashboard': 'the main Dashboard showing account summaries and recent activity',
    'payments/ach': 'the ACH Transfer form',
    'payments/wire': 'the Wire Transfer form',
    'payments/zelle': 'the Zelle Payment screen',
    'payments/card': 'the Card Payment screen',
    'accounts': 'the Accounts overview page',
    'accounts/detail': 'an Account Detail page',
    'cards': 'the Cards management page',
    'loans': 'the Loans overview page',
    'loans/apply': 'the Loan Application form',
    'payments/history': 'the Payment History / Transactions page',
  };

  const screenDesc = screenDescriptions[context.screen] || context.screen;
  const balanceSummary = context.accountSummary
    ? `\nCustomer's current balances: Checking $${context.accountSummary.checkingBalance?.toLocaleString() ?? 'N/A'}, Savings $${context.accountSummary.savingsBalance?.toLocaleString() ?? 'N/A'}, Credit Balance $${context.accountSummary.creditBalance?.toLocaleString() ?? 'N/A'}`
    : '';

  return `You are Maya, a helpful AI banking assistant for U.S. Bank. You are embedded in the U.S. Bank online portal.

CURRENT CONTEXT:
- The customer is currently on: ${screenDesc}${balanceSummary}
${context.formState ? `- Form fields filled: ${JSON.stringify(context.formState)}` : ''}

YOUR ROLE:
- Help customers navigate and complete banking tasks
- Provide clear, step-by-step guidance for payments, transfers, and account inquiries
- Be concise, professional, and friendly
- When the customer is on a specific screen, provide contextually relevant help for that screen
- For multi-step processes, present numbered steps clearly
- NEVER ask for full account numbers, passwords, or SSN — for security, reference only masked numbers
- If something seems like fraud or the customer is being coerced, gently remind them to call 1-800-US-BANKS

FORMATTING:
- Use **bold** for important terms and action items
- Use numbered lists for step-by-step instructions
- Keep responses focused and under 250 words unless detail is truly needed

BANKING KNOWLEDGE BASE:
${BANKING_KNOWLEDGE}`;
}

export async function chat(
  messages: ChatMessage[],
  context: ChatContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  });

  // Build history (all except last message)
  // Gemini requires: history must start with 'user' and alternate user/model
  const rawHistory = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Drop leading non-user messages to satisfy Gemini requirement
  const firstUserIdx = rawHistory.findIndex(m => m.role === 'user');
  const history = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

  const chatSession = model.startChat({ history });
  const lastMessage = messages[messages.length - 1]?.content || '';
  const result = await chatSession.sendMessage(lastMessage);
  return result.response.text();
}
