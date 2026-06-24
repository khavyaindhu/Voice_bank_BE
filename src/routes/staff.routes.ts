import { Router } from 'express';
import {
  getStaffCards,
  staffToggleFreeze,
  getReportTransactions,
  getReportSummary,
  getReportDepartments,
  getSpendingSummary,
  getReportCustomers,
  getAdminSettings,
} from '../controllers/staff.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Cards (no per-user auth — staff admin access)
router.get('/cards',                 getStaffCards);
router.patch('/cards/:id/freeze',    staffToggleFreeze);

// Reports
router.get('/reports/transactions',  getReportTransactions);
router.get('/reports/summary',       getReportSummary);
router.get('/reports/departments',   getReportDepartments);
router.get('/reports/spending-summary', getSpendingSummary);
router.get('/reports/customers',     getReportCustomers);

// Super admin only
router.get('/admin-settings', authenticate, requireRole('super_admin'), getAdminSettings);

export default router;
