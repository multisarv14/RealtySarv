import { Router } from 'express';
import authRoutes from './auth';
import collectionRoutes from './collections';
import tenantRoutes from './tenants';
import { requireAuth } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
// Main site (no company yet): check an address / create a company.
router.use('/tenants', tenantRoutes);
// Everything below belongs to one company, chosen by the address in the browser (acme.realtysarv.com).
router.use('/auth', resolveTenant, authRoutes);
router.use('/', resolveTenant, requireAuth, collectionRoutes);

export default router;
