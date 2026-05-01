import { Request, Response } from 'express';
import Card from '../models/Card';
import LedgerEntry from '../models/LedgerEntry';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getDateRange(
  preset?: string,
  from?: string,
  to?: string,
): { start: Date; end: Date } {
  const now = new Date('2026-05-01'); // current date for POC
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (preset === 'currentmonth') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end:   today,
    };
  }
  if (preset === 'lastmonth') {
    const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    return {
      start: new Date(y, m, 1),
      end:   new Date(y, m + 1, 0, 23, 59, 59),
    };
  }
  if (preset === 'lastweek') {
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { start, end: today };
  }
  if (preset === 'last3months') {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 3);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start, end: today };
  }
  if (preset === 'ytd') {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end:   today,
    };
  }
  // custom range
  return {
    start: from ? new Date(from) : new Date(now.getFullYear(), 0, 1),
    end:   to   ? new Date(new Date(to).setHours(23, 59, 59)) : today,
  };
}

// ── Cards ────────────────────────────────────────────────────────────────────

/** GET /api/staff/cards — all cards across all customers */
export async function getStaffCards(req: Request, res: Response): Promise<void> {
  const { status, customerId, search } = req.query as Record<string, string>;

  // Only return staff-customer cards (those with a customerDisplayId set)
  const filter: Record<string, unknown> = {
    customerDisplayId: { $exists: true, $ne: '' },
    customerName:      { $exists: true, $ne: '' },
  };
  if (customerId) filter.customerDisplayId = customerId;
  if (status && status !== 'all') filter.status = status;
  if (search) {
    const rx = new RegExp(search, 'i');
    filter.$or = [
      { customerName: rx },
      { maskedNumber: rx },
      { customerDisplayId: rx },
    ];
  }

  const cards = await Card.find(filter).sort({ customerDisplayId: 1, cardType: 1 });
  res.json(cards);
}

/** PATCH /api/staff/cards/:id/freeze — staff freeze/unfreeze (no userId check) */
export async function staffToggleFreeze(req: Request, res: Response): Promise<void> {
  const card = await Card.findById(req.params.id);
  if (!card) { res.status(404).json({ message: 'Card not found' }); return; }

  if (card.status === 'frozen') {
    card.status = 'active';
  } else if (card.status === 'active' || card.status === 'expiring' || card.status === 'disputed') {
    card.status = 'frozen';
  }
  await card.save();
  res.json({ message: `Card ${card.status === 'frozen' ? 'frozen' : 'unfrozen'} successfully`, card });
}

// ── Reports ──────────────────────────────────────────────────────────────────

/**
 * GET /api/staff/reports/transactions
 * Query: preset | from+to | customerId | category | entryType | page | limit
 */
export async function getReportTransactions(req: Request, res: Response): Promise<void> {
  const {
    preset, from, to,
    customerId, category, entryType,
    page = '1', limit = '50',
  } = req.query as Record<string, string>;

  const { start, end } = getDateRange(preset, from, to);
  const pageN  = Math.max(1, parseInt(page));
  const limitN = Math.min(200, parseInt(limit));

  const filter: Record<string, unknown> = {
    date: { $gte: start, $lte: end },
  };
  if (customerId && customerId !== 'all') filter.customerDisplayId = customerId;
  if (category)   filter.category   = category;
  if (entryType)  filter.entryType  = entryType;

  const [entries, total] = await Promise.all([
    LedgerEntry.find(filter)
      .sort({ date: -1 })
      .skip((pageN - 1) * limitN)
      .limit(limitN),
    LedgerEntry.countDocuments(filter),
  ]);

  res.json({
    entries,
    total,
    page: pageN,
    pages: Math.ceil(total / limitN),
    dateRange: { from: start, to: end },
  });
}

/**
 * GET /api/staff/reports/summary
 * Aggregates monthly credit/debit totals within the date range.
 */
export async function getReportSummary(req: Request, res: Response): Promise<void> {
  const { preset, from, to } = req.query as Record<string, string>;
  const { start, end } = getDateRange(preset, from, to);

  const [monthly, totals, topCustomers] = await Promise.all([
    // Monthly aggregation
    LedgerEntry.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$date' },
            month: { $month: '$date' },
          },
          credits:  { $sum: { $cond: [{ $eq: ['$entryType', 'credit'] }, '$amount', 0] } },
          debits:   { $sum: { $cond: [{ $eq: ['$entryType', 'debit']  }, '$amount', 0] } },
          txCount:  { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // Overall totals
    LedgerEntry.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          totalCredits: { $sum: { $cond: [{ $eq: ['$entryType', 'credit'] }, '$amount', 0] } },
          totalDebits:  { $sum: { $cond: [{ $eq: ['$entryType', 'debit']  }, '$amount', 0] } },
          txCount:      { $sum: 1 },
        },
      },
    ]),

    // Top customers by volume
    LedgerEntry.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id:          '$customerDisplayId',
          customerName: { $first: '$customerName' },
          totalVolume:  { $sum: '$amount' },
          txCount:      { $sum: 1 },
          credits:      { $sum: { $cond: [{ $eq: ['$entryType', 'credit'] }, '$amount', 0] } },
          debits:       { $sum: { $cond: [{ $eq: ['$entryType', 'debit']  }, '$amount', 0] } },
        },
      },
      { $sort: { totalVolume: -1 } },
      { $limit: 6 },
    ]),
  ]);

  // Format monthly rows
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlySummary = monthly.map((m: { _id: { year: number; month: number }; credits: number; debits: number; txCount: number }) => ({
    month:   `${monthNames[m._id.month - 1]} ${m._id.year}`,
    credits: m.credits,
    debits:  m.debits,
    net:     m.credits - m.debits,
    txCount: m.txCount,
  }));

  res.json({
    monthlySummary,
    totals: totals[0] ?? { totalCredits: 0, totalDebits: 0, txCount: 0 },
    topCustomers,
    dateRange: { from: start, to: end },
  });
}

/**
 * GET /api/staff/reports/departments
 * Aggregates by category → mapped to department.
 */
export async function getReportDepartments(req: Request, res: Response): Promise<void> {
  const { preset, from, to } = req.query as Record<string, string>;
  const { start, end } = getDateRange(preset, from, to);

  const rows = await LedgerEntry.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id:    '$category',
        credits: { $sum: { $cond: [{ $eq: ['$entryType', 'credit'] }, '$amount', 0] } },
        debits:  { $sum: { $cond: [{ $eq: ['$entryType', 'debit']  }, '$amount', 0] } },
        count:   { $sum: 1 },
      },
    },
    { $sort: { debits: -1 } },
  ]);

  res.json({ departments: rows, dateRange: { from: start, to: end } });
}

/** GET /api/staff/reports/customers — distinct customer list for filter dropdown */
export async function getReportCustomers(req: Request, res: Response): Promise<void> {
  const customers = await LedgerEntry.aggregate([
    {
      $group: {
        _id:          '$customerDisplayId',
        customerName: { $first: '$customerName' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.json(customers.map((c: { _id: string; customerName: string }) => ({
    displayId: c._id,
    name: c.customerName,
  })));
}
