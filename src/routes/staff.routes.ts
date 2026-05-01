import { Router } from 'express';
import {
  getStaffCards,
  staffToggleFreeze,
  getReportTransactions,
  getReportSummary,
  getReportDepartments,
  getReportCustomers,
} from '../controllers/staff.controller';

const router = Router();

// Cards (no per-user auth — staff admin access)
router.get('/cards',                 getStaffCards);
router.patch('/cards/:id/freeze',    staffToggleFreeze);

// Reports
router.get('/reports/transactions',  getReportTransactions);
router.get('/reports/summary',       getReportSummary);
router.get('/reports/departments',   getReportDepartments);
router.get('/reports/customers',     getReportCustomers);

export default router;
